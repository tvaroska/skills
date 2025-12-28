# Streaming Responses

Stream responses for real-time output.

## Basic Streaming

```python
# Basic streaming
for chunk in client.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

## Async Streaming

```python
async for chunk in client.aio.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

## Streaming with Multimodal Inputs

```python
from google.genai import types

with open('image.jpg', 'rb') as f:
    image_bytes = f.read()

for chunk in client.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents=[
        'What is this image about?',
        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
    ],
):
    print(chunk.text, end='')
```

## Async Text Generation

```python
# Async text generation (non-streaming)
async def generate_async():
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash',
        contents='Write a poem about mountains'
    )
    return response.text
```

## Use Cases for Async

Async operations are particularly useful for:
- Handling multiple concurrent requests
- Building async web applications (FastAPI, aiohttp)
- Streaming responses in real-time
- Non-blocking operations in event-driven systems

## Important Notes

- **Streaming is not supported** with function calling or structured outputs
- Use streaming for better user experience with long responses
- Async streaming requires an async context
- All SDK operations support async via the `client.aio` interface
