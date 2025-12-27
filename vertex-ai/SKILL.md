---
name: vertex-ai
description: "Use Google Vertex AI Gemini models via google.genai SDK for text generation, structured JSON output, multimodal processing, and function calling. Use when: (1) User mentions Vertex AI, Gemini models, or google.genai SDK, (2) Working with Google Cloud Platform AI features, (3) Implementing generative AI features that require GCP integration, (4) User asks to use Google's latest AI models"
---

# Vertex AI

Use Google's generative AI models on Vertex AI through the `google.genai` SDK.

## Setup

Install the SDK:
```bash
uv add google-genai
```

## Quick Start

Get started with a minimal example:

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

## Client Initialization

Import and initialize the client:

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

## Available Models

### Model Selection Guide

| Model | Best For | Speed | Cost | Max Input/Output Tokens |
|-------|----------|-------|------|------------------------|
| **gemini-2.5-flash** | General tasks, high throughput, cost-sensitive workloads | Fast | Low | 1M input / 8K output |
| **gemini-2.5-pro** | Complex reasoning, analysis, high-quality creative content | Medium | Higher | 2M input / 8K output |
| **gemini-3-pro-preview** | Latest features, experimental capabilities (global location only) | Medium | Varies | 2M input / 8K output |

**When to use each model:**
- **gemini-2.5-flash** (default): Chatbots, content summarization, simple classification, data extraction, high-volume API calls
- **gemini-2.5-pro**: Advanced code generation, complex reasoning tasks, detailed analysis, nuanced creative writing
- **gemini-3-pro-preview**: Testing cutting-edge features, requires `location='global'`

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

**Error handling:** Always wrap API calls in try/except blocks to handle quota limits and invalid parameters. See [Error Handling](reference/error-handling.md) for more patterns and common issues.

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

The model will return JSON matching the provided schema, enabling type-safe parsing. See [Configuration](reference/configuration.md) for additional generation parameters like temperature and top_p.

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

The SDK supports async operations via the `client.aio` interface. See [Streaming](reference/streaming.md) for async examples and patterns.

## Additional Resources

For advanced features and patterns, see the reference documentation:

- **[Error Handling](reference/error-handling.md)** - Error handling and common issues
- **[Configuration](reference/configuration.md)** - Generation parameters (temperature, top_p, etc.)
- **[Streaming](reference/streaming.md)** - Streaming responses (sync and async)
- **[Chat](reference/chat.md)** - Multi-turn conversations
- **[Function Calling](reference/function-calling.md)** - Enable models to call your functions
