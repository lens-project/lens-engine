import { ArticleInput, RankingContext } from './types.ts';

export const mockArticles: ArticleInput[] = [
  {
    title: "Advanced TypeScript Patterns for Enterprise Applications",
    summary: "TypeScript has evolved significantly over the years, and with it, the patterns and practices that define robust enterprise applications. This comprehensive guide explores advanced TypeScript patterns including conditional types, mapped types, and template literal types that can dramatically improve code maintainability and type safety in large-scale applications.",
    url: "https://example.com/typescript-patterns",
    publishedAt: new Date('2025-01-15T08:30:00Z'),
    source: "TechBlog Pro",
    categories: ["technology", "programming", "typescript"]
  },
  {
    title: "10 Shocking Celebrity Secrets That Will Change Everything You Thought You Knew",
    summary: "You won't believe what happened when we discovered these amazing celebrity secrets that doctors don't want you to know! From shocking diet tricks to unbelievable beauty hacks, these revelations will absolutely transform your perspective on fame and fortune.",
    url: "https://example.com/celebrity-secrets",
    publishedAt: new Date('2025-01-14T15:45:00Z'),
    source: "Celebrity Gossip Today",
    categories: ["entertainment", "celebrity", "gossip"]
  },
  {
    title: "Understanding Quantum Computing: A Beginner's Guide to the Future",
    summary: "Quantum computing represents a fundamental shift in how we process information, offering unprecedented computational power for specific types of problems. This guide breaks down the complex concepts of quantum mechanics, qubits, and quantum algorithms into accessible explanations, exploring both current limitations and future possibilities.",
    url: "https://example.com/quantum-computing-guide",
    publishedAt: new Date('2025-01-13T10:15:00Z'),
    source: "Science Today",
    categories: ["science", "technology", "education", "quantum"]
  },
  {
    title: "Market Crash Imminent: Economists Warn of Economic Downturn",
    summary: "Economists warn of impending market volatility as key economic indicators suggest potential recession conditions. Leading financial analysts discuss the convergence of inflation pressures, supply chain disruptions, and geopolitical tensions that could trigger significant market corrections in the coming months.",
    url: "https://example.com/market-crash-warning",
    publishedAt: new Date('2025-01-16T06:00:00Z'),
    source: "Financial Times",
    categories: ["finance", "news", "economics", "market"]
  },
  {
    title: "Productivity Hacks That Actually Work: Tested and Proven Methods",
    summary: "After testing dozens of productivity methods and tools over six months, we've identified the strategies that consistently deliver results. From time-blocking techniques to digital minimalism approaches, these evidence-based methods can help you reclaim hours of productive time each week.",
    url: "https://example.com/productivity-hacks",
    publishedAt: new Date('2025-01-12T14:20:00Z'),
    source: "Productivity Lab",
    categories: ["productivity", "self-improvement", "lifestyle", "work"]
  },
  {
    title: "Hilarious Cat Videos Compilation: 10 Minutes of Pure Joy",
    summary: "Hilarious cats doing silly things for 10 straight minutes! Watch as these furry comedians slip, slide, and surprise their way into your heart. Perfect for when you need a quick laugh break or want to share some joy with friends and family.",
    url: "https://example.com/funny-cat-videos",
    publishedAt: new Date('2025-01-11T16:30:00Z'),
    source: "Viral Videos Daily",
    categories: ["entertainment", "humor", "animals", "videos"]
  },
  {
    title: "Breakthrough in Deep Learning: MIT Researchers Achieve 99% Accuracy",
    summary: "Researchers at MIT have developed a novel deep learning architecture that achieves unprecedented accuracy in natural language understanding tasks. The breakthrough combines transformer architectures with novel attention mechanisms, potentially revolutionizing how AI systems process and understand human language.",
    url: "https://example.com/deep-learning-breakthrough",
    publishedAt: new Date('2025-01-17T09:45:00Z'),
    source: "MIT Technology Review",
    categories: ["ai", "research", "technology", "science", "machine-learning"]
  },
  {
    title: "Weekend Recipe Ideas: Simple and Delicious Meals for Busy Families",
    summary: "Simple and delicious meals that busy families can prepare in 30 minutes or less. These recipes focus on fresh ingredients, minimal prep time, and maximum flavor. Perfect for weekend meal planning when you want something special but don't have hours to spend in the kitchen.",
    url: "https://example.com/weekend-recipes",
    publishedAt: new Date('2025-01-10T11:00:00Z'),
    source: "Family Kitchen",
    categories: ["food", "lifestyle", "cooking", "family", "recipes"]
  },
  {
    title: "Investing Basics for Beginners: Your Complete Guide to Building Wealth",
    summary: "Learn the fundamentals of smart investing with this comprehensive beginner's guide. From understanding risk tolerance to diversification strategies, this article covers essential concepts that can help you build long-term wealth through disciplined investment practices.",
    url: "https://example.com/investing-basics",
    publishedAt: new Date('2025-01-09T13:15:00Z'),
    source: "Personal Finance Pro",
    categories: ["finance", "education", "investing", "wealth-building"]
  },
  {
    title: "Latest Drama in Silicon Valley: Tech CEO Feuds and Corporate Gossip",
    summary: "Latest drama in Silicon Valley as tech executives engage in public disputes over market strategies and company valuations. Inside sources reveal behind-the-scenes tensions and power struggles that are reshaping the technology industry landscape.",
    url: "https://example.com/tech-ceo-drama",
    publishedAt: new Date('2025-01-08T17:30:00Z'),
    source: "Silicon Valley Insider",
    categories: ["gossip", "entertainment", "tech", "business"]
  }
];

export const mockContexts: RankingContext[] = [
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
  },
  {
    dayOfWeek: 'Wednesday',
    timeOfDay: 'night',
    userMood: 'learning',
    readingDuration: 'medium'
  },
  {
    dayOfWeek: 'Saturday',
    timeOfDay: 'morning',
    userMood: 'casual',
    readingDuration: 'quick'
  },
  {
    dayOfWeek: 'Tuesday',
    timeOfDay: 'afternoon',
    userMood: 'focused',
    readingDuration: 'deep'
  }
];

export const expectedScoreRanges = {
  highQualityTech: { min: 7, max: 10 },
  clickbait: { min: 0, max: 3 },
  educational: { min: 6, max: 10 },
  news: { min: 4, max: 8 },
  entertainment: { min: 2, max: 6 },
  financial: { min: 5, max: 9 }
};

export function getArticleByTitle(title: string): ArticleInput | undefined {
  return mockArticles.find(article => 
    article.title.toLowerCase().includes(title.toLowerCase())
  );
}

export function getArticlesByCategory(category: string): ArticleInput[] {
  return mockArticles.filter(article => 
    article.categories?.some(cat => 
      cat.toLowerCase().includes(category.toLowerCase())
    )
  );
}

export function getContextByMood(mood: RankingContext['userMood']): RankingContext | undefined {
  return mockContexts.find(context => context.userMood === mood);
}

export function getContextsByDay(day: RankingContext['dayOfWeek']): RankingContext[] {
  return mockContexts.filter(context => context.dayOfWeek === day);
}