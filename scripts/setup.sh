#!/bin/bash
#==============================================================================
# Lens Engine Setup Script
#==============================================================================
#
# DESCRIPTION:
#   This script sets up the Lens Engine environment by:
#   1. Detecting and respecting existing configuration in .env file
#   2. Creating or configuring the data directory for Lens Engine
#   3. Setting up the environment configuration (.env file)
#   4. Creating the necessary directory structure
#   5. Optionally initializing the data pipeline
#
# FEATURES:
#   - Respects existing configuration: If you have an existing .env file and
#     choose not to overwrite it, the script will use your current settings
#   - Smart defaults: Uses existing data directory if available
#   - Backup creation: Creates a backup of your .env file before overwriting
#   - Sample data: Copies sample files if available
#   - Data pipeline initialization: Optionally runs the data pipeline
#
# USAGE:
#   Run this script from the scripts directory:
#   $ cd scripts
#   $ ./setup.sh
#
# NOTES:
#   - Requires Deno to be installed
#   - Must be run from the scripts directory
#   - Will create directories if they don't exist
#==============================================================================

# Print with colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}         Project Setup Wizard          ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check for Deno installation
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed!${NC}"
    echo -e "Please install Deno first by following the instructions at https://deno.land/"
    exit 1
fi

# Function to extract value from .env file
extract_env_value() {
    local key=$1
    local file=$2
    local value=$(grep "^$key=" "$file" | cut -d '=' -f2-)
    echo "$value"
}

# Check if .env exists and extract data directory if it does
if [ -f ../.env ]; then
    EXISTING_DATA_DIR=$(extract_env_value "LENS_DATA_DIR" "../.env")
    echo -e "\n${YELLOW}Found existing data directory in .env: ${EXISTING_DATA_DIR}${NC}"
fi

# Ask for data directory
echo -e "\n${YELLOW}Where would you like to store your data?${NC}"
if [ -n "$EXISTING_DATA_DIR" ]; then
    echo -e "Leave blank to use existing: ${EXISTING_DATA_DIR}"
else
    echo -e "Leave blank for default: ${HOME}/lens-data"
fi
read -p "Data directory: " DATA_DIR

# Use existing data directory if none provided
if [ -z "$DATA_DIR" ]; then
    if [ -n "$EXISTING_DATA_DIR" ]; then
        DATA_DIR="$EXISTING_DATA_DIR"
        echo -e "Using existing data directory: ${DATA_DIR}"
    else
        DATA_DIR="${HOME}/lens-data"
        echo -e "Using default data directory: ${DATA_DIR}"
    fi
fi

# Create .env file
echo -e "\n${GREEN}Creating environment configuration...${NC}"
if [ -f ../.env ]; then
    echo -e "${YELLOW}Warning: .env file already exists.${NC}"
    read -p "Overwrite existing .env file? (y/n): " OVERWRITE

    if [ "$OVERWRITE" = "y" ] || [ "$OVERWRITE" = "Y" ]; then
        # Create backup of existing .env file
        BACKUP_FILE="../.env.backup.$(date +%Y%m%d%H%M%S)"
        cp ../.env "$BACKUP_FILE"
        echo -e "Backup created: ${BACKUP_FILE}"
        ENV_FILE="../.env"

        # Check if .env.example exists
        if [ ! -f ../.env.example ]; then
            echo -e "${RED}Error: .env.example file not found!${NC}"
            echo -e "Please make sure you're running this script from the scripts directory."
            exit 1
        fi

        # Create new .env file from example
        cp ../.env.example $ENV_FILE
        sed -i.bak "s|LENS_DATA_DIR=.*|LENS_DATA_DIR=${DATA_DIR}|" $ENV_FILE
        rm -f "${ENV_FILE}.bak" 2>/dev/null

        echo -e "Environment file updated: ${ENV_FILE}"
    else
        echo -e "${GREEN}Using existing .env file with data directory: ${DATA_DIR}${NC}"
        # No need to create .env.new, just use the existing .env
    fi
else
    ENV_FILE="../.env"

    # Check if .env.example exists
    if [ ! -f ../.env.example ]; then
        echo -e "${RED}Error: .env.example file not found!${NC}"
        echo -e "Please make sure you're running this script from the scripts directory."
        exit 1
    fi

    # Create new .env file from example
    cp ../.env.example $ENV_FILE
    sed -i.bak "s|LENS_DATA_DIR=.*|LENS_DATA_DIR=${DATA_DIR}|" $ENV_FILE
    rm -f "${ENV_FILE}.bak" 2>/dev/null

    echo -e "Environment file created: ${ENV_FILE}"
fi

# Create directory structure
echo -e "\n${GREEN}Creating directory structure...${NC}"
mkdir -p "$DATA_DIR"

if [ -d "../docs/samples" ]; then
    echo -e "\n${BOLD}${CYAN}▶▶▶ COPYING SAMPLE FILES AND DIRECTORIES ◀◀◀${NC}"
    echo -e "${YELLOW}Looking for sample files in docs/samples...${NC}"

    if [ "$(ls -A ../docs/samples 2>/dev/null)" ]; then
        echo -e "${GREEN}Found sample files! Copying to your data directory...${NC}"
        cp -r ../docs/samples/* "$DATA_DIR"/
        echo -e "\n${BOLD}${GREEN}✓ SUCCESS! Sample files copied to: ${DATA_DIR}${NC}"
        echo -e "${CYAN}The following files were copied:${NC}"
        find ../docs/samples -type f | sed "s|../docs/samples|$DATA_DIR|g" | sed 's/^/  - /'
    else
        echo -e "${YELLOW}Sample directory exists but is empty. Creating basic structure...${NC}"
        mkdir -p "$DATA_DIR/opml"
        mkdir -p "$DATA_DIR/feeds"
        mkdir -p "$DATA_DIR/fetched"
        mkdir -p "$DATA_DIR/processed"
    fi
else
    echo -e "\n${BOLD}${YELLOW}⚠️ SAMPLE DIRECTORY NOT FOUND ⚠️${NC}"
    echo -e "${CYAN}Creating basic directory structure instead...${NC}"
    mkdir -p "$DATA_DIR/opml"
    mkdir -p "$DATA_DIR/feeds"
    mkdir -p "$DATA_DIR/fetched"
    mkdir -p "$DATA_DIR/processed"
    echo -e "${YELLOW}Note: No sample files were copied. You'll need to add your own data files.${NC}"
fi

echo -e "\n${BOLD}${GREEN}✓ DIRECTORY STRUCTURE CREATED${NC}"
echo -e "${CYAN}Location: ${DATA_DIR}${NC}"
echo -e "${YELLOW}Directory contents:${NC}"
ls -la "$DATA_DIR" | sed 's/^/  /'

# Ask if user wants to initialize the data
echo -e "\n${YELLOW}Would you like to initialize the data pipeline now?${NC}"
read -p "Initialize now? (y/n): " INITIALIZE

if [ "$INITIALIZE" = "y" ] || [ "$INITIALIZE" = "Y" ]; then
    # Process OPML
    echo -e "\n${GREEN}Initializing feeds from OPML...${NC}"
    (cd .. && deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts)

    # Fetch content
    echo -e "\n${GREEN}Fetching content...${NC}"
    (cd .. && deno run --allow-net --allow-read --allow-write --allow-env --env src/retrieval/lab/content_fetcher.ts)

    # Process content
    echo -e "\n${GREEN}Processing content...${NC}"
    (cd .. && deno run --allow-net --allow-read --allow-write src/processors/lab/html_summarizer.ts)

    echo -e "\n${GREEN}Setup complete and data pipeline initialized!${NC}"
    echo -e "Your data is available at: ${DATA_DIR}"
else
    echo -e "\n${GREEN}Setup complete!${NC}"
    echo -e "To initialize your data pipeline later, run the following commands from the project root:"
    echo -e "\n${BLUE}# Initialize feeds${NC}"
    echo "deno run --allow-net --allow-read --allow-write src/feeds/lab/opml_feed_processor.ts"
    echo -e "\n${BLUE}# Fetch content${NC}"
    echo "deno run --allow-net --allow-read --allow-write --allow-env --env src/retrieval/lab/content_fetcher.ts"
    echo -e "\n${BLUE}# Process content${NC}"
    echo "deno run --allow-net --allow-read --allow-write src/processors/lab/html_summarizer.ts"
fi

echo -e "\n${BLUE}=================================================${NC}"
echo -e "${BOLD}${GREEN}       🎉 SETUP COMPLETED SUCCESSFULLY! 🎉     ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "\n${CYAN}Your Lens environment is now ready to use!${NC}"
echo -e "${YELLOW}Data directory: ${DATA_DIR}${NC}"
echo -e "${GREEN}Happy exploring with Lens!${NC}"
