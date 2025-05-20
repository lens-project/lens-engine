#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Function to log debug messages
debug() {
    echo "DEBUG: $1" >&2
}

# Function to log errors
error() {
    echo "ERROR: $1" >&2
    exit 1
}

# Fetch the latest tags
debug "Fetching latest tags..."
git fetch --tags

# Check if a tag was provided
if [ $# -eq 0 ]; then
    error "Please provide a tag as an argument. Usage: $0 <tag>"
fi

current_tag=$1
output_file="changelog_${current_tag}.txt"

# Check if the tag exists
if ! git rev-parse "$current_tag" >/dev/null 2>&1; then
    error "Tag '$current_tag' does not exist. Available tags are:
$(git tag -l)"
fi

# Get the repository URL
repo_url=$(git config --get remote.origin.url | sed 's/\.git$//' | sed 's|^git@github.com:|https://github.com/|')

# Function to format commit messages with hyperlinks
format_commit() {
    local hash="$1"
    local message="$2"
    echo "- ${message#* } ([\`${hash:0:7}\`](${repo_url}/commit/$hash))"
}

# Find the previous tag
previous_tag=$(git describe --tags --abbrev=0 ${current_tag}^ 2>/dev/null || echo "")

# Get the date of the current tag
tag_date=$(git log -1 --format=%ai "$current_tag")

# Generate changelog
generate_changelog() {
    echo "## [$current_tag] - $tag_date"
    echo

    if [ -z "$previous_tag" ]; then
        debug "No previous tag found. Including all commits up to $current_tag."
        range="$current_tag"
    else
        debug "Previous tag: $previous_tag"
        range="$previous_tag..$current_tag"
    fi

    local types=("feat" "fix" "docs" "chore")
    local titles=("Features" "Bug Fixes" "Documentation" "Chores")

    for i in "${!types[@]}"; do
        local type="${types[$i]}"
        local title="${titles[$i]}"

        echo "### $title"

        commits=$(git log --no-merges "$range" --pretty=format:"%H§%s" | grep -E "^[^§]+§$type:" || true)

        if [ -n "$commits" ]; then
            while IFS= read -r line; do
                if [[ "$line" =~ ^([a-f0-9]+)§(.*)$ ]]; then
                    hash="${BASH_REMATCH[1]}"
                    message="${BASH_REMATCH[2]}"
                    format_commit "$hash" "$message"
                else
                    debug "Skipping malformed commit: $line"
                fi
            done <<< "$commits"
        else
            echo "No $type changes in this release."
        fi
        echo
    done
}

# Generate the changelog content
debug "Generating changelog for $current_tag..."
generate_changelog > "$output_file"

echo "Changelog for $current_tag has been written to $output_file"