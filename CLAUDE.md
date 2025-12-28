# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a skills repository containing reusable documentation/reference materials for working with various AI/ML APIs. Each skill is a self-contained directory with comprehensive documentation.

## Repository Structure

```
skills/
├── vertex-ai/                # Google Vertex AI Gemini models via google.genai SDK
│   ├── SKILL.md             # Main skill documentation with quick start
│   └── reference/           # Advanced topics and patterns
│       ├── chat.md          # Multi-turn conversations
│       ├── configuration.md # Generation parameters
│       ├── error-handling.md
│       ├── function-calling.md  # Agentic workflows
│       └── streaming.md     # Real-time response streaming
```

## Documentation Architecture

### Skill Structure Pattern

Each skill follows this documentation pattern:

1. **SKILL.md**: Main entry point with:
   - Frontmatter (name, description)
   - Setup instructions (installation, initialization)
   - Quick Start examples
   - Core use cases (text generation, structured output, multimodal)
   - Model selection guide
   - Links to reference docs

2. **reference/** subdirectory: Advanced topics including:
   - Configuration details
   - Error handling patterns
   - Streaming patterns (sync/async)
   - Multi-turn chat sessions
   - Function calling for agentic workflows

### Documentation Writing Guidelines

When creating or updating skill documentation:

- **Progressive disclosure**: Start simple in SKILL.md, link to reference docs for advanced topics
- **Runnable code examples**: Every code block should be copy-paste ready
- **Error handling**: Always show error handling patterns for API calls
- **Model guidance**: Provide clear model selection guidance (speed/cost/capability tradeoffs)
- **Practical limits**: Document size limits, token limits, and API constraints
- **Type safety**: Use type hints and Pydantic models where applicable

## Key Concepts

### Vertex AI Skill

The vertex-ai skill documents the `google.genai` SDK for Google's Vertex AI platform:

- **Client initialization**: Requires `vertexai=True` and `location` parameters
- **Model naming**: Uses format `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-pro-preview`
- **Location constraints**: Some models (gemini-3-pro-preview) require `location='global'`
- **Async support**: All operations available via `client.aio.*` interface
- **Structured output**: Uses Pydantic schemas with `response_mime_type` and `response_json_schema`
- **Multimodal inputs**: Supports images, PDFs, video, audio via `types.Part.from_bytes()` or `types.Part.from_uri()`
- **Function calling**: Enables agentic workflows by passing Python functions in `config.tools`
- **Streaming limitations**: Not supported with function calling or structured outputs

### Error Handling Pattern

All API calls should be wrapped with:
```python
from google.api_core import exceptions

try:
    response = client.models.generate_content(...)
except exceptions.ResourceExhausted as e:
    # Handle quota exceeded
except exceptions.InvalidArgument as e:
    # Handle invalid parameters
```

## Creating New Skills

When adding a new skill:

1. Create directory: `skills/<skill-name>/`
2. Add SKILL.md with frontmatter:
   ```markdown
   ---
   name: skill-name
   description: "Brief description"
   ---
   ```
3. Include Setup section with installation commands
4. Provide Quick Start with minimal example
5. Add core use cases with runnable examples
6. Create reference/ directory for advanced topics
7. Link to reference docs from main SKILL.md

## Common Patterns

### Multi-turn Conversations
Use `client.chats.create()` to maintain conversation history. Note that full history is sent with each turn.

### Structured Output
Combine Pydantic schemas with `response_mime_type: "application/json"` and `response_json_schema: YourModel.model_json_schema()`.

### Agentic Function Calling
Check for `response.candidates[0].content.parts[0].function_call`, execute the function, then continue the conversation with `types.Part.from_function_response()`.

### Async Operations
Use `client.aio.*` for all async operations. Particularly useful for streaming and concurrent requests.
