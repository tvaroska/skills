# Environment Setup

Complete setup guide for building agent systems with Google's AI ecosystem.

## Required Knowledge

- Python programming (intermediate level)
- Basic understanding of APIs and async/await
- Familiarity with command line

## Software Requirements

### Python 3.10+

Check your Python version:
```bash
python --version
```

If you need to upgrade, visit [python.org](https://www.python.org/downloads/)

### Core Dependencies

Install all required packages:
```bash
pip install google-genai google-adk google-cloud-aiplatform a2a-sdk
```

**Package descriptions:**
- `google-genai` - Vertex AI SDK for direct model API access
- `google-adk` - Agent Development Kit for high-level agent building
- `google-cloud-aiplatform` - Vertex AI platform services
- `a2a-sdk` - Agent-to-Agent communication protocol

### Development Tools (Optional)

For interactive development:
```bash
pip install jupyter ipython
```

## Google Cloud Setup

### Install gcloud CLI

Download and install from: https://cloud.google.com/sdk/docs/install

Verify installation:
```bash
gcloud version
```

### Authenticate

Set up application default credentials:
```bash
gcloud auth application-default login
```

This will open a browser window for authentication.

### Configure Project

Set your Google Cloud project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual project ID.

### Enable Required APIs

Enable the necessary Google Cloud APIs:
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

## Automated Setup

Use the provided script for automated setup:

```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
```

This script will:
1. Authenticate with Google Cloud
2. Set your project ID
3. Enable required APIs

## Validation

Verify your environment is configured correctly:

```bash
python scripts/validate_environment.py
```

This will check:
- Python version (3.10+)
- Required packages installed
- gcloud CLI configured
- Project set correctly

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

```bash
# Clear existing credentials
gcloud auth application-default revoke

# Re-authenticate
gcloud auth application-default login
```

### API Not Enabled

If you see "API not enabled" errors:

```bash
# Check enabled services
gcloud services list --enabled

# Enable specific API
gcloud services enable [API_NAME]
```

### Permission Issues

Ensure your account has the necessary roles:
- `roles/aiplatform.user` - For Vertex AI access
- `roles/serviceusage.serviceUsageConsumer` - For API usage

Add roles via Cloud Console or:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/aiplatform.user"
```

### Quota Issues

Check your API quotas in the Cloud Console:
- Navigate to: APIs & Services > Quotas
- Filter by "Vertex AI API"
- Request quota increases if needed

## Next Steps

Once setup is complete:
1. Start with [Basic SDK Agent](basic-sdk-agent.md)
2. Explore [Common Patterns](patterns.md)
3. Review [Use Cases](use-cases.md) for inspiration
