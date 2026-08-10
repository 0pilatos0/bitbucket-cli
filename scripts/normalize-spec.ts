#!/usr/bin/env bun
// Rewrites the pinned upstream Bitbucket Cloud spec into a generation-ready
// copy that fixes upstream warts BEFORE the generator sees them, instead of
// string-patching generated output afterwards:
//
//   - content-shaped inline schemas (comment.content, issue.content,
//     task.content, pullrequest.summary, base_commit.summary,
//     issue_change.message) are promoted to a shared `comment_content`
//     definition and replaced with $refs, so the generator emits a typed
//     model with its enum in the standard const+typeof idiom, in place.
//   - comment.inline is promoted to a `comment_inline` definition.
//   - pipeline_selector.type is marked required (the API requires it).
//
// Everything else upstream flattens to plain `object` (links, rendered) is
// accepted as-is: it is a deliberate upstream spec decision, not an accident.
//
// The transform is table-driven and asserts every target schema before
// writing, so upstream shape drift fails the build loudly instead of silently
// weakening the generated types.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');
const specPath = resolve(repoRoot, 'specs/bitbucket-cloud.json');
const outPath = resolve(repoRoot, 'specs/bitbucket-cloud.normalized.json');

interface SpecField {
  type?: string;
  enum?: unknown[];
  description?: string;
  properties?: Record<string, SpecField>;
  required?: string[];
  additionalProperties?: boolean | Record<string, unknown>;
  $ref?: string;
  [key: string]: unknown;
}

interface SpecSchema extends SpecField {
  allOf?: Array<SpecField | { $ref: string }>;
}

interface ApiSpec {
  definitions: Record<string, SpecSchema>;
  [key: string]: unknown;
}

const CONTENT_KEYS = ['raw', 'markup', 'html'];
const INLINE_KEYS = ['from', 'to', 'start_from', 'start_to', 'path'];
const CONTENT_REF = '#/definitions/comment_content';
const INLINE_REF = '#/definitions/comment_inline';

// Target fields, keyed by definition name. The inline schemas must keep these
// exact property sets; any drift fails generation with a loud error.
const CONTENT_FIELDS: Array<[string, string]> = [
  ['comment', 'content'],
  ['issue', 'content'],
  ['task', 'content'],
  ['pullrequest', 'summary'],
  ['base_commit', 'summary'],
  ['issue_change', 'message'],
];
const INLINE_FIELDS: Array<[string, string]> = [['comment', 'inline']];

function allProps(def: SpecSchema): Record<string, SpecField> {
  const props: Record<string, SpecField> = {};
  if (def.properties) Object.assign(props, def.properties);
  for (const part of def.allOf ?? []) {
    const typed = part as SpecField;
    if (typed.properties) Object.assign(props, typed.properties);
  }
  return props;
}

function assertShape(
  field: SpecField | undefined,
  keys: string[],
  where: string
): asserts field is SpecField {
  if (!field) {
    throw new Error(
      `normalize-spec: ${where} no longer exists in the spec; update scripts/normalize-spec.ts`
    );
  }
  const actual = Object.keys(field.properties ?? {})
    .sort()
    .join(',');
  const expected = [...keys].sort().join(',');
  if (actual !== expected) {
    throw new Error(
      `normalize-spec: ${where} inline schema changed shape (expected [${expected}], got [${actual}]); update scripts/normalize-spec.ts`
    );
  }
}

function replaceField(
  def: SpecSchema,
  fieldName: string,
  replacement: SpecField,
  where: string
): void {
  if (def.properties?.[fieldName]) {
    def.properties[fieldName] = replacement;
    return;
  }
  for (const part of def.allOf ?? []) {
    const typed = part as SpecField;
    if (typed.properties?.[fieldName]) {
      typed.properties[fieldName] = replacement;
      return;
    }
  }
  throw new Error(
    `normalize-spec: ${where}.${fieldName} not found; update scripts/normalize-spec.ts`
  );
}

function promoteFields(
  defs: Record<string, SpecSchema>,
  targets: Array<[string, string]>,
  keys: string[],
  ref: string
): void {
  for (const [defName, fieldName] of targets) {
    const def = defs[defName];
    if (!def) {
      throw new Error(
        `normalize-spec: definition ${defName} no longer exists; update scripts/normalize-spec.ts`
      );
    }
    const field = allProps(def)[fieldName];
    assertShape(field, keys, `${defName}.${fieldName}`);
    replaceField(def, fieldName, { $ref: ref }, defName);
  }
}

const spec = JSON.parse(readFileSync(specPath, 'utf8')) as ApiSpec;
const defs = spec.definitions;

if (defs.comment_content || defs.comment_inline) {
  throw new Error(
    'normalize-spec: upstream now defines comment_content/comment_inline; remove the promotion logic in scripts/normalize-spec.ts'
  );
}

const commentProps = allProps(defs.comment);
const contentField = commentProps['content'];
const inlineField = commentProps['inline'];
assertShape(contentField, CONTENT_KEYS, 'comment.content');
assertShape(inlineField, INLINE_KEYS, 'comment.inline');

// Derive the promoted definitions from the current comment schemas so enum
// values and required lists stay in sync with upstream.
const commentContent = structuredClone(contentField);
const commentInline = structuredClone(inlineField);

promoteFields(defs, CONTENT_FIELDS, CONTENT_KEYS, CONTENT_REF);
promoteFields(defs, INLINE_FIELDS, INLINE_KEYS, INLINE_REF);

defs.comment_content = commentContent;
defs.comment_inline = commentInline;

const selector = defs.pipeline_selector;
if (!selector) {
  throw new Error(
    'normalize-spec: definition pipeline_selector no longer exists; update scripts/normalize-spec.ts'
  );
}
const selectorPart = (selector.allOf ?? []).find((part) => {
  const typed = part as SpecField;
  return typed.properties?.type?.enum !== undefined;
}) as SpecField | undefined;
if (!selectorPart) {
  throw new Error(
    'normalize-spec: pipeline_selector.type enum not found; update scripts/normalize-spec.ts'
  );
}
selectorPart.required = Array.from(
  new Set([...(selectorPart.required ?? []), 'type'])
);

writeFileSync(outPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(
  'normalize-spec: wrote specs/bitbucket-cloud.normalized.json (gitignored; derived from the pinned spec)'
);
