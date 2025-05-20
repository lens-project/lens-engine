# Configuration Management

## 1. Introduction

This document outlines the configuration management approach for the Lens project. It defines how environment-specific settings, secrets, and other configuration values are managed across different deployment scenarios, from local development to production environments.

## 2. Configuration Philosophy

The Lens project adopts a configuration philosophy that prioritizes:

1. **Security**: Sensitive information is never stored in version control
2. **Explicitness**: Configuration requirements are clearly documented and validated
3. **Developer Experience**: Simple setup process for new developers
4. **Flexibility**: Support for both local development and containerized deployment
5. **Consistency**: Configuration structure is consistent across environments

## 3. Configuration Approach

### 3.1 Hybrid Approach: Environment Files with Environment Variable Override

The Lens project uses a hybrid approach to configuration management:

1. **Local Development**:
   - Developers use a `.env` file for convenience
   - An `.env.example` file is provided as a template
   - The `.env` file is excluded from version control via `.gitignore`

2. **Environment Variable Override**:
   - Environment variables take precedence over `.env` file values
   - This allows for containerized deployments and CI/CD pipelines
   - No code changes needed between development and production

3. **Default Values**:
   - Reasonable defaults are provided for non-sensitive configuration
   - Required values without defaults are validated at startup

### 3.2 Rationale

This approach was chosen for several key reasons:

1. **Developer Experience**:
   - Simple onboarding with `.env.example` template
   - Familiar pattern used in many modern frameworks
   - Reduced friction for new contributors

2. **Security Benefits**:
   - `.env` files are excluded from version control
   - Sensitive values can be injected as environment variables in production
   - Clear separation between development and production secrets

3. **Deployment Flexibility**:
   - Works seamlessly with Docker and other containerization tools
   - Compatible with cloud hosting environments
   - Follows Twelve-Factor App methodology for configuration

4. **Pragmatic Balance**:
   - Combines the convenience of `.env` files for development
   - With the security and flexibility of environment variables for production
   - Without unnecessary complexity or overhead

### 3.3 Implementation Details

The configuration system:

1. Loads the `.env` file if present (optional in production)
2. Overrides with any environment variables that are set
3. Applies default values for missing non-required settings
4. Validates that all required values are present
5. Provides a typed configuration object to the application

## 4. Configuration Categories

### 4.1 Core Configuration

Basic configuration required for the application to function:

- `LENS_DATA_DIR`: Directory for storing application data
- `LENS_LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LENS_PORT`: Port for the API server

### 4.2 LLM Configuration

Configuration for language model interactions:

- `LENS_OLLAMA_BASE_URL`: URL for the Ollama instance (default: "http://localhost:11434")
- `LENS_OLLAMA_EMBEDDING_MODEL`: Model to use for embeddings (default: "nomic-embed-text")
- `LENS_OLLAMA_LLM_MODEL`: Model to use for text generation (default: "llama2")

### 4.3 LangChain Configuration

Configuration for LangChain integration:

- `LENS_LANGCHAIN_API_KEY`: API key for LangChain (if using hosted version)
- `LENS_LANGCHAIN_TRACING`: Enable/disable LangChain tracing (default: "false")

### 4.4 LangSmith Configuration

Configuration for LangSmith observability:

- `LENS_LANGSMITH_API_KEY`: API key for LangSmith (required)
- `LENS_LANGSMITH_PROJECT`: Project name in LangSmith (default: "lens-development")
- `LENS_LANGSMITH_TRACING_ENABLED`: Enable/disable tracing (default: "true")

### 4.5 Database Configuration

Configuration for the vector database:

- `LENS_DB_PATH`: Path to the database file (for SQLite)
- `LENS_VECTOR_DB_URL`: URL for vector database (if using external)

## 5. Implementation

### 5.1 Configuration Loading

Configuration is loaded using a functional approach that combines values from .env files and environment variables:

```typescript
// Example (conceptual) - actual implementation will follow functional paradigm
import { load } from "https://deno.land/std/dotenv/mod.ts";

async function loadConfiguration(): Promise<Configuration> {
  // Try to load .env file (no error if it doesn't exist)
  let dotEnvConfig = {};
  try {
    dotEnvConfig = await load({ export: true, allowEmptyValues: true });
  } catch (error) {
    // .env file doesn't exist or couldn't be read - that's fine
    console.log("No .env file found, using environment variables and defaults only");
  }

  // Helper function to get config value with precedence:
  // 1. Environment variable
  // 2. .env file
  // 3. Default value
  const getValue = (key: string, defaultValue?: string): string | undefined => {
    return Deno.env.get(key) || dotEnvConfig[key] || defaultValue;
  };

  // Build the configuration object
  const config: Configuration = {
    core: {
      dataDir: getValue("LENS_DATA_DIR", defaultDataDir()),
      logLevel: getValue("LENS_LOG_LEVEL", "info"),
      port: parseInt(getValue("LENS_PORT", "8000")),
    },
    llm: {
      ollamaBaseUrl: getValue("LENS_OLLAMA_BASE_URL", "http://localhost:11434"),
      embeddingModel: getValue("LENS_OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),
      llmModel: getValue("LENS_OLLAMA_LLM_MODEL", "llama2"),
    },
    langsmith: {
      apiKey: getValue("LENS_LANGSMITH_API_KEY"),
      project: getValue("LENS_LANGSMITH_PROJECT", "lens-development"),
      tracingEnabled: getValue("LENS_LANGSMITH_TRACING_ENABLED", "true") === "true",
    },
    // Other configuration sections...
  };

  return config;
}
```

### 5.2 Configuration Validation

A validation function ensures all required variables are present:

```typescript
// Example (conceptual) - actual implementation will follow functional paradigm
function validateConfiguration(config: Configuration): Result<Configuration, ConfigError> {
  // Define required values that must be present
  const requiredValues = [
    { name: "LangSmith API Key", value: config.langsmith.apiKey },
    // Other required values...
  ];

  const missing = requiredValues.filter(item => !item.value);

  if (missing.length > 0) {
    const missingNames = missing.map(item => item.name).join(", ");
    return Err(new ConfigError(
      `Missing required configuration: ${missingNames}. Please check your .env file or environment variables.`
    ));
  }

  return Ok(config);
}
```

### 5.3 Default Values

Default values are provided for non-sensitive configuration:

```typescript
// Example (conceptual) - actual implementation will follow functional paradigm
function defaultDataDir(): string {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";

  if (Deno.build.os === "darwin") {
    return `${homeDir}/Library/Application Support/lens`;
  } else if (Deno.build.os === "windows") {
    return `${homeDir}\\AppData\\Roaming\\lens`;
  } else {
    return `${homeDir}/.config/lens`;
  }
}
```

## 6. Developer Experience

### 6.1 Local Development Setup

For local development, the process is straightforward:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/lens.git
   cd lens
   ```

2. **Copy the example environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the .env file** with your specific values:
   ```
   # Add your LangSmith API key
   LENS_LANGSMITH_API_KEY=your-api-key-here

   # Customize other settings as needed
   LENS_LANGSMITH_PROJECT=your-project-name
   ```

4. **Run the application**:
   ```bash
   deno run --allow-env --allow-read --allow-net src/app.ts
   ```

### 6.2 Documentation

Clear documentation is provided in CONTRIBUTING.md:

- Complete list of configuration variables with descriptions
- Instructions for setting up the .env file
- Explanation of variable purposes and acceptable values

### 6.3 Error Handling

The configuration system provides clear error messages:

- Validation errors specify exactly which required values are missing
- Suggestions for how to fix configuration issues
- References to documentation for more information

### 6.4 Example Environment File

An `.env.example` file is provided in the repository root:

```
# Core Configuration
LENS_DATA_DIR=~/.lens
LENS_LOG_LEVEL=info
LENS_PORT=8000

# LLM Configuration
LENS_OLLAMA_BASE_URL=http://localhost:11434
LENS_OLLAMA_EMBEDDING_MODEL=nomic-embed-text
LENS_OLLAMA_LLM_MODEL=llama2

# LangChain Configuration
LENS_LANGCHAIN_TRACING=false

# LangSmith Configuration (Required)
LENS_LANGSMITH_API_KEY=your-api-key-here
LENS_LANGSMITH_PROJECT=lens-development
LENS_LANGSMITH_TRACING_ENABLED=true

# Database Configuration
LENS_DB_PATH=~/.lens/lens.db
```

This file serves as both documentation and a template for developers to create their own `.env` file.

## 7. Deployment Considerations

### 7.1 Local Development

For local development:

- Developers use a `.env` file for configuration
- The `.env` file is excluded from version control via `.gitignore`
- Configuration validation provides immediate feedback on missing values

### 7.2 CI/CD Pipelines

For CI/CD pipelines:

- Environment variables are set as pipeline secrets
- No `.env` file is needed in CI/CD environments
- Configuration validation runs as an early step
- Different variable sets are used for different environments

### 7.3 Docker Deployment

For Docker deployments:

```dockerfile
FROM denoland/deno:latest

WORKDIR /app

# Copy application code
COPY . .

# Expose the port your application uses
EXPOSE 8000

# Run the application
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "src/app.ts"]
```

Environment variables can be provided in several ways:

1. **Docker Run Command**:
   ```bash
   docker run -p 8000:8000 \
     -e LENS_LANGSMITH_API_KEY=your-api-key \
     -e LENS_LANGSMITH_PROJECT=your-project \
     lens-app
   ```

2. **Docker Compose**:
   ```yaml
   version: '3'
   services:
     lens-app:
       build: .
       ports:
         - "8000:8000"
       environment:
         - LENS_LANGSMITH_API_KEY=your-api-key
         - LENS_LANGSMITH_PROJECT=your-project
   ```

3. **Environment File with Docker**:
   ```bash
   docker run -p 8000:8000 --env-file .env lens-app
   ```

### 7.4 Cloud Deployment

For cloud deployments:

- Environment variables are set in the cloud provider's configuration
- For Kubernetes, use Secrets and ConfigMaps
- For serverless, use the platform's environment variable management
- Cloud-specific secret management services can be integrated

## 8. Multi-User SaaS Considerations

If Lens evolves into a multi-user SaaS product:

- Configuration will be split into application-level and tenant-level
- Application-level configuration will continue to use environment variables
- Tenant-level configuration will be stored in the database
- A configuration service will manage access to configuration values

## 9. Conclusion

The hybrid configuration approach provides a pragmatic balance between developer experience and deployment flexibility. By supporting both `.env` files for local development and environment variables for production, the project offers:

1. **Simple Developer Onboarding**: Easy setup with `.env.example` template
2. **Deployment Flexibility**: Seamless transition to containerized and cloud environments
3. **Security**: Sensitive information remains outside of version control
4. **Consistency**: Same configuration structure across all environments

This approach aligns with modern application development practices and the Twelve-Factor App methodology, while maintaining the simplicity needed for an open-source project with multiple contributors.
