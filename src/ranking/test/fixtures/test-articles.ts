import { ArticleInput, RankingContext } from '../../types.ts';

export const testArticles: ArticleInput[] = [
  {
    title: "Advanced TypeScript Patterns for Production Applications",
    summary: "TypeScript has evolved significantly, and with it, the patterns that define robust production applications. This guide explores advanced TypeScript patterns including conditional types, mapped types, and template literal types that can dramatically improve code maintainability and type safety in large-scale applications.",
    url: "https://example.com/typescript-patterns",
    publishedAt: new Date('2025-01-15T08:30:00Z'),
    source: "TechBlog Pro",
    categories: ["technology", "programming", "typescript"]
  },
  {
    title: "Market Analysis: Tech Stocks Surge After Federal Reserve Decision",
    summary: "Major technology stocks experienced significant gains following the Federal Reserve's latest interest rate decision. Analysts discuss the implications for tech companies and growth prospects in the current economic environment.",
    url: "https://example.com/market-analysis",
    publishedAt: new Date('2025-01-16T06:00:00Z'),
    source: "Financial Times",
    categories: ["finance", "news", "technology", "market"]
  },
  {
    title: "10 Productivity Hacks That Actually Work",
    summary: "After testing dozens of productivity methods, we've identified the strategies that consistently deliver results. From time-blocking to digital minimalism, these evidence-based approaches can help reclaim hours of productive time each week.",
    url: "https://example.com/productivity-hacks",
    publishedAt: new Date('2025-01-14T12:00:00Z'),
    source: "Productivity Weekly",
    categories: ["productivity", "self-improvement", "lifestyle"]
  }
];

export const testContexts: RankingContext[] = [
  {
    dayOfWeek: 'Monday',
    timeOfDay: 'morning',
    userMood: 'focused',
    readingDuration: 'medium'
  },
  {
    dayOfWeek: 'Sunday',
    timeOfDay: 'afternoon',
    userMood: 'casual',
    readingDuration: 'quick'
  },
  {
    dayOfWeek: 'Friday',
    timeOfDay: 'evening',
    userMood: 'entertainment',
    readingDuration: 'deep'
  }
];

export const invalidArticle: Partial<ArticleInput> = {
  title: "",
  summary: "Valid summary",
  url: "invalid-url"
};

export const invalidContext: Partial<RankingContext> = {
  dayOfWeek: 'InvalidDay' as any,
  timeOfDay: 'morning'
};