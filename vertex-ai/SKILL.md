---
name: vertex-ai
description: "Use Google Vertex AI for generative AI: Gemini models via google.genai SDK and Anthropic Claude models via anthropic SDK. Supports text generation, structured JSON output, multimodal processing, and function calling. Use when: (1) User mentions Vertex AI, Gemini, or Claude models, (2) Working with Google Cloud Platform AI features, (3) Implementing generative AI on GCP, (4) User asks to use Google's or Anthropic's AI models on Vertex AI"
---

# Vertex AI

Use generative AI models on Google Cloud Vertex AI:
- **Gemini models** via `google.genai` SDK - Google's native models
- **Claude models** via `anthropic` SDK - Anthropic's models on Vertex AI

## Setup

### For Gemini Models

Install the Google Gen AI SDK:
```bash
pip install google-genai
# or with uv
uv add google-genai
```

### For Claude Models

Install the Anthropic SDK with Vertex AI support:
```bash
pip install -U google-cloud-aiplatform "anthropic[vertex]"
# or with uv
uv add google-cloud-aiplatform
uv add "anthropic[vertex]"
```

## Quick Start

### Using Gemini Models

```python
from google import genai

# Initialize client
client = genai.Client(vertexai=True, location='global')

# Generate text
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Write a haiku about coding'
)

print(response.text)
```

### Using Claude Models

```python
from anthropic import AnthropicVertex

# Initialize client (requires gcloud auth)
client = AnthropicVertex(
    project_id="your-project-id",
    region="global"  # or specific region like "us-east5"
)

# Generate text
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Write a haiku about coding"
        }
    ]
)

print(message.content[0].text)
```

## Client Initialization

### Gemini Client

```python
from google import genai

# Simple initialization (auto-detect project and location)
client = genai.Client(vertexai=True, location='global')

# Explicit initialization (when project/location are known)
client = genai.Client(
    vertexai=True,
    project='your-project-id',
    location='us-central1'
)
```

### Claude Client

```python
from anthropic import AnthropicVertex

# Initialize with project and region
client = AnthropicVertex(
    project_id="your-project-id",
    region="global"  # or "us-east5", "europe-west1", etc.
)

# Authentication: Run `gcloud auth application-default login` before using
```

**Note on Claude regions:**
- Use `region="global"` for dynamic routing (recommended, no pricing premium)
- Use specific regions (e.g., `"us-east5"`) for data residency requirements (10% pricing premium)

## Available Models

### Gemini Models (Google)

| Model | Best For | Speed | Cost | Max Tokens |
|-------|----------|-------|------|------------|
| **gemini-2.5-flash** | General tasks, high throughput | Fast | Low | 1M in / 8K out |
| **gemini-2.5-pro** | Complex reasoning, analysis | Medium | Higher | 2M in / 8K out |
| **gemini-3-pro-preview** | Latest features (global only) | Medium | Varies | 2M in / 8K out |

### Claude Models (Anthropic)

| Model ID | Best For | Speed | Cost | Max Tokens |
|----------|----------|-------|------|------------|
| **claude-sonnet-4-5@20250929** | Balanced performance, general tasks | Fast | Medium | 200K context |
| **claude-opus-4-5@20251101** | Most intelligent, coding, agents | Medium | High | 200K context |
| **claude-haiku-4-5@20251001** | Fast responses, simple tasks | Very Fast | Low | 200K context |

See [references/claude.md](references/claude.md) for complete Claude model list and details.

### Choosing Between Gemini and Claude

**Use Gemini when:**
- Deep Google Cloud integration needed
- Structured JSON output required
- Working with GCP-specific features
- Cost optimization with Flash model

**Use Claude when:**
- Superior coding capabilities needed
- Complex reasoning and analysis tasks
- Agentic workflows and tool use
- Vision tasks requiring high accuracy

**Use both when:**
- Comparing outputs for critical tasks
- Ensemble approaches for higher accuracy
- Different models excel at different subtasks

## Simple Text Generation

Generate text with optional system instructions:

```python
from google.api_core import exceptions

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            "system_instruction": system_instruction  # Optional
        }
    )

    # Access the generated text (simple method)
    text = response.text

    # Alternative: access via candidates (for more control)
    # text = response.candidates[0].content.parts[0].text

except exceptions.ResourceExhausted as e:
    print(f"Quota exceeded: {e}")
except exceptions.InvalidArgument as e:
    print(f"Invalid argument: {e}")
except Exception as e:
    print(f"Error generating content: {e}")
```

**Key parameters:**
- `model`: Model name (default: `gemini-2.5-flash`)
- `contents`: User prompt or message
- `config.system_instruction`: Optional system-level guidance for the model

**Error handling:** Always wrap API calls in try/except blocks to handle quota limits and invalid parameters. See [Error Handling](references/error-handling.md) for more patterns and common issues.

## Structured Output Generation

Generate JSON output matching a specific schema:

```python
from pydantic import BaseModel

# Define the schema using Pydantic
class ThemeList(BaseModel):
    themes: list[str]
    primary_color: str

# Generate structured output
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config={
        "system_instruction": system_instruction,
        "response_mime_type": "application/json",
        "response_json_schema": ThemeList.model_json_schema()
    }
)

# Parse the JSON response
result = ThemeList.model_validate_json(response.text)
```

**Key parameters for structured output:**
- `config.response_mime_type`: Set to `"application/json"` for JSON output
- `config.response_json_schema`: Provide a JSON schema (use Pydantic's `model_json_schema()`)

The model will return JSON matching the provided schema, enabling type-safe parsing. See [Configuration](references/configuration.md) for additional generation parameters like temperature and top_p.

## Multimodal Inputs

Process images, PDFs, videos, and other media alongside text prompts.

### Images from Bytes

```python
from google.genai import types

with open('image.jpg', 'rb') as f:
    image_bytes = f.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'What is in this image?',
        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
    ],
)
print(response.text)
```

### Images from Cloud Storage

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Describe this image in detail',
        types.Part.from_uri(uri='gs://your-bucket/image.jpg', mime_type='image/jpeg'),
    ],
)
```

### Multiple Images with Analysis

```python
# Analyze and compare multiple images
with open('screenshot1.png', 'rb') as f1, open('screenshot2.png', 'rb') as f2:
    img1_bytes = f1.read()
    img2_bytes = f2.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'Compare these two screenshots and identify the differences:',
        types.Part.from_bytes(data=img1_bytes, mime_type='image/png'),
        types.Part.from_bytes(data=img2_bytes, mime_type='image/png'),
    ],
)
```

### Supported MIME Types & Limits

**Supported formats:**
- Images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`
- Documents: `application/pdf`
- Video: `video/mp4`, `video/mpeg`, `video/mov`, `video/avi`, `video/webm`
- Audio: `audio/mp3`, `audio/wav`, `audio/aac`

**Size limits:**
- Images: Up to 20MB per image
- Documents (PDF): Up to 200MB
- Video: Up to 2 hours duration
- Audio: Up to 9.5 hours duration
- Maximum total request size: ~19MB for direct uploads, larger files should use Cloud Storage URIs

## Async Support

The SDK supports async operations via the `client.aio` interface. See [Streaming](references/streaming.md) for async examples and patterns.

## Building Agents

This skill provides low-level SDK access for direct model API calls. For building production agents with tools, workflows, and orchestration, see:

- **[google-adk](../google-adk/SKILL.md)** - Agent Development Kit for code-first agent development with rich tool ecosystem, multi-agent systems, and built-in evaluation
- **[vertex-agent-engine](../vertex-agent-engine/SKILL.md)** - Deploy ADK agents to managed infrastructure with sessions, memory, and monitoring
- **[a2a](../a2a/SKILL.md)** - Agent-to-agent communication protocol for distributed multi-agent systems

**When to use each:**
- Use this skill (vertex-ai SDK) for: Fine-grained control, custom logic, learning the fundamentals
- Use google-adk for: Complete agents with tools, testing/evaluation, multi-agent hierarchies
- Use vertex-agent-engine for: Production deployment with managed infrastructure
- Use a2a for: Distributed agents that need to discover and communicate across services

See [When to Use ADK](references/when-to-use-adk.md) for detailed guidance on choosing between SDK and framework approaches.

## Reference Documentation

### Gemini-Specific References

- **[Error Handling](references/error-handling.md)** - Error handling and common issues
- **[Configuration](references/configuration.md)** - Generation parameters (temperature, top_p, etc.)
- **[Streaming](references/streaming.md)** - Streaming responses (sync and async)
- **[Chat](references/chat.md)** - Multi-turn conversations
- **[Function Calling](references/function-calling.md)** - Enable models to call your functions

### Claude-Specific Reference

- **[Claude on Vertex AI](references/claude.md)** - Complete guide: models, streaming, vision, tool use, batch predictions

## Additional Resources

- **Google AI for Developers**: https://ai.google.dev/
- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
- **Anthropic Documentation**: https://docs.anthropic.com/
