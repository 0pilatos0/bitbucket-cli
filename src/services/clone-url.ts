/**
 * Git clone URLs for Bitbucket Cloud repositories.
 */

import { coerceGitProtocolValue } from '../types/config.js';
import type { BBConfig, GitProtocol } from '../types/config.js';

export function getConfiguredProtocol(config: BBConfig): GitProtocol {
  return coerceGitProtocolValue(config.gitProtocol) ?? 'ssh';
}

export function buildCloneUrl(fullName: string, protocol: GitProtocol): string {
  return protocol === 'https'
    ? `https://bitbucket.org/${fullName}.git`
    : `git@bitbucket.org:${fullName}.git`;
}

export function getUrlProtocol(url: string): GitProtocol {
  return /^https?:\/\//.test(url) ? 'https' : 'ssh';
}
