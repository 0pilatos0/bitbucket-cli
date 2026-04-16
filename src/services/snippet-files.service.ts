/**
 * Service for snippet endpoints that need multipart uploads or raw file
 * content. The generated OpenAPI client only models these endpoints as
 * JSON — insufficient for Bitbucket's real contract, which requires
 * `multipart/form-data` on create/edit with files.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { AxiosInstance } from 'axios';

export interface SnippetFileInput {
  /** Absolute or relative path on disk */
  path: string;
  /** Name to use in the multipart part; defaults to basename(path) */
  filename?: string;
}

export interface CreateSnippetMultipartOptions {
  workspace: string;
  title: string;
  isPrivate: boolean;
  files: SnippetFileInput[];
}

export interface EditSnippetMetadataOptions {
  workspace: string;
  encodedId: string;
  title?: string;
  isPrivate?: boolean;
}

export interface EditSnippetMultipartOptions {
  workspace: string;
  encodedId: string;
  title?: string;
  isPrivate?: boolean;
  files: SnippetFileInput[];
}

export class SnippetFilesService {
  constructor(private readonly axios: AxiosInstance) {}

  public async createWithFiles(
    options: CreateSnippetMultipartOptions
  ): Promise<unknown> {
    const form = this.buildForm(
      options.title,
      options.isPrivate,
      options.files
    );
    const response = await this.axios.post(
      `/snippets/${encodeURIComponent(options.workspace)}`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  public async editMetadata(
    options: EditSnippetMetadataOptions
  ): Promise<unknown> {
    const body: Record<string, unknown> = {};
    if (options.title !== undefined) {
      body.title = options.title;
    }
    if (options.isPrivate !== undefined) {
      body.is_private = options.isPrivate;
    }

    const response = await this.axios.put(
      `/snippets/${encodeURIComponent(options.workspace)}/${encodeURIComponent(options.encodedId)}`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  public async editWithFiles(
    options: EditSnippetMultipartOptions
  ): Promise<unknown> {
    const form = this.buildForm(
      options.title,
      options.isPrivate,
      options.files
    );
    const response = await this.axios.put(
      `/snippets/${encodeURIComponent(options.workspace)}/${encodeURIComponent(options.encodedId)}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  /**
   * Fetch a single file's raw contents from a snippet.
   */
  public async getFileContent(
    workspace: string,
    encodedId: string,
    filePath: string
  ): Promise<string> {
    const response = await this.axios.get<string>(
      `/snippets/${encodeURIComponent(workspace)}/${encodeURIComponent(encodedId)}/files/${encodeFilePath(filePath)}`,
      {
        responseType: 'text',
        transformResponse: [
          (v: unknown) => (typeof v === 'string' ? v : String(v ?? '')),
        ],
        headers: { Accept: '*/*' },
      }
    );
    return typeof response.data === 'string'
      ? response.data
      : String(response.data ?? '');
  }

  private buildForm(
    title: string | undefined,
    isPrivate: boolean | undefined,
    files: SnippetFileInput[]
  ): FormData {
    const form = new FormData();

    if (title !== undefined) {
      form.append('title', title);
    }
    if (isPrivate !== undefined) {
      form.append('is_private', isPrivate ? 'true' : 'false');
    }

    for (const file of files) {
      const name = file.filename ?? path.basename(file.path);
      const buffer = fs.readFileSync(file.path);
      const blob = new Blob([buffer]);
      form.append('file', blob, name);
    }

    return form;
  }
}

function encodeFilePath(filePath: string): string {
  return filePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}
