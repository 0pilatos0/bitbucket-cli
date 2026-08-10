/**
 * Shared helpers for the `bb snippet` command group.
 */

import type { SnippetComment } from '../../generated/api.js';

/** Build the request body for a snippet comment. */
export function buildSnippetComment(message: string): SnippetComment {
  return {
    type: 'snippet_comment',
    content: { raw: message },
  };
}
