import type { LaraIntentMatch } from '../types/laraTypes';
import { LARA_MODULES } from '../data/laraKnowledgeBase';

const PRIMARY_WEIGHT = 3;
const SECONDARY_WEIGHT = 1;
const SUBTOPIC_BONUS = 2;
const MIN_SCORE_THRESHOLD = 2;

/** Normalize text: lowercase, remove accents, trim */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Check if a keyword appears in the normalized input */
function keywordMatches(normalizedInput: string, keyword: string): boolean {
  return normalizedInput.includes(normalize(keyword));
}

/** Match user input against all modules, return sorted results */
export function matchIntent(userInput: string): LaraIntentMatch[] {
  const normalizedInput = normalize(userInput);
  if (!normalizedInput || normalizedInput.length < 2) return [];

  const matches: LaraIntentMatch[] = [];

  for (const mod of LARA_MODULES) {
    let score = 0;
    const matchedKeywords: string[] = [];
    let bestSubTopicId: string | undefined;
    let bestSubTopicScore = 0;

    for (const kw of mod.keywords.primary) {
      if (keywordMatches(normalizedInput, kw)) {
        score += PRIMARY_WEIGHT;
        matchedKeywords.push(kw);
      }
    }

    for (const kw of mod.keywords.secondary) {
      if (keywordMatches(normalizedInput, kw)) {
        score += SECONDARY_WEIGHT;
        matchedKeywords.push(kw);
      }
    }

    for (const sub of mod.subTopics) {
      let subScore = 0;
      for (const kw of sub.keywords) {
        if (keywordMatches(normalizedInput, kw)) {
          subScore += SUBTOPIC_BONUS;
          if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
        }
      }
      if (subScore > bestSubTopicScore) {
        bestSubTopicScore = subScore;
        bestSubTopicId = sub.id;
      }
    }

    score += bestSubTopicScore;

    if (score >= MIN_SCORE_THRESHOLD) {
      matches.push({ moduleId: mod.id, score, matchedKeywords, subTopicId: bestSubTopicId });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches;
}

/** Get the single best match, or null */
export function getBestMatch(userInput: string): LaraIntentMatch | null {
  const matches = matchIntent(userInput);
  return matches.length > 0 ? matches[0] : null;
}
