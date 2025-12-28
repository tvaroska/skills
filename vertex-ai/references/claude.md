# Claude on Vertex AI

Complete guide for using Anthropic's Claude models on Google Cloud Vertex AI.

## Overview

Claude models are available on Vertex AI as a fully managed service. Key features:

- **Serverless deployment** - No infrastructure management
- **FedRAMP High compliant** - Meet government compliance requirements
- **Global and regional endpoints** - Flexible deployment options
- **Pay-as-you-go or provisioned throughput** - Flexible pricing
- **All Claude capabilities** - Vision, tool use, streaming, batch predictions

## Installation

```bash
# Install Anthropic SDK with Vertex support
pip install -U google-cloud-aiplatform "anthropic[vertex]"

# Or with uv
uv add google-cloud-aiplatform
uv add "anthropic[vertex]"
```

## Authentication

Before using Claude on Vertex AI, authenticate with Google Cloud:

```bash
gcloud auth application-default login
```

This creates credentials that the SDK will use automatically.

## Available Models

### Current Models (2025)

| Model ID | Class | Best For | Context | Status |
|----------|-------|----------|---------|--------|
| **claude-sonnet-4-5@20250929** | Sonnet | Balanced performance, general tasks | 200K | GA |
| **claude-opus-4-5@20251101** | Opus | Most intelligent, coding, agents, enterprise | 200K | GA |
| **claude-haiku-4-5@20251001** | Haiku | Fast responses, simple tasks | 200K | GA |
| **claude-sonnet-4@20250514** | Sonnet | Previous generation Sonnet | 200K | GA |
| **claude-opus-4-1@20250805** | Opus | Enhanced Opus 4, agentic search | 200K | GA |
| **claude-opus-4@20250514** | Opus | Previous generation Opus | 200K | GA |

### Legacy Models (Deprecated)

| Model ID | Deprecation Date | Replacement |
|----------|------------------|-------------|
| claude-3-7-sonnet@20250219 | Oct 28, 2025 | claude-sonnet-4-5@20250929 |
| claude-3-5-haiku@20241022 | Dec 19, 2025 | claude-haiku-4-5@20251001 |
| claude-3-opus@20240229 | Jun 30, 2025 | claude-opus-4-5@20251101 |
| claude-3-haiku@20240307 | Active | claude-haiku-4-5@20251001 |

### Model Selection Guide

**Claude Opus 4.5** - Use for:
- Complex coding tasks and agent development
- Computer use and automation
- Enterprise workflows requiring highest accuracy
- Tasks where quality > cost

**Claude Sonnet 4.5** - Use for:
- General-purpose tasks
- Real-world agents with tool use
- Cybersecurity analysis
- Balanced cost/performance needs

**Claude Haiku 4.5** - Use for:
- High-throughput applications
- Simple Q&A and classification
- Cost-sensitive workloads
- Near-instant response requirements

## Basic Text Generation

```python
from anthropic import AnthropicVertex

# Initialize client
client = AnthropicVertex(
    project_id="your-project-id",
    region="global"
)

# Generate text
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Explain quantum computing in simple terms"
        }
    ]
)

print(message.content[0].text)
```

## System Instructions

Add system instructions to guide Claude's behavior:

```python
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    system="You are an expert Python programmer. Provide clear, well-documented code.",
    messages=[
        {
            "role": "user",
            "content": "Write a function to calculate fibonacci numbers"
        }
    ]
)
```

## Multi-turn Conversations

Maintain conversation history for multi-turn interactions:

```python
# Start conversation
messages = [
    {
        "role": "user",
        "content": "What's the capital of France?"
    }
]

response1 = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=messages
)

# Add Claude's response to history
messages.append({
    "role": "assistant",
    "content": response1.content[0].text
})

# Continue conversation
messages.append({
    "role": "user",
    "content": "What's the population?"
})

response2 = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=messages
)

print(response2.content[0].text)
```

## Streaming Responses

Stream responses for real-time output:

```python
# Streaming
with client.messages.stream(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Write a short story about a robot"
        }
    ]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

## Vision / Multimodal

Process images with Claude's vision capabilities:

### Image from Bytes

```python
import base64

# Read image file
with open("image.jpg", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

# Send to Claude
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": "What's in this image?"
                }
            ],
        }
    ],
)

print(message.content[0].text)
```

### Multiple Images

```python
# Analyze multiple images
with open("image1.jpg", "rb") as f1, open("image2.jpg", "rb") as f2:
    img1_data = base64.standard_b64encode(f1.read()).decode("utf-8")
    img2_data = base64.standard_b64encode(f2.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Compare these two screenshots and identify the differences:"
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": img1_data,
                    },
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": img2_data,
                    },
                },
            ],
        }
    ],
)
```

### Image from GCS URI

```python
# Use image from Google Cloud Storage
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "gs://your-bucket/image.jpg"
                    },
                },
                {
                    "type": "text",
                    "text": "Describe this image"
                }
            ],
        }
    ],
)
```

**Supported image formats:**
- JPEG, PNG, GIF, WebP
- Max size: 5MB per image (base64), larger with GCS URIs
- Max images per request: 20

## Tool Use (Function Calling)

Enable Claude to call your functions:

```python
# Define tools
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name, e.g., San Francisco"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["location"]
        }
    }
]

# Make request with tools
response = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=1024,
    tools=tools,
    messages=[
        {
            "role": "user",
            "content": "What's the weather in San Francisco?"
        }
    ]
)

# Check if Claude wants to use a tool
if response.stop_reason == "tool_use":
    tool_use = next(block for block in response.content if block.type == "tool_use")

    # Execute the function
    if tool_use.name == "get_weather":
        # Your function implementation
        weather_result = {
            "temperature": 72,
            "conditions": "Sunny",
            "unit": tool_use.input["unit"]
        }

        # Send result back to Claude
        final_response = client.messages.create(
            model="claude-sonnet-4-5@20250929",
            max_tokens=1024,
            tools=tools,
            messages=[
                {
                    "role": "user",
                    "content": "What's the weather in San Francisco?"
                },
                {
                    "role": "assistant",
                    "content": response.content
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": str(weather_result)
                        }
                    ]
                }
            ]
        )

        print(final_response.content[0].text)
```

## Web Search (Preview)

Enable Claude to search the web for real-time information:

```python
# Enable web search
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=2048,
    messages=[
        {
            "role": "user",
            "content": "What are the latest developments in quantum computing in 2025?"
        }
    ],
    # Enable web search
    extra_headers={
        "X-GOOGLE-VERTEX-ENABLE-SEARCH": "true"
    }
)

print(message.content[0].text)
```

**Note:** Web search is in preview and requires enablement on your GCP project.

## Batch Predictions

Process large volumes of requests cost-effectively:

```python
from google import genai
from google.genai.types import CreateBatchJobConfig, HttpOptions

# Initialize genai client for batch operations
client_genai = genai.Client(http_options=HttpOptions(api_version="v1"))

# Prepare batch input (JSONL file in GCS)
# Format: {"custom_id": "req1", "params": {"model": "...", "messages": [...]}}

# Create batch job
job = client_genai.batches.create(
    model="publishers/anthropic/models/claude-3-5-haiku",
    src="gs://your-bucket/input.jsonl",
    config=CreateBatchJobConfig(
        dest="gs://your-bucket/output/"
    ),
)

print(f"Batch job created: {job.name}")

# Check job status
status = client_genai.batches.get(name=job.name)
print(f"Status: {status.state}")
```

**Batch benefits:**
- 50% cost reduction vs real-time
- Process thousands of requests
- 24-hour completion SLA
- Ideal for non-latency-sensitive workloads

## Configuration Parameters

### Common Parameters

```python
message = client.messages.create(
    model="claude-sonnet-4-5@20250929",
    max_tokens=2048,        # Max output tokens (required)
    temperature=1.0,        # Randomness (0-1, default 1.0)
    top_p=0.9,             # Nucleus sampling (0-1)
    top_k=40,              # Top-k sampling
    stop_sequences=["END"], # Stop generation at these sequences
    messages=[...]
)
```

### Parameter Guidance

- **max_tokens**: Always required; sets upper limit on response length
- **temperature**: Lower (0.2-0.5) for focused/deterministic, higher (0.8-1.0) for creative
- **top_p**: Alternative to temperature; 0.9 is good default
- **top_k**: Limit vocabulary; useful for constrained outputs

## Regional vs Global Endpoints

Starting with Claude Sonnet 4.5 and future models:

### Global Endpoints (Recommended)

```python
client = AnthropicVertex(
    project_id="your-project-id",
    region="global"  # Dynamic routing, no premium
)
```

**Benefits:**
- Maximum availability
- No pricing premium
- Automatic load balancing

**Limitations:**
- Pay-as-you-go only (no provisioned throughput)
- No guaranteed data residency

### Regional Endpoints

```python
client = AnthropicVertex(
    project_id="your-project-id",
    region="us-east5"  # Specific region, 10% premium
)
```

**Benefits:**
- Data residency guarantees
- Supports provisioned throughput
- Compliance requirements

**Limitations:**
- 10% pricing premium
- Regional capacity limits

**Available regions:**
- us-east5, us-central1
- europe-west1, europe-west4
- asia-southeast1

## Error Handling

```python
from anthropic import APIError, APIConnectionError, RateLimitError

try:
    message = client.messages.create(
        model="claude-sonnet-4-5@20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello"}]
    )
except RateLimitError as e:
    print(f"Rate limit exceeded: {e}")
except APIConnectionError as e:
    print(f"Connection error: {e}")
except APIError as e:
    print(f"API error: {e}")
```

## Best Practices

1. **Use global endpoints** unless you need regional guarantees
2. **Enable request logging** for compliance (doesn't share data with Google/Anthropic)
3. **Use batch predictions** for non-time-sensitive workloads (50% savings)
4. **Stream responses** for better UX in interactive applications
5. **Implement retry logic** with exponential backoff
6. **Monitor token usage** to optimize costs
7. **Use system instructions** to improve response quality
8. **Leverage tool use** for agentic workflows
9. **Validate images** before sending (format, size)
10. **Set appropriate max_tokens** to control costs

## Pricing Considerations

- **Pay-as-you-go**: Per-token pricing
- **Provisioned throughput**: Reserved capacity (regional only)
- **Regional premium**: 10% additional for regional endpoints
- **Batch predictions**: 50% discount vs real-time
- **Web search**: Additional costs when enabled

See [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) for current rates.

## Limitations

- **Context window**: 200K tokens (vs Gemini's 1M-2M)
- **No structured output**: Unlike Gemini, Claude doesn't support JSON schema enforcement
- **Batch SLA**: 24-hour completion time
- **Regional availability**: Limited regions vs Gemini
- **Web search**: Preview feature, requires enablement

## Additional Resources

- **Official Anthropic Docs**: https://docs.anthropic.com/en/api/claude-on-vertex-ai
- **Google Cloud Docs**: https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude
- **Pricing**: https://cloud.google.com/vertex-ai/generative-ai/pricing
- **Model Garden**: https://cloud.google.com/model-garden (search for "Claude")
- **Sample Notebooks**: https://github.com/GoogleCloudPlatform/vertex-ai-samples
