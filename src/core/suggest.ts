/**
 * "Did you mean ...?" matcher for invalid user input.
 *
 * Commander already suggests close matches for unknown subcommands and
 * unknown options (`bb pr lst` -> `(Did you mean list?)`), but its
 * `suggestSimilar` lives at `commander/lib/suggestSimilar.js`, which is not
 * reachable through the package's `exports` map — so it cannot be imported.
 * This is a port of that algorithm (Commander, MIT licence) kept
 * deliberately close to the original so root-level, subcommand and enum
 * suggestions all read identically.
 *
 * Three intentional deviations from upstream:
 *
 * 1. **Case-folded comparison, canonical output.** Upstream compares
 *    case-sensitively, which makes the common case unfixable: our enum sets
 *    are single-case (`PR_STATES` is UPPERCASE, `ISSUE_STATES` is
 *    lowercase), so `--state opne` finds nothing against
 *    `['OPEN', ...]`. We match on lowercase and return the candidate's own
 *    spelling, so the suggestion is always a value the user can paste back.
 * 2. **No `--` prefix slicing.** Upstream strips a leading `--` from the
 *    search word and two characters from *every* candidate. That is correct
 *    for its own option-name call site but wrong here: the check fires on
 *    the user's value, so a value like `--foo` compared against
 *    `['created_on', ...]` would slice every candidate into garbage
 *    (`'created_on'.slice(2) === 'eated_on'`). Values that merely start
 *    with a single `-` (the descending `-created_on` sort forms) are
 *    unaffected either way.
 * 3. **Returns an array**, leaving the wording to `formatDidYouMean` so
 *    callers can compose their own lines.
 */

/**
 * Maximum accepted edit distance. Note that because `bestDistance` starts
 * *at* this value and a candidate is accepted on `distance === bestDistance`
 * as well as `distance < bestDistance`, the effective accepted range is 0-3
 * inclusive — a distance-3 candidate is suggested when nothing closer was
 * found. Upstream behaves the same way; dropping the equality branch would
 * silently narrow our suggestions relative to Commander's.
 */
const MAX_DISTANCE = 3;

/** Reject matches that share less than this fraction of their length. */
const MIN_SIMILARITY = 0.4;

/**
 * Optimal string alignment distance (Damerau-Levenshtein restricted so no
 * substring is edited more than once).
 */
function editDistance(a: string, b: string): number {
  // Quick early exit, return worst case. This is why a long candidate is
  // never suggested for a short word regardless of shared prefix:
  // `editDistance('created', '-created_on')` returns 11, not 4.
  if (Math.abs(a.length - b.length) > MAX_DISTANCE) {
    return Math.max(a.length, b.length);
  }

  // distance between prefix substrings of a and b
  const d: number[][] = [];

  // pure deletions turn a into empty string
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  // pure insertions turn empty string into b
  for (let j = 0; j <= b.length; j++) {
    d[0]![j] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i]![j] = Math.min(
        d[i - 1]![j]! + 1, // deletion
        d[i]![j - 1]! + 1, // insertion
        d[i - 1]![j - 1]! + cost // substitution
      );
      // transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
      }
    }
  }

  return d[a.length]![b.length]!;
}

/**
 * Find the candidates closest to `value`, comparing case-insensitively and
 * returning each candidate's canonical spelling. Only the best-scoring tier
 * is returned, so a clear winner is never diluted by weaker matches.
 * Returns an empty array when nothing is close enough — callers must treat
 * that as "say nothing" rather than guessing.
 */
export function suggestSimilar(
  value: string,
  candidates: readonly string[]
): string[] {
  if (!candidates || candidates.length === 0) return [];

  const word = value.toLowerCase();
  // Dedupe on the canonical spelling, matching upstream.
  const unique = Array.from(new Set(candidates));

  let similar: string[] = [];
  let bestDistance = MAX_DISTANCE;

  for (const candidate of unique) {
    if (candidate.length <= 1) continue; // no one character guesses

    const distance = editDistance(word, candidate.toLowerCase());
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > MIN_SIMILARITY) {
      if (distance < bestDistance) {
        // better edit distance, throw away previous worse matches
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  }

  // Case folding means a set containing both `open` and `OPEN` would
  // otherwise suggest the same word twice.
  const seen = new Set<string>();
  const deduped = similar.filter((candidate) => {
    const key = candidate.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => a.localeCompare(b));
}

/**
 * Render matches as a standalone line, worded exactly like Commander's own
 * suggestions (minus its leading newline — callers compose lines) so
 * `bb pr lst` and `bb pr list --state opne` read the same. Returns `''` when
 * there is nothing to suggest, so callers can append unconditionally.
 */
export function formatDidYouMean(matches: readonly string[]): string {
  if (matches.length > 1) {
    return `(Did you mean one of ${matches.join(', ')}?)`;
  }
  if (matches.length === 1) {
    return `(Did you mean ${matches[0]}?)`;
  }
  return '';
}

/**
 * Convenience wrapper for the common "append a suggestion line to an error
 * message" shape: returns `'\n(Did you mean x?)'` or `''`.
 */
export function didYouMeanSuffix(
  value: string,
  candidates: readonly string[]
): string {
  const suggestion = formatDidYouMean(suggestSimilar(value, candidates));
  return suggestion ? `\n${suggestion}` : '';
}
