import {
  ArticleInput,
  ContextualAdjustments,
  RankingContext,
} from "../types.ts";

/**
 * Content type keywords for classification
 */
const CONTENT_TYPES = {
  lifestyle: [
    "lifestyle",
    "health",
    "fitness",
    "food",
    "recipe",
    "travel",
    "home",
    "family",
  ],
  entertainment: [
    "entertainment",
    "movie",
    "music",
    "game",
    "celebrity",
    "art",
    "culture",
  ],
  personal_development: [
    "personal",
    "development",
    "self-help",
    "productivity",
    "mindfulness",
    "career",
  ],
  industry_news: [
    "industry",
    "business",
    "market",
    "economy",
    "company",
    "startup",
    "funding",
  ],
  professional_development: [
    "professional",
    "skill",
    "training",
    "certification",
    "leadership",
    "management",
  ],
  planning: ["plan", "strategy", "goal", "roadmap", "schedule", "organization"],
  creative: [
    "creative",
    "design",
    "art",
    "writing",
    "photography",
    "innovation",
  ],
  heavy_technical: [
    "algorithm",
    "architecture",
    "system",
    "database",
    "performance",
    "optimization",
  ],
  urgent_business: [
    "breaking",
    "urgent",
    "crisis",
    "emergency",
    "market crash",
    "stock",
  ],
  actionable: [
    "how to",
    "guide",
    "tutorial",
    "step",
    "actionable",
    "practical",
  ],
  news: ["news", "update", "announcement", "report", "breaking"],
  educational: [
    "education",
    "learn",
    "course",
    "lesson",
    "knowledge",
    "understanding",
  ],
  tutorial: ["tutorial", "how-to", "guide", "walkthrough", "instruction"],
  reflective: [
    "reflection",
    "thought",
    "opinion",
    "perspective",
    "insight",
    "philosophy",
  ],
  light_reading: ["light", "casual", "fun", "interesting", "story", "anecdote"],
  work: [
    "work",
    "business",
    "professional",
    "corporate",
    "meeting",
    "deadline",
  ],
  technical: [
    "technical",
    "programming",
    "code",
    "software",
    "development",
    "engineering",
  ],
  analysis: [
    "analysis",
    "research",
    "study",
    "data",
    "statistics",
    "deep dive",
  ],
  how_to: ["how to", "guide", "instructions", "steps", "method"],
  humor: ["humor", "funny", "comedy", "joke", "satire", "amusing"],
  story: ["story", "narrative", "tale", "experience", "journey"],
  interesting_facts: [
    "fact",
    "trivia",
    "interesting",
    "surprising",
    "did you know",
  ],
} as const;

/**
 * Contextual adjustment rules
 */
const CONTEXT_RULES = {
  dayOfWeek: {
    Sunday: { lifestyle: 2, entertainment: 2, personal_development: 2 },
    Monday: { industry_news: 2, professional_development: 2, planning: 2 },
    Tuesday: {}, // No specific adjustments
    Wednesday: {}, // No specific adjustments
    Thursday: {}, // No specific adjustments
    Friday: { creative: 1, heavy_technical: -1 },
    Saturday: { urgent_business: -1 },
  },
  timeOfDay: {
    morning: { actionable: 1, news: 1, planning: 1 },
    afternoon: {}, // No specific adjustments
    evening: { educational: 1, tutorial: 1, reflective: 1 },
    night: { entertainment: 2, light_reading: 2, work: -2 },
  },
  mood: {
    focused: { technical: 2, tutorial: 2, analysis: 2 },
    casual: { news: 1, entertainment: 1, light_reading: 1 },
    learning: { educational: 3, tutorial: 3, how_to: 3 },
    entertainment: { humor: 2, story: 2, interesting_facts: 2 },
  },
} as const;

type ContentType = keyof typeof CONTENT_TYPES;

/**
 * Classify article content based on categories, title, and summary
 */
function classifyContent(article: ArticleInput): ContentType[] {
  const searchText = [
    ...(article.categories || []),
    article.title,
    article.summary,
  ].join(" ").toLowerCase();

  const contentTypes: ContentType[] = [];

  for (const [contentType, keywords] of Object.entries(CONTENT_TYPES)) {
    if (
      keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
    ) {
      contentTypes.push(contentType as ContentType);
    }
  }

  return contentTypes;
}

/**
 * Calculate total contextual adjustments for an article
 */
function calculateTotalAdjustment(
  contentTypes: ContentType[],
  context: RankingContext,
): number {
  let totalAdjustment = 0;

  // Day of week adjustments
  const dayRules = CONTEXT_RULES.dayOfWeek[context.dayOfWeek] as Record<
    string,
    number
  >;
  if (dayRules) {
    for (const contentType of contentTypes) {
      totalAdjustment += dayRules[contentType] || 0;
    }
  }

  // Time of day adjustments
  const timeRules = CONTEXT_RULES.timeOfDay[context.timeOfDay] as Record<
    string,
    number
  >;
  if (timeRules) {
    for (const contentType of contentTypes) {
      totalAdjustment += timeRules[contentType] || 0;
    }
  }

  // Mood adjustments (if specified)
  if (context.userMood) {
    const moodRules = CONTEXT_RULES.mood[context.userMood] as Record<
      string,
      number
    >;
    if (moodRules) {
      for (const contentType of contentTypes) {
        totalAdjustment += moodRules[contentType] || 0;
      }
    }
  }

  return totalAdjustment;
}

/**
 * Apply contextual adjustments to base score
 */
export function applyContextualAdjustments(
  baseScore: number,
  context: RankingContext,
  article: ArticleInput,
): number {
  const contentTypes = classifyContent(article);
  const adjustment = calculateTotalAdjustment(contentTypes, context);

  // Apply adjustment and clamp to valid range
  return Math.max(0, Math.min(10, baseScore + adjustment));
}

/**
 * Calculate contextual adjustments breakdown (for debugging/transparency)
 */
export function calculateContextualAdjustments(
  context: RankingContext,
  article: ArticleInput,
): ContextualAdjustments {
  const contentTypes = classifyContent(article);

  let dayOfWeekAdjustment = 0;
  let timeOfDayAdjustment = 0;
  let moodAdjustment = 0;

  // Day of week
  const dayRules = CONTEXT_RULES.dayOfWeek[context.dayOfWeek] as Record<
    string,
    number
  >;
  if (dayRules) {
    for (const contentType of contentTypes) {
      dayOfWeekAdjustment += dayRules[contentType] || 0;
    }
  }

  // Time of day
  const timeRules = CONTEXT_RULES.timeOfDay[context.timeOfDay] as Record<
    string,
    number
  >;
  if (timeRules) {
    for (const contentType of contentTypes) {
      timeOfDayAdjustment += timeRules[contentType] || 0;
    }
  }

  // Mood
  if (context.userMood) {
    const moodRules = CONTEXT_RULES.mood[context.userMood] as Record<
      string,
      number
    >;
    if (moodRules) {
      for (const contentType of contentTypes) {
        moodAdjustment += moodRules[contentType] || 0;
      }
    }
  }

  return {
    dayOfWeekMultiplier: dayOfWeekAdjustment,
    timeOfDayMultiplier: timeOfDayAdjustment,
    moodMultiplier: moodAdjustment,
  };
}
