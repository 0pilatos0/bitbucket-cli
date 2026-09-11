/**
 * `bb api` — raw authenticated passthrough to the Bitbucket Cloud 2.0 API.
 *
 * Mirrors `gh api`: it sends any request through the already-authenticated axios
 * stack (Basic/Bearer auth, OAuth refresh, retry, redaction) so users are never
 * blocked on an endpoint the typed command families don't cover yet.
 */

import fs from 'node:fs';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BaseCommand } from '../core/base-command.js';
import { didYouMeanSuffix } from '../core/suggest.js';
import type { CommandContext } from '../core/interfaces/commands.js';
import type {
  IContextService,
  IOutputService,
} from '../core/interfaces/services.js';
import { BBError, ErrorCode, APIError } from '../types/errors.js';
import {
  buildFieldObject,
  buildRequestParts,
  findPlaceholders,
  getNextUrl,
  getValues,
  HTTP_METHODS,
  isHttpMethod,
  magicType,
  normalizeEndpoint,
  parseFieldAssignment,
  parseHeaders,
  resolveMethod,
  substitutePlaceholders,
  type FieldEntry,
} from '../services/api-passthrough.js';

export interface ApiCommandOptions {
  /** First positional: an HTTP verb (when `endpoint` is also present) or the endpoint. */
  methodOrEndpoint?: string;
  /** Second positional: the endpoint, present only when a leading verb was given. */
  endpoint?: string;
  /** `-X/--method` override. */
  method?: string;
  /** `-f/--raw-field` string fields (repeatable). */
  rawField?: string[];
  /** `-F/--field` typed fields with magic parsing and `@file`/`@-` (repeatable). */
  field?: string[];
  /** `--input` raw request body from a file, or `-` for stdin. */
  input?: string;
  /** `-H/--header` custom request headers (repeatable). */
  header?: string[];
  /** `-i/--include` print the HTTP status line and response headers before the body. */
  include?: boolean;
  /** `--paginate` follow the cursor `next` URL and merge `values`. */
  paginate?: boolean;
  workspace?: string;
  repo?: string;
}

export class ApiCommand extends BaseCommand<ApiCommandOptions, void> {
  public readonly name = 'api';
  public readonly description =
    'Make an authenticated request to the Bitbucket API';

  /** The caller supplied the endpoint, so `--workspace`/`--repo` advice on a
   * 404 would be misleading. */
  protected override readonly suppressNotFoundHint = true;

  /**
   * `-i/--include`, captured so {@link renderErrorDetails} (which cannot see
   * the per-invocation options) knows whether to print the status line and
   * headers. Safe as instance state because the CLI runs one command per
   * process — the same rationale as `BaseCommand.commandPath`.
   */
  private include = false;

  constructor(
    private readonly axios: AxiosInstance,
    private readonly contextService: IContextService,
    output: IOutputService
  ) {
    super(output);
  }

  public async execute(
    options: ApiCommandOptions,
    context: CommandContext
  ): Promise<void> {
    this.include = options.include === true;
    const { positionalMethod, endpointArg } = this.splitPositionals(options);

    const rawFields = options.rawField ?? [];
    const typedFields = options.field ?? [];
    const headerArgs = options.header ?? [];

    // --input is mutually exclusive with -f/-F (matches gh).
    if (
      options.input !== undefined &&
      (rawFields.length > 0 || typedFields.length > 0)
    ) {
      throw new BBError({
        code: ErrorCode.VALIDATION_INVALID,
        message:
          'Cannot use --input together with -f/--raw-field or -F/--field.',
      });
    }

    const headers = parseHeaders(headerArgs);
    // Auth is attached by the request interceptor and would override any
    // user-supplied Authorization anyway; reject it up front so the documented
    // "managed automatically" guarantee fails loudly instead of silently.
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase() === 'authorization') {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          message:
            'Authorization is managed automatically and cannot be set with -H. Run `bb auth login` to change credentials.',
        });
      }
    }

    const fieldEntries = await this.collectFields(rawFields, typedFields);
    const fields = buildFieldObject(fieldEntries);
    const rawBody =
      options.input !== undefined
        ? await this.readBody(options.input)
        : undefined;

    const hasParams = fieldEntries.length > 0 || rawBody !== undefined;
    const method = resolveMethod({
      explicit: options.method,
      positional: positionalMethod,
      hasParams,
    });

    const endpoint = await this.resolveEndpoint(endpointArg, options, context);
    const { query, data } = buildRequestParts({ method, fields, rawBody });
    const url = query
      ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`
      : endpoint;

    const config: AxiosRequestConfig = {
      url,
      method,
      ...(data !== undefined ? { data } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    };

    const isGetLike = method === 'GET' || method === 'HEAD';
    if (options.paginate && !isGetLike && !context.globalOptions.json) {
      this.output.warning(
        '--paginate only applies to GET/HEAD requests; ignoring it.'
      );
    }

    const response =
      options.paginate && isGetLike
        ? await this.fetchAllPages(config, headers)
        : await this.axios.request(config);
    if (options.include && !context.globalOptions.json) {
      this.printResponseMeta(response);
    }
    await this.renderBody(
      response.data,
      context,
      this.getContentType(response)
    );
  }

  /**
   * `bb api` surfaces the upstream error exchange. In `--json` mode the body
   * already rides on `APIError.toJSON()` as `response`; add the upstream status
   * text and response headers so scripts can inspect the full reply. The body/
   * status-line text rendering (text mode) lives in {@link renderErrorDetails}.
   */
  protected override errorJsonDetails(
    error: unknown,
    _context: CommandContext
  ): Record<string, unknown> {
    if (!(error instanceof APIError)) {
      return {};
    }
    return {
      ...(error.headers !== undefined ? { headers: error.headers } : {}),
      ...(error.statusText !== undefined
        ? { statusText: error.statusText }
        : {}),
    };
  }

  /**
   * Print the upstream response after the `✗` line, all on stderr so stdout
   * stays parseable: the status line and headers with `-i/--include` (matching
   * the success path), then the error body. No-op for failures that carry no
   * upstream response (network/validation errors).
   */
  protected override renderErrorDetails(
    error: unknown,
    _context: CommandContext
  ): void {
    if (!(error instanceof APIError)) {
      return;
    }

    const lines: string[] = [];
    if (this.include) {
      lines.push(
        ...responseMetaLines(error.statusCode, error.statusText, error.headers)
      );
    }

    const body = errorBodyLines(error.response);
    // Skip a body that merely repeats the message (a plain-text body such as
    // `Bad Request` becomes both, since the message falls back to the body).
    if (body.length > 0 && !(body.length === 1 && body[0] === error.message)) {
      lines.push(...body);
    }

    for (const line of lines) {
      this.output.stderr(line);
    }
  }

  /**
   * Resolve the leading positionals into a possible method verb and the
   * endpoint. With two positionals the first must be an HTTP verb; with one it
   * is the endpoint. Both ambiguous shapes (`bb api <path> <path>` and
   * `bb api GET` with no endpoint) are rejected loudly rather than silently
   * dropping an argument or requesting `/GET`.
   */
  private splitPositionals(options: ApiCommandOptions): {
    positionalMethod?: string;
    endpointArg: string;
  } {
    let positionalMethod: string | undefined;
    let endpointArg: string | undefined;

    if (options.endpoint !== undefined) {
      positionalMethod = options.methodOrEndpoint;
      endpointArg = options.endpoint;
      if (positionalMethod !== undefined && !isHttpMethod(positionalMethod)) {
        throw new BBError({
          code: ErrorCode.VALIDATION_INVALID,
          // Same suggestion as the `-X/--method` path (`resolveMethod`), so
          // `bb api GTE /user` and `bb api -X GTE /user` read alike.
          message:
            this.appendHelpHint(
              `'${positionalMethod}' is not a valid HTTP method. Expected one of: ${HTTP_METHODS.join(', ')}.`
            ) + didYouMeanSuffix(positionalMethod, HTTP_METHODS),
        });
      }
    } else {
      endpointArg = options.methodOrEndpoint;
    }

    if (endpointArg === undefined || endpointArg === '') {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          'An endpoint path is required (e.g. /user).'
        ),
      });
    }

    // A lone HTTP verb (`bb api GET`) is a missing endpoint, not a path.
    if (positionalMethod === undefined && isHttpMethod(endpointArg)) {
      throw new BBError({
        code: ErrorCode.VALIDATION_REQUIRED,
        message: this.appendHelpHint(
          `An endpoint path is required after the method (e.g. bb api ${endpointArg.toUpperCase()} /user).`
        ),
      });
    }

    return positionalMethod !== undefined
      ? { positionalMethod, endpointArg }
      : { endpointArg };
  }

  /**
   * Parse `-f` (string) and `-F` (typed) fields into ordered entries, resolving
   * `@file` / `@-` (stdin) values for typed fields.
   */
  private async collectFields(
    rawFields: readonly string[],
    typedFields: readonly string[]
  ): Promise<FieldEntry[]> {
    const entries: FieldEntry[] = [];

    for (const raw of rawFields) {
      const { key, rawValue } = parseFieldAssignment(raw);
      entries.push({ key, value: rawValue });
    }

    for (const raw of typedFields) {
      const { key, rawValue } = parseFieldAssignment(raw);
      if (rawValue.startsWith('@')) {
        const source = rawValue.slice(1);
        const value =
          source === '-' ? await this.readStdin() : this.readFile(source);
        entries.push({ key, value });
      } else {
        entries.push({ key, value: magicType(rawValue) });
      }
    }

    return entries;
  }

  /**
   * Substitute `{workspace}`/`{repo}` placeholders (resolving repo context only
   * when needed) and normalize the endpoint into a safe request URL.
   */
  private async resolveEndpoint(
    endpointArg: string,
    options: ApiCommandOptions,
    context: CommandContext
  ): Promise<string> {
    const placeholders = findPlaceholders(endpointArg);
    let substituted = endpointArg;

    if (placeholders.repo) {
      const repoContext = await this.contextService.requireRepoContextFor(
        options,
        context
      );
      substituted = substitutePlaceholders(endpointArg, {
        workspace: repoContext.workspace,
        repo: repoContext.repoSlug,
      });
    } else if (placeholders.workspace) {
      const workspace = await this.contextService.requireWorkspace(
        options.workspace
      );
      substituted = substitutePlaceholders(endpointArg, { workspace });
    }

    return normalizeEndpoint(substituted);
  }

  /**
   * Follow the Bitbucket cursor (`next`) across pages, merging every `values`
   * array into a single `{ values: [...] }` payload.
   */
  private async fetchAllPages(
    config: AxiosRequestConfig,
    headers: Record<string, string>
  ): Promise<AxiosResponse> {
    const first = await this.axios.request(config);
    const firstValues = getValues(first.data);

    if (firstValues === undefined) {
      if (!this.output.isJsonMode()) {
        this.output.warning(
          '--paginate: response has no "values" array; returning the first page only.'
        );
      }
      return first;
    }

    const collected: unknown[] = [...firstValues];
    let next = getNextUrl(first.data);

    while (next) {
      // Defensive: ensure the server-provided cursor stays on the API host.
      const nextUrl = normalizeEndpoint(next);
      const response = await this.axios.request({
        url: nextUrl,
        method: 'GET',
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      });
      const values = getValues(response.data) ?? [];
      collected.push(...values);
      next = getNextUrl(response.data);
    }

    // first.status/headers are preserved, so -i/--include reflects the first
    // page's status line and headers in --paginate mode.
    return { ...first, data: { values: collected } };
  }

  /**
   * Print the HTTP status line and response headers (`-i/--include`), followed
   * by a blank line, ahead of the body. Success output goes to stdout; error
   * output (see {@link renderErrorDetails}) writes the same lines to stderr.
   */
  private printResponseMeta(response: AxiosResponse): void {
    for (const line of responseMetaLines(
      response.status,
      response.statusText,
      response.headers as Record<string, unknown> | undefined
    )) {
      this.output.text(line);
    }
  }

  private getContentType(response: AxiosResponse): string | undefined {
    const raw = (response.headers as Record<string, unknown> | undefined)?.[
      'content-type'
    ];
    return typeof raw === 'string' ? raw : undefined;
  }

  /**
   * Render a successful response body. JSON payloads route through
   * `output.json()` so `--json` field projection and `--jq` apply; genuinely
   * non-JSON (string) bodies pass through verbatim. An empty body still emits
   * `{}` in JSON mode so a downstream `jq` never receives zero bytes.
   *
   * Error bodies do NOT use this path — {@link renderErrorDetails} writes them
   * raw to stderr so they can't be projected or mixed into stdout.
   */
  private async renderBody(
    data: unknown,
    context: CommandContext,
    contentType?: string
  ): Promise<void> {
    if (data === undefined || data === null || data === '') {
      if (context.globalOptions.json) {
        await this.output.json({});
      }
      return;
    }

    if (typeof data === 'string') {
      // A string body with a JSON content-type is a JSON scalar (e.g. "hi") or
      // an unparsed payload — quote it through json(). Missing/unknown
      // content-types default to verbatim so raw diffs/patches print as-is.
      if (contentType !== undefined && /\bjson\b/i.test(contentType)) {
        await this.output.json(data);
      } else {
        this.output.text(data);
      }
      return;
    }

    await this.output.json(data);
  }

  private async readBody(input: string): Promise<string> {
    return input === '-' ? this.readStdin() : this.readFile(input);
  }

  protected readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      // Append the underlying reason (e.g. EACCES/EISDIR) that handleError
      // would otherwise drop, so permission/dir mistakes are diagnosable.
      const reason = error instanceof Error ? `: ${error.message}` : '';
      throw new BBError({
        code: ErrorCode.FILE_NOT_FOUND,
        message: `Could not read file '${filePath}'${reason}`,
        cause: error instanceof Error ? error : undefined,
        context: { path: filePath },
      });
    }
  }

  protected async readStdin(): Promise<string> {
    return Bun.stdin.text();
  }
}

/**
 * Format an HTTP status line plus response headers and a trailing blank line
 * for `-i/--include`. Shares one implementation between the success path
 * (stdout) and the error path (stderr) so the two can't drift.
 *
 * HTTP/2 has no reason phrase and some transports/mocks report `statusText`
 * equal to the numeric status; such a phrase is omitted to avoid `400 400`.
 */
function responseMetaLines(
  status: number,
  statusText: string | undefined,
  headers: Record<string, unknown> | undefined
): string[] {
  const phrase = statusText?.trim();
  const suffix = phrase && phrase !== String(status) ? ` ${phrase}` : '';
  const lines = [`HTTP/1.1 ${status}${suffix}`];
  for (const [name, value] of Object.entries(headers ?? {})) {
    lines.push(`${name}: ${String(value)}`);
  }
  lines.push('');
  return lines;
}

/**
 * Render an upstream error body for stderr. Deliberately does NOT route through
 * `renderBody`/`output.json()`: error output must not be field-projected,
 * `--jq`-filtered, or written to stdout. JSON payloads are pretty-printed;
 * string bodies are passed through line by line.
 */
function errorBodyLines(data: unknown): string[] {
  if (data === undefined || data === null || data === '') {
    return [];
  }
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return text === undefined ? [] : text.split('\n');
}
