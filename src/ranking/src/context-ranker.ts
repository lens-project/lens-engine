import { ArticleInput, RankingContext, ContextualAdjustments } from '../types.ts';

export function calculateContextualAdjustments(
  context: RankingContext,
  article: ArticleInput
): ContextualAdjustments {
  return {
    dayOfWeekMultiplier: getDayOfWeekMultiplier(context.dayOfWeek, article),
    timeOfDayMultiplier: getTimeOfDayMultiplier(context.timeOfDay, article),
    moodMultiplier: getMoodMultiplier(context.userMood, article),
  };
}

export function applyContextualAdjustments(
  baseScore: number,
  context: RankingContext,
  article: ArticleInput
): number {
  let adjustedScore = baseScore;
  adjustedScore += getDayOfWeekAdjustment(context.dayOfWeek, article);
  adjustedScore += getTimeOfDayAdjustment(context.timeOfDay, article);
  adjustedScore += getMoodAdjustment(context.userMood, article);
  
  return Math.max(0, Math.min(10, adjustedScore));
}

function getDayOfWeekMultiplier(dayOfWeek: RankingContext['dayOfWeek'], article: ArticleInput): number {
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (dayOfWeek) {
    case 'Sunday':
      if (isLifestyleContent(categories, title, summary)) return 1.2;
      if (isEntertainmentContent(categories, title, summary)) return 1.2;
      if (isPersonalDevelopmentContent(categories, title, summary)) return 1.2;
      return 1.0;
    
    case 'Monday':
      if (isIndustryNewsContent(categories, title, summary)) return 1.2;
      if (isProfessionalDevelopmentContent(categories, title, summary)) return 1.2;
      if (isPlanningContent(categories, title, summary)) return 1.2;
      return 1.0;
    
    case 'Friday':
      if (isCreativeContent(categories, title, summary)) return 1.1;
      if (isHeavyTechnicalContent(categories, title, summary)) return 0.9;
      return 1.0;
    
    case 'Saturday':
      if (isUrgentBusinessNews(categories, title, summary)) return 0.9;
      return 1.0;
    
    default:
      return 1.0;
  }
}

function getDayOfWeekAdjustment(dayOfWeek: RankingContext['dayOfWeek'], article: ArticleInput): number {
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (dayOfWeek) {
    case 'Sunday':
      if (isLifestyleContent(categories, title, summary)) return 2;
      if (isEntertainmentContent(categories, title, summary)) return 2;
      if (isPersonalDevelopmentContent(categories, title, summary)) return 2;
      return 0;
    
    case 'Monday':
      if (isIndustryNewsContent(categories, title, summary)) return 2;
      if (isProfessionalDevelopmentContent(categories, title, summary)) return 2;
      if (isPlanningContent(categories, title, summary)) return 2;
      return 0;
    
    case 'Friday':
      if (isCreativeContent(categories, title, summary)) return 1;
      if (isHeavyTechnicalContent(categories, title, summary)) return -1;
      return 0;
    
    case 'Saturday':
      if (isUrgentBusinessNews(categories, title, summary)) return -1;
      return 0;
    
    default:
      return 0;
  }
}

function getTimeOfDayMultiplier(timeOfDay: RankingContext['timeOfDay'], article: ArticleInput): number {
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (timeOfDay) {
    case 'morning':
      if (isActionableContent(categories, title, summary)) return 1.1;
      if (isNewsContent(categories, title, summary)) return 1.1;
      if (isPlanningContent(categories, title, summary)) return 1.1;
      return 1.0;
    
    case 'afternoon':
      return 1.0;
    
    case 'evening':
      if (isEducationalContent(categories, title, summary)) return 1.1;
      if (isTutorialContent(categories, title, summary)) return 1.1;
      if (isReflectiveContent(categories, title, summary)) return 1.1;
      return 1.0;
    
    case 'night':
      if (isEntertainmentContent(categories, title, summary)) return 1.2;
      if (isLightReadingContent(categories, title, summary)) return 1.2;
      if (isWorkContent(categories, title, summary)) return 0.8;
      return 1.0;
    
    default:
      return 1.0;
  }
}

function getTimeOfDayAdjustment(timeOfDay: RankingContext['timeOfDay'], article: ArticleInput): number {
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (timeOfDay) {
    case 'morning':
      if (isActionableContent(categories, title, summary)) return 1;
      if (isNewsContent(categories, title, summary)) return 1;
      if (isPlanningContent(categories, title, summary)) return 1;
      return 0;
    
    case 'afternoon':
      return 0;
    
    case 'evening':
      if (isEducationalContent(categories, title, summary)) return 1;
      if (isTutorialContent(categories, title, summary)) return 1;
      if (isReflectiveContent(categories, title, summary)) return 1;
      return 0;
    
    case 'night':
      if (isEntertainmentContent(categories, title, summary)) return 2;
      if (isLightReadingContent(categories, title, summary)) return 2;
      if (isWorkContent(categories, title, summary)) return -2;
      return 0;
    
    default:
      return 0;
  }
}

function getMoodMultiplier(userMood: RankingContext['userMood'], article: ArticleInput): number {
  if (!userMood) return 1.0;
  
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (userMood) {
    case 'focused':
      if (isTechnicalContent(categories, title, summary)) return 1.2;
      if (isTutorialContent(categories, title, summary)) return 1.2;
      if (isAnalysisContent(categories, title, summary)) return 1.2;
      return 1.0;
    
    case 'casual':
      if (isNewsContent(categories, title, summary)) return 1.1;
      if (isEntertainmentContent(categories, title, summary)) return 1.1;
      if (isLightReadingContent(categories, title, summary)) return 1.1;
      return 1.0;
    
    case 'learning':
      if (isEducationalContent(categories, title, summary)) return 1.3;
      if (isTutorialContent(categories, title, summary)) return 1.3;
      if (isHowToContent(categories, title, summary)) return 1.3;
      return 1.0;
    
    case 'entertainment':
      if (isHumorContent(categories, title, summary)) return 1.2;
      if (isStoryContent(categories, title, summary)) return 1.2;
      if (isInterestingFactsContent(categories, title, summary)) return 1.2;
      return 1.0;
    
    default:
      return 1.0;
  }
}

function getMoodAdjustment(userMood: RankingContext['userMood'], article: ArticleInput): number {
  if (!userMood) return 0;
  
  const categories = article.categories || [];
  const title = article.title.toLowerCase();
  const summary = article.summary.toLowerCase();
  
  switch (userMood) {
    case 'focused':
      if (isTechnicalContent(categories, title, summary)) return 2;
      if (isTutorialContent(categories, title, summary)) return 2;
      if (isAnalysisContent(categories, title, summary)) return 2;
      return 0;
    
    case 'casual':
      if (isNewsContent(categories, title, summary)) return 1;
      if (isEntertainmentContent(categories, title, summary)) return 1;
      if (isLightReadingContent(categories, title, summary)) return 1;
      return 0;
    
    case 'learning':
      if (isEducationalContent(categories, title, summary)) return 3;
      if (isTutorialContent(categories, title, summary)) return 3;
      if (isHowToContent(categories, title, summary)) return 3;
      return 0;
    
    case 'entertainment':
      if (isHumorContent(categories, title, summary)) return 2;
      if (isStoryContent(categories, title, summary)) return 2;
      if (isInterestingFactsContent(categories, title, summary)) return 2;
      return 0;
    
    default:
      return 0;
  }
}

function isLifestyleContent(categories: string[], title: string, summary: string): boolean {
  const lifestyleKeywords = ['lifestyle', 'health', 'fitness', 'food', 'recipe', 'travel', 'home', 'family'];
  return hasKeywords([...categories, title, summary], lifestyleKeywords);
}

function isEntertainmentContent(categories: string[], title: string, summary: string): boolean {
  const entertainmentKeywords = ['entertainment', 'movie', 'music', 'game', 'celebrity', 'art', 'culture'];
  return hasKeywords([...categories, title, summary], entertainmentKeywords);
}

function isPersonalDevelopmentContent(categories: string[], title: string, summary: string): boolean {
  const personalDevKeywords = ['personal', 'development', 'self-help', 'productivity', 'mindfulness', 'career'];
  return hasKeywords([...categories, title, summary], personalDevKeywords);
}

function isIndustryNewsContent(categories: string[], title: string, summary: string): boolean {
  const industryKeywords = ['industry', 'business', 'market', 'economy', 'company', 'startup', 'funding'];
  return hasKeywords([...categories, title, summary], industryKeywords);
}

function isProfessionalDevelopmentContent(categories: string[], title: string, summary: string): boolean {
  const professionalKeywords = ['professional', 'skill', 'training', 'certification', 'leadership', 'management'];
  return hasKeywords([...categories, title, summary], professionalKeywords);
}

function isPlanningContent(categories: string[], title: string, summary: string): boolean {
  const planningKeywords = ['plan', 'strategy', 'goal', 'roadmap', 'schedule', 'organization'];
  return hasKeywords([...categories, title, summary], planningKeywords);
}

function isCreativeContent(categories: string[], title: string, summary: string): boolean {
  const creativeKeywords = ['creative', 'design', 'art', 'writing', 'photography', 'innovation'];
  return hasKeywords([...categories, title, summary], creativeKeywords);
}

function isHeavyTechnicalContent(categories: string[], title: string, summary: string): boolean {
  const technicalKeywords = ['algorithm', 'architecture', 'system', 'database', 'performance', 'optimization'];
  return hasKeywords([...categories, title, summary], technicalKeywords);
}

function isUrgentBusinessNews(categories: string[], title: string, summary: string): boolean {
  const urgentKeywords = ['breaking', 'urgent', 'crisis', 'emergency', 'market crash', 'stock'];
  return hasKeywords([...categories, title, summary], urgentKeywords);
}

function isActionableContent(categories: string[], title: string, summary: string): boolean {
  const actionableKeywords = ['how to', 'guide', 'tutorial', 'step', 'actionable', 'practical'];
  return hasKeywords([...categories, title, summary], actionableKeywords);
}

function isNewsContent(categories: string[], title: string, summary: string): boolean {
  const newsKeywords = ['news', 'update', 'announcement', 'report', 'breaking'];
  return hasKeywords([...categories, title, summary], newsKeywords);
}

function isEducationalContent(categories: string[], title: string, summary: string): boolean {
  const educationalKeywords = ['education', 'learn', 'course', 'lesson', 'knowledge', 'understanding'];
  return hasKeywords([...categories, title, summary], educationalKeywords);
}

function isTutorialContent(categories: string[], title: string, summary: string): boolean {
  const tutorialKeywords = ['tutorial', 'how-to', 'guide', 'walkthrough', 'instruction'];
  return hasKeywords([...categories, title, summary], tutorialKeywords);
}

function isReflectiveContent(categories: string[], title: string, summary: string): boolean {
  const reflectiveKeywords = ['reflection', 'thought', 'opinion', 'perspective', 'insight', 'philosophy'];
  return hasKeywords([...categories, title, summary], reflectiveKeywords);
}

function isLightReadingContent(categories: string[], title: string, summary: string): boolean {
  const lightKeywords = ['light', 'casual', 'fun', 'interesting', 'story', 'anecdote'];
  return hasKeywords([...categories, title, summary], lightKeywords);
}

function isWorkContent(categories: string[], title: string, summary: string): boolean {
  const workKeywords = ['work', 'business', 'professional', 'corporate', 'meeting', 'deadline'];
  return hasKeywords([...categories, title, summary], workKeywords);
}

function isTechnicalContent(categories: string[], title: string, summary: string): boolean {
  const technicalKeywords = ['technical', 'programming', 'code', 'software', 'development', 'engineering'];
  return hasKeywords([...categories, title, summary], technicalKeywords);
}

function isAnalysisContent(categories: string[], title: string, summary: string): boolean {
  const analysisKeywords = ['analysis', 'research', 'study', 'data', 'statistics', 'deep dive'];
  return hasKeywords([...categories, title, summary], analysisKeywords);
}

function isHowToContent(categories: string[], title: string, summary: string): boolean {
  const howToKeywords = ['how to', 'guide', 'instructions', 'steps', 'method'];
  return hasKeywords([...categories, title, summary], howToKeywords);
}

function isHumorContent(categories: string[], title: string, summary: string): boolean {
  const humorKeywords = ['humor', 'funny', 'comedy', 'joke', 'satire', 'amusing'];
  return hasKeywords([...categories, title, summary], humorKeywords);
}

function isStoryContent(categories: string[], title: string, summary: string): boolean {
  const storyKeywords = ['story', 'narrative', 'tale', 'experience', 'journey'];
  return hasKeywords([...categories, title, summary], storyKeywords);
}

function isInterestingFactsContent(categories: string[], title: string, summary: string): boolean {
  const factsKeywords = ['fact', 'trivia', 'interesting', 'surprising', 'did you know'];
  return hasKeywords([...categories, title, summary], factsKeywords);
}

function hasKeywords(content: string[], keywords: string[]): boolean {
  const contentText = content.join(' ').toLowerCase();
  return keywords.some(keyword => contentText.includes(keyword.toLowerCase()));
}