# Installation Guide

Complete installation guide for the Google AI agent ecosystem, covering all skills in this repository.

## Quick Install

For the complete ecosystem in one command:

```bash
pip install google-genai google-adk "google-cloud-aiplatform[agent_engines,langchain]>=1.112" "a2a-sdk[sql,http-server]" "anthropic[vertex]"
```

This installs all components needed for:
- **vertex-ai**: Gemini and Claude models on Vertex AI
- **google-adk**: Agent Development Kit with tools
- **vertex-agent-engine**: Agent deployment to managed infrastructure
- **a2a**: Agent-to-agent communication protocol

## Prerequisites

### Python Version

**Required:** Python 3.10 or higher (Python 3.11 recommended for agent-engine)

Check your version:
```bash
python --version
```

If you need to upgrade, visit [python.org](https://www.python.org/downloads/)

### Virtual Environment (Recommended)

Create an isolated environment for your project:

```bash
# Using venv
python -m venv agent-env
source agent-env/bin/activate  # On Windows: agent-env\Scripts\activate

# Using conda
conda create -n agent-env python=3.11
conda activate agent-env
```

## Installation by Skill

Install only what you need for your specific use case.

### 1. vertex-ai (Foundation Layer)

For direct model API access to Gemini and Claude:

**Gemini models only:**
```bash
pip install google-genai
```

**Claude models only:**
```bash
pip install google-cloud-aiplatform "anthropic[vertex]"
```

**Both Gemini and Claude:**
```bash
pip install google-genai google-cloud-aiplatform "anthropic[vertex]"
```

**Use when:** Learning fundamentals, simple model calls, custom applications

### 2. google-adk (Agent Builder)

For building agents with tools and multi-agent systems:

**Stable release (recommended):**
```bash
pip install google-adk
```

**Development version (latest features):**
```bash
pip install git+https://github.com/google/adk-python.git@main
```

**Use when:** Building agents with tools, multi-agent coordination, evaluation

### 3. vertex-agent-engine (Deployment)

For deploying agents to managed production infrastructure:

**ADK-based agents:**
```bash
pip install "google-cloud-aiplatform[agent_engines,langchain]>=1.112"
```

**LangGraph agents:**
```bash
pip install "google-cloud-aiplatform[agent_engines,langgraph]>=1.112"
```

**Use when:** Production deployment, managed infrastructure, auto-scaling

### 4. a2a (Communication Protocol)

For agent-to-agent communication:

**Basic installation:**
```bash
pip install a2a-sdk
```

**With SQL persistence:**
```bash
pip install "a2a-sdk[sql]"
```

**With HTTP server support:**
```bash
pip install "a2a-sdk[http-server]"
```

**All features:**
```bash
pip install "a2a-sdk[sql,http-server]"
```

**Use when:** Distributed multi-agent systems, service-to-service communication

## Installation by Use Case

Choose the installation that matches your goals.

### Learning the Basics

Start with the foundation:
```bash
pip install google-genai
```

### Building Single Agents

Add the agent framework:
```bash
pip install google-genai google-adk
```

### Production Deployment

Include deployment tools:
```bash
pip install google-genai google-adk "google-cloud-aiplatform[agent_engines]>=1.112"
```

### Distributed Multi-Agent Systems

Full ecosystem:
```bash
pip install google-genai google-adk "google-cloud-aiplatform[agent_engines]>=1.112" "a2a-sdk[sql,http-server]"
```

### Working with Claude Models

Add Anthropic SDK with Vertex AI support:
```bash
pip install google-cloud-aiplatform "anthropic[vertex]"
```

## Optional Development Tools

### Interactive Development

For Jupyter notebooks and IPython:
```bash
pip install jupyter ipython
```

### Code Quality Tools

For linting and formatting:
```bash
pip install black isort pylint mypy
```

### Testing Tools

For unit and integration testing:
```bash
pip install pytest pytest-asyncio pytest-cov httpx
```

### ADK Development UI

For testing agents with a web interface:
```bash
# Already included with google-adk
adk ui your_agent_directory/
```

## Google Cloud Setup

### 1. Install gcloud CLI

Download from: https://cloud.google.com/sdk/docs/install

Verify:
```bash
gcloud version
```

### 2. Authenticate

Set up application default credentials:
```bash
gcloud auth application-default login
```

This opens a browser for authentication.

### 3. Configure Project

Set your project ID:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### 4. Enable APIs

Enable required Google Cloud APIs:
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

### Automated Google Cloud Setup

Use the provided script:
```bash
bash scripts/setup_gcloud.sh YOUR_PROJECT_ID
```

## Verification

### Verify Package Installation

Check all packages are installed:
```bash
pip list | grep -E "google-genai|google-adk|google-cloud-aiplatform|a2a-sdk|anthropic"
```

### Verify Environment

Run the validation script:
```bash
python scripts/validate_environment.py
```

This checks:
- Python version (3.10+)
- All required packages
- gcloud CLI configuration
- Project settings
- API enablement

### Quick Test

Test Vertex AI connection:

```python
from google import genai

client = genai.Client(vertexai=True, location='global')
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Say hello!'
)
print(response.text)
```

## Package Version Requirements

### Minimum Versions

- `google-genai`: Latest (pip will install current version)
- `google-adk`: Latest (pip will install current version)
- `google-cloud-aiplatform`: >= 1.112 (for agent_engines support)
- `a2a-sdk`: Latest (pip will install current version)
- `anthropic`: Latest with vertex extra

### Staying Updated

Update all packages:
```bash
pip install --upgrade google-genai google-adk google-cloud-aiplatform a2a-sdk anthropic
```

Check for outdated packages:
```bash
pip list --outdated
```

## Platform-Specific Notes

### macOS

May need to install additional tools:
```bash
# If you encounter SSL errors
brew install openssl

# If you need build tools
xcode-select --install
```

### Windows

Use PowerShell or Command Prompt. Activate virtual environment with:
```bash
agent-env\Scripts\activate
```

### Linux

Most distributions work out of the box. If you encounter issues:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-dev build-essential

# Fedora/RHEL
sudo dnf install python3-devel gcc
```

## Troubleshooting

### Import Errors

If you see `ModuleNotFoundError`:
```bash
# Verify package is installed
pip show google-genai

# Reinstall if needed
pip install --force-reinstall google-genai
```

### Version Conflicts

If you encounter dependency conflicts:
```bash
# Create fresh virtual environment
python -m venv fresh-env
source fresh-env/bin/activate
pip install [packages]
```

### Authentication Issues

Clear and re-authenticate:
```bash
gcloud auth application-default revoke
gcloud auth application-default login
```

### API Not Enabled

Enable missing APIs:
```bash
gcloud services list --available | grep vertex
gcloud services enable [API_NAME]
```

### Permission Denied

Ensure your account has required roles:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/aiplatform.user"
```

## Requirements.txt Template

For reproducible installations, create a `requirements.txt`:

```txt
# Core ecosystem
google-genai
google-adk
google-cloud-aiplatform[agent_engines,langchain]>=1.112
a2a-sdk[sql,http-server]
anthropic[vertex]

# Optional: Development tools
jupyter
ipython
pytest
pytest-asyncio
black
isort
```

Install with:
```bash
pip install -r requirements.txt
```

## Docker Installation

For containerized deployments:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t my-agent .
docker run -e GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID my-agent
```

## Next Steps

After installation:

1. **Verify setup**: Run `python scripts/validate_environment.py`
2. **Start learning**: Follow [Basic SDK Agent](basic-sdk-agent.md)
3. **Review examples**: Explore the [agent-demo examples](../SKILL.md)
4. **Read skill docs**: Check individual skill documentation:
   - [vertex-ai](../../vertex-ai/SKILL.md)
   - [google-adk](../../google-adk/SKILL.md)
   - [vertex-agent-engine](../../vertex-agent-engine/SKILL.md)
   - [a2a](../../a2a/SKILL.md)

## Quick Reference

| Component | Install Command | Use Case |
|-----------|----------------|----------|
| vertex-ai | `pip install google-genai` | Direct model API access |
| google-adk | `pip install google-adk` | Building agents with tools |
| vertex-agent-engine | `pip install google-cloud-aiplatform[agent_engines]>=1.112` | Production deployment |
| a2a | `pip install a2a-sdk` | Agent communication |
| Claude support | `pip install anthropic[vertex]` | Claude models on Vertex AI |
| Full ecosystem | `pip install google-genai google-adk google-cloud-aiplatform[agent_engines] a2a-sdk anthropic[vertex]` | Everything |

## Support Resources

- **Setup Guide**: [setup.md](setup.md) - Detailed environment configuration
- **Validation Script**: `scripts/validate_environment.py` - Check your setup
- **Setup Script**: `scripts/setup_gcloud.sh` - Automated Google Cloud setup
- **Google Cloud Console**: https://console.cloud.google.com
- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
