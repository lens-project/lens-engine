import { type RankingResult, type ScoringResult, type RelevanceCategory, type RankingErrorData } from '../types.ts';

/**
 * Check if a ranking result is an error
 */
export function isRankingError(result: RankingResult): result is RankingErrorData {
  return 'type' in result && 'message' in result;
}

/**
 * Check if a ranking result is a successful scoring result
 */
export function isScoringResult(result: RankingResult): result is ScoringResult {
  return 'score' in result && 'confidence' in result && 'method' in result;
}

/**
 * Filter ranking results to only include successful scores
 */
export function getSuccessfulResults(results: RankingResult[]): ScoringResult[] {
  return results.filter(isScoringResult);
}

/**
 * Filter ranking results to only include errors
 */
export function getErrorResults(results: RankingResult[]): RankingErrorData[] {
  return results.filter(isRankingError);
}

/**
 * Calculate statistics from a batch of ranking results
 */
export interface RankingStats {
  totalArticles: number;
  successfulRankings: number;
  errorCount: number;
  averageScore: number;
  medianScore: number;
  highInterestCount: number;
  maybeInterestingCount: number;
  skipCount: number;
  averageConfidence: number;
}

export function calculateRankingStats(results: RankingResult[]): RankingStats {
  const successful = getSuccessfulResults(results);
  const errors = getErrorResults(results);
  
  const scores = successful.map(r => r.score);
  const confidences = successful.map(r => r.confidence);
  
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const averageConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  
  const sortedScores = [...scores].sort((a, b) => a - b);
  const medianScore = sortedScores.length > 0 
    ? sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
      : sortedScores[Math.floor(sortedScores.length / 2)]
    : 0;

  const highInterestCount = scores.filter(s => s >= 7).length;
  const maybeInterestingCount = scores.filter(s => s >= 4 && s < 7).length;
  const skipCount = scores.filter(s => s < 4).length;

  return {
    totalArticles: results.length,
    successfulRankings: successful.length,
    errorCount: errors.length,
    averageScore,
    medianScore,
    highInterestCount,
    maybeInterestingCount,
    skipCount,
    averageConfidence,
  };
}

/**
 * Sort ranking results by score (descending)
 */
export function sortByScore(results: RankingResult[]): RankingResult[] {
  return [...results].sort((a, b) => {
    if (isRankingError(a)) return 1;
    if (isRankingError(b)) return -1;
    return b.score - a.score;
  });
}

/**
 * Filter results by minimum score threshold
 */
export function filterByScore(results: RankingResult[], minScore: number): RankingResult[] {
  return results.filter(result => {
    if (isRankingError(result)) return false;
    return result.score >= minScore;
  });
}

/**
 * Filter results by relevance category
 */
export function filterByCategory(results: RankingResult[], category: RelevanceCategory): RankingResult[] {
  return results.filter(result => {
    if (isRankingError(result)) return false;
    
    const resultCategory = categorizeRelevance(result.score);
    return resultCategory === category;
  });
}

/**
 * Categorize relevance based on score
 */
export function categorizeRelevance(score: number): RelevanceCategory {
  if (score >= 7) return 'high-interest';
  if (score >= 4) return 'maybe-interesting';
  return 'skip';
}

/**
 * Format ranking results for display
 */
export function formatRankingResults(results: RankingResult[]): string {
  const stats = calculateRankingStats(results);
  const successful = getSuccessfulResults(results);
  const errors = getErrorResults(results);

  let output = `\n📊 Ranking Results Summary\n`;
  output += `==========================================\n`;
  output += `Total Articles: ${stats.totalArticles}\n`;
  output += `Successful Rankings: ${stats.successfulRankings}\n`;
  output += `Errors: ${stats.errorCount}\n`;
  output += `Average Score: ${stats.averageScore.toFixed(2)}\n`;
  output += `Median Score: ${stats.medianScore.toFixed(2)}\n`;
  output += `Average Confidence: ${stats.averageConfidence.toFixed(2)}\n\n`;

  output += `📈 Score Distribution\n`;
  output += `==========================================\n`;
  output += `🔥 High Interest (7-10): ${stats.highInterestCount}\n`;
  output += `📖 Maybe Interesting (4-6): ${stats.maybeInterestingCount}\n`;
  output += `⏭️  Skip (0-3): ${stats.skipCount}\n\n`;

  if (successful.length > 0) {
    output += `🏆 Top Ranked Articles\n`;
    output += `==========================================\n`;
    
    const topResults = sortByScore(successful).slice(0, 5);
    topResults.forEach((result, index) => {
      if (isScoringResult(result)) {
        const category = categorizeRelevance(result.score);
        const emoji = category === 'high-interest' ? '🔥' : category === 'maybe-interesting' ? '📖' : '⏭️';
        output += `${index + 1}. ${emoji} Score: ${result.score.toFixed(1)} - ${result.reasoning?.substring(0, 80)}...\n`;
      }
    });
    output += '\n';
  }

  if (errors.length > 0) {
    output += `❌ Errors\n`;
    output += `==========================================\n`;
    errors.slice(0, 3).forEach((error, index) => {
      output += `${index + 1}. ${error.type}: ${error.message}\n`;
    });
    if (errors.length > 3) {
      output += `... and ${errors.length - 3} more errors\n`;
    }
  }

  return output;
}