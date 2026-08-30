#!/usr/bin/env bash

# Developer Neon Branch Setup Script
# Creates a personal Neon branch for local development
# Usage: ./scripts/dev-branch.sh [branch-name]

set -e

BRANCH_NAME=${1:-"dev-$(whoami)"}
NEON_PROJECT_ID="polished-sound-81352481"

if [ -z "$NEON_API_KEY" ]; then
  echo "Error: NEON_API_KEY environment variable is not set"
  echo "Get your API key from: https://console.neon.tech/app/settings/api-keys"
  exit 1
fi

echo "Creating Neon branch: $BRANCH_NAME"

# Create branch using Neon API
RESPONSE=$(curl -s -X POST "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"branch\": {\"name\": \"$BRANCH_NAME\", \"parent_id\": \"main\"}}")

BRANCH_ID=$(echo $RESPONSE | jq -r '.branch.id')
CONNECTION_STRING=$(echo $RESPONSE | jq -r '.branch.connection_uri')

if [ -z "$BRANCH_ID" ] || [ "$BRANCH_ID" == "null" ]; then
  echo "Error creating branch:"
  echo $RESPONSE
  exit 1
fi

echo "✅ Branch created successfully!"
echo "Branch ID: $BRANCH_ID"
echo "Connection String: $CONNECTION_STRING"

# Run migrations on the new branch
echo ""
echo "Running migrations on branch..."
export DATABASE_URL="$CONNECTION_STRING"
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "To use this branch, run:"
echo "  export DATABASE_URL=\"$CONNECTION_STRING\""
echo "  npm run dev"
echo ""
echo "Or add to .env.local:"
echo "  DATABASE_URL=$CONNECTION_STRING"