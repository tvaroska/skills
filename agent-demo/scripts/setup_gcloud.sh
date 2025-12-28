#!/bin/bash
# Automated Google Cloud setup for agent-demo skill
# Usage: bash setup_gcloud.sh YOUR_PROJECT_ID

set -e

if [ -z "$1" ]; then
    echo "Error: Project ID required"
    echo "Usage: bash setup_gcloud.sh YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_ID="$1"

echo "Setting up Google Cloud for agent development..."
echo "Project ID: $PROJECT_ID"
echo ""

# Authenticate
echo "Step 1/3: Authenticating with Google Cloud..."
gcloud auth application-default login

# Set project
echo "Step 2/3: Setting project..."
gcloud config set project "$PROJECT_ID"

# Enable APIs
echo "Step 3/3: Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: python scripts/validate_environment.py"
echo "  2. Start with: references/basic-sdk-agent.md"
