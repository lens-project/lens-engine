import { ArticleInput, RankingContext, LLMScoringRequest, LLMScoringResponse, ScoringResult } from './types.ts';

export interface LLMRanker {
  scoreArticle(request: LLMScoringRequest): Promise<ScoringResult>;
}

export class MockLLMRanker implements LLMRanker {
  private mockResponses: Map<string, LLMScoringResponse>;

  constructor() {
    this.mockResponses = new Map();
    this.initializeMockData();
  }

  async scoreArticle(request: LLMScoringRequest): Promise<ScoringResult> {
    const key = this.generateKey(request.article);
    const mockResponse = this.mockResponses.get(key) || this.getDefaultResponse(request.article);

    await this.simulateProcessingTime();

    return {
      score: mockResponse.score,
      confidence: 0.85,
      method: 'llm',
      reasoning: mockResponse.reasoning,
      categories: mockResponse.categories,
      estimatedReadTime: mockResponse.estimatedReadTime,
    };
  }

  private generateKey(article: ArticleInput): string {
    return `${article.title.toLowerCase()}_${article.summary.substring(0, 50)}`;
  }

  private async simulateProcessingTime(): Promise<void> {
    const delay = Math.random() * 100 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private initializeMockData(): void {
    this.mockResponses.set('advanced typescript patterns_typescript has evolved significantly', {
      score: 8,
      reasoning: "High-quality technical content with practical applications. The article covers advanced TypeScript patterns that developers can immediately apply to improve their code quality. The depth of coverage and practical examples make this valuable for professional development.",
      categories: ["technology", "programming", "typescript"],
      estimatedReadTime: 12
    });

    this.mockResponses.set('10 shocking celebrity secrets_you won\'t believe what happened', {
      score: 2,
      reasoning: "Clickbait headline with little substantive content. The article relies on sensationalism rather than providing valuable information. The content is likely to be shallow entertainment with minimal practical value.",
      categories: ["entertainment", "celebrity"],
      estimatedReadTime: 3
    });

    this.mockResponses.set('understanding quantum computing_quantum computing represents a fundamental', {
      score: 9,
      reasoning: "Excellent educational content that explains complex concepts clearly. The article breaks down quantum computing in an accessible way while maintaining technical accuracy. This is valuable for learning and understanding emerging technology.",
      categories: ["science", "technology", "education"],
      estimatedReadTime: 18
    });

    this.mockResponses.set('market crash imminent_economists warn of impending', {
      score: 6,
      reasoning: "Important financial news with immediate relevance. While potentially alarming, the article provides necessary information for financial decision-making. The timing and context make this moderately important despite the sensational tone.",
      categories: ["finance", "news", "economics"],
      estimatedReadTime: 8
    });

    this.mockResponses.set('productivity hacks that work_after testing dozens of productivity', {
      score: 7,
      reasoning: "Practical content with actionable advice. The article appears to be based on actual testing and provides concrete strategies readers can implement. Good balance of practicality and depth for personal development.",
      categories: ["productivity", "self-improvement", "lifestyle"],
      estimatedReadTime: 10
    });

    this.mockResponses.set('funny cat videos compilation_hilarious cats doing silly', {
      score: 3,
      reasoning: "Light entertainment content with minimal educational value. While potentially amusing, this type of content doesn't provide lasting value or actionable insights. Suitable only for casual entertainment moments.",
      categories: ["entertainment", "humor", "animals"],
      estimatedReadTime: 5
    });

    this.mockResponses.set('deep learning breakthrough_researchers at mit have developed', {
      score: 8,
      reasoning: "Significant technological advancement with potential long-term impact. The research breakthrough could influence future AI development and has implications for multiple industries. Important for staying current with technological progress.",
      categories: ["ai", "research", "technology", "science"],
      estimatedReadTime: 15
    });

    this.mockResponses.set('weekend recipe ideas_simple and delicious meals', {
      score: 5,
      reasoning: "Practical lifestyle content with immediate applicability. The recipes provide value for meal planning and could save time during busy weekends. Moderate importance for daily life improvement.",
      categories: ["food", "lifestyle", "cooking"],
      estimatedReadTime: 7
    });

    this.mockResponses.set('investing basics for beginners_learn the fundamentals of smart', {
      score: 9,
      reasoning: "Essential educational content for financial literacy. The article covers fundamental concepts that can have significant long-term impact on personal wealth. High value for practical life skills and financial security.",
      categories: ["finance", "education", "investing"],
      estimatedReadTime: 20
    });

    this.mockResponses.set('gossip about tech ceos_latest drama in silicon', {
      score: 1,
      reasoning: "Low-value gossip content with no practical benefits. While potentially interesting for entertainment, this type of content doesn't contribute to knowledge, skills, or meaningful understanding of important topics.",
      categories: ["gossip", "entertainment", "tech"],
      estimatedReadTime: 4
    });
  }

  private getDefaultResponse(article: ArticleInput): LLMScoringResponse {
    const titleWords = article.title.toLowerCase();
    const summaryWords = article.summary.toLowerCase();
    
    if (this.isHighQualityTechnical(titleWords, summaryWords)) {
      return {
        score: 7,
        reasoning: "Technical content with educational value. The article appears to cover useful concepts or practical applications in technology.",
        categories: ["technology", "education"],
        estimatedReadTime: 10
      };
    }
    
    if (this.isClickbait(titleWords, summaryWords)) {
      return {
        score: 2,
        reasoning: "Content appears to rely on sensational headlines rather than substantial information. Limited practical value.",
        categories: ["entertainment"],
        estimatedReadTime: 3
      };
    }
    
    if (this.isEducational(titleWords, summaryWords)) {
      return {
        score: 6,
        reasoning: "Educational content that could provide learning value. The article appears to explain concepts or provide instructional information.",
        categories: ["education"],
        estimatedReadTime: 8
      };
    }
    
    if (this.isNews(titleWords, summaryWords)) {
      return {
        score: 5,
        reasoning: "News content with moderate relevance. Provides information about current events that may be useful for staying informed.",
        categories: ["news"],
        estimatedReadTime: 6
      };
    }
    
    return {
      score: 4,
      reasoning: "General content with moderate interest. The article covers topics that may be somewhat relevant but doesn't clearly fall into high-value categories.",
      categories: ["general"],
      estimatedReadTime: 5
    };
  }

  private isHighQualityTechnical(title: string, summary: string): boolean {
    const technicalKeywords = ['programming', 'development', 'software', 'algorithm', 'architecture', 'best practices', 'tutorial', 'guide'];
    const content = `${title} ${summary}`;
    return technicalKeywords.some(keyword => content.includes(keyword));
  }

  private isClickbait(title: string, summary: string): boolean {
    const clickbaitKeywords = ['shocking', 'you won\'t believe', 'amazing', 'unbelievable', 'secrets', 'tricks doctors', 'hate this'];
    const content = `${title} ${summary}`;
    return clickbaitKeywords.some(keyword => content.includes(keyword));
  }

  private isEducational(title: string, summary: string): boolean {
    const educationalKeywords = ['learn', 'understanding', 'guide', 'tutorial', 'how to', 'fundamentals', 'basics', 'introduction'];
    const content = `${title} ${summary}`;
    return educationalKeywords.some(keyword => content.includes(keyword));
  }

  private isNews(title: string, summary: string): boolean {
    const newsKeywords = ['news', 'breaking', 'report', 'announces', 'update', 'latest', 'today'];
    const content = `${title} ${summary}`;
    return newsKeywords.some(keyword => content.includes(keyword));
  }
}

export class OllamaLLMRanker implements LLMRanker {
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(model = 'llama3.2', baseUrl = 'http://localhost:11434') {
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async scoreArticle(request: LLMScoringRequest): Promise<ScoringResult> {
    const prompt = this.buildPrompt(request.article, request.context);
    
    try {
      const response = await this.callOllama(prompt);
      const parsed = this.parseResponse(response);
      
      return {
        score: parsed.score,
        confidence: 0.75,
        method: 'llm',
        reasoning: parsed.reasoning,
        categories: parsed.categories,
        estimatedReadTime: parsed.estimatedReadTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw {
        type: 'llm_error',
        message: `LLM scoring failed: ${errorMessage}`,
        input: request.article,
        context: request.context
      };
    }
  }

  private buildPrompt(article: ArticleInput, context: RankingContext): string {
    return `You are an intelligent content curator. Rate this article's relevance on a scale of 0-10.

Context:
- Day: ${context.dayOfWeek}
- Time: ${context.timeOfDay}
- User mood: ${context.userMood || 'neutral'}
- Reading time available: ${context.readingDuration || 'medium'}

Article:
Title: ${article.title}
Summary: ${article.summary}

Consider:
1. Content quality and depth
2. Relevance to context (day/time/mood)
3. Actionability and practical value
4. Uniqueness vs repetitive news
5. Match to reading duration

Respond in JSON format:
{
  "score": 0-10,
  "reasoning": "detailed explanation",
  "categories": ["category1", "category2"],
  "estimatedReadTime": minutes
}`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  private parseResponse(response: string): LLMScoringResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        score: Math.max(0, Math.min(10, Number(parsed.score) || 0)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        estimatedReadTime: Number(parsed.estimatedReadTime) || 5,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse LLM response: ${errorMessage}`);
    }
  }
}

export function createLLMRanker(useMock = true): LLMRanker {
  return useMock ? new MockLLMRanker() : new OllamaLLMRanker();
}