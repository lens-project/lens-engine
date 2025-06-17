import { join } from "@std/path";
import { getConfig } from "@src/config/mod.ts";
import { type RankingCriteriaConfig } from "../types.ts";

/**
 * Default ranking criteria configuration
 * Used as fallback when no custom criteria file is found
 */
const DEFAULT_CRITERIA_CONFIG: RankingCriteriaConfig = {
  version: "1.0",
  description: "Default Lens Engine content ranking criteria",
  criteria: [
    {
      id: "content_quality",
      name: "Content Quality",
      description: "Is the content well-written, informative, and substantive?",
      weight: 8,
    },
    {
      id: "contextual_relevance",
      name: "Contextual Relevance",
      description:
        "How well does this match the current context (day/time/mood)?",
      weight: 7,
    },
    {
      id: "practical_value",
      name: "Practical Value",
      description:
        "Does this provide actionable insights or useful information?",
      weight: 6,
    },
    {
      id: "uniqueness",
      name: "Uniqueness",
      description:
        "Is this offering new perspectives or just repeating common knowledge?",
      weight: 5,
    },
    {
      id: "reading_time_match",
      name: "Reading Time Match",
      description: "Does the content depth match the available reading time?",
      weight: 4,
    },
  ],
  scoringGuidelines: [
    {
      range: "0-2",
      description:
        "Poor quality, clickbait, completely irrelevant, or misleading content",
      examples: [
        "Obvious clickbait",
        "Factually incorrect",
        "Spam or promotional",
      ],
    },
    {
      range: "3-4",
      description:
        "Low quality but might have minimal interest, repetitive or shallow content",
      examples: [
        "Rehashed content",
        "Minimal new insights",
        "Poor writing quality",
      ],
    },
    {
      range: "5-6",
      description:
        "Average quality, moderately interesting, standard coverage of topic",
      examples: [
        "Decent article",
        "Some useful information",
        "Standard treatment",
      ],
    },
    {
      range: "7-8",
      description:
        "High quality, very relevant, valuable insights, well-researched content",
      examples: ["Well-researched", "Unique insights", "Highly relevant"],
    },
    {
      range: "9-10",
      description:
        "Exceptional quality, must-read content, unique insights, perfect context match",
      examples: [
        "Groundbreaking insights",
        "Perfect timing",
        "Life-changing content",
      ],
    },
  ],
  additionalInstructions: [
    "Be honest and critical in your evaluation",
    "Consider the specific context provided when scoring",
    "Provide detailed reasoning that explains your score",
    "Focus on value to the user rather than general quality metrics",
  ],
};

/**
 * Load ranking criteria from data directory or return defaults
 */
export async function loadRankingCriteria(
  verbose = false,
): Promise<RankingCriteriaConfig> {
  try {
    const config = await getConfig();
    const dataDir = config.core.dataDir;
    const criteriaPath = join(dataDir, "config", "ranking-criteria.json");

    if (verbose) {
      console.log(`📋 Loading ranking criteria from: ${criteriaPath}`);
    }

    try {
      const criteriaJson = await Deno.readTextFile(criteriaPath);
      const criteria = JSON.parse(criteriaJson) as RankingCriteriaConfig;

      // Validate required fields
      validateCriteriaConfig(criteria);

      if (verbose) {
        console.log(
          `✅ Loaded custom criteria: "${
            criteria.description || "Custom criteria"
          }" (v${criteria.version})`,
        );
        console.log(
          `   📊 ${criteria.criteria.length} criteria, ${criteria.scoringGuidelines.length} scoring levels`,
        );
      }

      return criteria;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        if (verbose) {
          console.log(`📋 No custom criteria found, using defaults`);
          console.log(
            `   💡 Create ${criteriaPath} to customize ranking criteria`,
          );
        }
        return DEFAULT_CRITERIA_CONFIG;
      } else {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        console.warn(
          `⚠️  Failed to load criteria from ${criteriaPath}: ${errorMessage}`,
        );
        console.warn(`   Using default criteria instead`);
        return DEFAULT_CRITERIA_CONFIG;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Failed to load config for criteria: ${errorMessage}`);
    console.warn(`   Using default criteria`);
    return DEFAULT_CRITERIA_CONFIG;
  }
}

/**
 * Create example criteria configuration file
 */
export async function createExampleCriteriaConfig(
  dataDir: string,
): Promise<void> {
  const configDir = join(dataDir, "config");
  const criteriaPath = join(configDir, "ranking-criteria.json");

  // Ensure config directory exists
  await Deno.mkdir(configDir, { recursive: true });

  // Create example config with comments
  const exampleConfig = {
    ...DEFAULT_CRITERIA_CONFIG,
    description:
      "Example custom ranking criteria - modify to suit your preferences",
    "_comments": {
      "version": "Configuration version for future compatibility",
      "criteria":
        "List of evaluation criteria - modify weights to prioritize different aspects",
      "scoringGuidelines":
        "Score ranges and descriptions - customize for your content types",
      "additionalInstructions": "Extra guidance for the AI evaluator",
    },
  };

  await Deno.writeTextFile(
    criteriaPath,
    JSON.stringify(exampleConfig, null, 2),
  );
  console.log(`📝 Created example criteria config at: ${criteriaPath}`);
}

/**
 * Validate criteria configuration structure
 */
function validateCriteriaConfig(config: RankingCriteriaConfig): void {
  if (!config.version) {
    throw new Error("Criteria config missing version field");
  }

  if (
    !config.criteria || !Array.isArray(config.criteria) ||
    config.criteria.length === 0
  ) {
    throw new Error("Criteria config must have at least one criterion");
  }

  if (
    !config.scoringGuidelines || !Array.isArray(config.scoringGuidelines) ||
    config.scoringGuidelines.length === 0
  ) {
    throw new Error("Criteria config must have at least one scoring guideline");
  }

  // Validate criteria structure
  for (const criterion of config.criteria) {
    if (!criterion.id || !criterion.name || !criterion.description) {
      throw new Error(
        `Invalid criterion: missing required fields (id, name, description)`,
      );
    }
  }

  // Validate scoring guidelines structure
  for (const guideline of config.scoringGuidelines) {
    if (!guideline.range || !guideline.description) {
      throw new Error(
        `Invalid scoring guideline: missing required fields (range, description)`,
      );
    }
  }
}

/**
 * Generate dynamic prompt text from criteria configuration
 */
export function generateCriteriaPromptText(
  criteria: RankingCriteriaConfig,
): string {
  let promptText = "Evaluation Criteria:\n";

  criteria.criteria.forEach((criterion, index) => {
    promptText += `${index + 1}. ${criterion.name}: ${criterion.description}\n`;
  });

  promptText += "\nScoring Guidelines:\n";
  criteria.scoringGuidelines.forEach((guideline) => {
    promptText += `- ${guideline.range}: ${guideline.description}\n`;
  });

  if (
    criteria.additionalInstructions &&
    criteria.additionalInstructions.length > 0
  ) {
    promptText += "\nAdditional Guidelines:\n";
    criteria.additionalInstructions.forEach((instruction) => {
      promptText += `- ${instruction}\n`;
    });
  }

  return promptText;
}
