/**
 * Simple fuzzy search implementation for matching partial/misspelled text
 */

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculate fuzzy match score (0-1, higher is better)
 */
export const fuzzyScore = (query: string, target: string): number => {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Exact match
  if (t === q) return 1;

  // Contains match (high priority)
  if (t.includes(q)) return 0.9;

  // Starts with match (high priority)
  if (t.startsWith(q)) return 0.95;

  // Word starts with query
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.85;
  }

  // Check if query matches beginning of any word
  for (const word of words) {
    if (word.includes(q)) return 0.7;
  }

  // Levenshtein distance for typo tolerance
  // Only check if query is reasonably close in length
  if (Math.abs(q.length - t.length) <= Math.max(3, q.length * 0.5)) {
    const distance = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - distance / maxLen;
    
    // Only return if similarity is above threshold
    if (similarity >= 0.5) return similarity * 0.6;
  }

  // Check each word for typo tolerance
  for (const word of words) {
    if (Math.abs(q.length - word.length) <= 2) {
      const distance = levenshteinDistance(q, word);
      const similarity = 1 - distance / Math.max(q.length, word.length);
      if (similarity >= 0.6) return similarity * 0.5;
    }
  }

  return 0;
};

/**
 * Fuzzy filter and sort an array of items
 */
export const fuzzyFilter = <T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string[],
  minScore: number = 0.3
): T[] => {
  if (!query.trim()) return [];

  const scored = items
    .map((item) => {
      const texts = getSearchableText(item);
      const maxScore = Math.max(...texts.map((text) => fuzzyScore(query, text)));
      return { item, score: maxScore };
    })
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item }) => item);
};
