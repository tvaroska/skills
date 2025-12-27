# Tools in ADK

Tools give agents capabilities beyond text generation - searching the web, calling APIs, executing code, and more.

## Tool Types

### Built-in Tools

ADK provides pre-built tools for common use cases.

#### Google Search

```python
from google.adk.tools import google_search

agent = LlmAgent(
    name="search_assistant",
    model="gemini-2.5-flash",
    tools=[google_search]
)
```

#### Code Execution

```python
from google.adk.tools import code_execution

agent = LlmAgent(
    name="code_runner",
    model="gemini-2.5-flash",
    tools=[code_execution]
)
```

### Function Tools

Convert Python functions into agent tools using decorators.

```python
from google.adk.tools import tool

@tool
def get_weather(location: str, units: str = "celsius") -> str:
    """Get current weather for a location.

    Args:
        location: City name or coordinates
        units: Temperature units (celsius or fahrenheit)

    Returns:
        Weather information as a string
    """
    # Implementation
    return f"Weather in {location}: 22°{units[0].upper()}"

agent = LlmAgent(
    name="weather_assistant",
    model="gemini-2.5-flash",
    tools=[get_weather]
)
```

**Key points:**
- Docstrings are crucial - they tell the model when/how to use the tool
- Type hints help the model understand parameters
- Return types should be JSON-serializable

### OpenAPI Integration

Automatically generate tools from OpenAPI specifications.

```python
from google.adk.tools import openapi_tool

# From URL
weather_api = openapi_tool(
    spec_url="https://api.example.com/openapi.json",
    operations=["getCurrentWeather", "getForecast"]  # Optional: select specific ops
)

# From file
weather_api = openapi_tool(
    spec_file="./openapi.yaml",
    base_url="https://api.example.com"  # Override base URL if needed
)

agent = LlmAgent(
    name="api_assistant",
    model="gemini-2.5-flash",
    tools=[weather_api]
)
```

### Model Context Protocol (MCP) Tools

Integrate MCP servers as tools.

```python
from google.adk.tools import mcp_tool

# Connect to MCP server
filesystem_tools = mcp_tool(
    server_config={
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
)

agent = LlmAgent(
    name="file_assistant",
    model="gemini-2.5-flash",
    tools=[filesystem_tools]
)
```

**Popular MCP servers:**
- `@modelcontextprotocol/server-filesystem` - File operations
- `@modelcontextprotocol/server-github` - GitHub integration
- `@modelcontextprotocol/server-sqlite` - SQLite databases
- `@modelcontextprotocol/server-postgres` - PostgreSQL databases

### Google Cloud Tools

Access Google Cloud services as tools.

```python
from google.adk.tools.google_cloud import (
    bigquery_tool,
    cloud_storage_tool,
    vertex_ai_search_tool
)

# BigQuery tool
bq = bigquery_tool(
    project_id="my-project",
    dataset_id="analytics"
)

# Cloud Storage tool
gcs = cloud_storage_tool(
    project_id="my-project",
    bucket_name="my-bucket"
)

# Vertex AI Search tool
search = vertex_ai_search_tool(
    project_id="my-project",
    data_store_id="my-datastore"
)

agent = LlmAgent(
    name="cloud_assistant",
    model="gemini-2.5-flash",
    tools=[bq, gcs, search]
)
```

### Third-Party Tools

Integrate external tools and frameworks.

```python
# LangChain tools
from langchain.tools import DuckDuckGoSearchRun
from google.adk.tools import from_langchain

search = DuckDuckGoSearchRun()
adk_search_tool = from_langchain(search)

# Other frameworks
from google.adk.tools import from_llamaindex  # LlamaIndex tools
```

## Tool Authentication

Configure authentication for tools that require it.

```python
from google.adk.tools import tool_with_auth

@tool_with_auth(
    auth_type="oauth2",
    scopes=["https://www.googleapis.com/auth/cloud-platform"]
)
def call_authenticated_api(query: str) -> str:
    """Call an API that requires authentication."""
    # Implementation uses authenticated context
    pass
```

## Streaming Tools

Some tools support streaming responses for real-time output.

```python
from google.adk.tools import streaming_tool

@streaming_tool
async def stream_data(query: str):
    """Stream data in chunks."""
    for chunk in process_query(query):
        yield chunk
```

**Note:** Streaming tools require async agent execution.

## Tool Configuration

### Tool Selection Control

Control which tools are available in different contexts:

```python
from google.adk.tools import ToolConfig

tool_config = ToolConfig(
    allowed_tools=["get_weather", "google_search"],  # Whitelist
    forbidden_tools=["delete_data"],  # Blacklist
    require_confirmation=["send_email"]  # Ask before using
)

agent = LlmAgent(
    name="safe_assistant",
    model="gemini-2.5-flash",
    tools=[get_weather, google_search, delete_data, send_email],
    tool_config=tool_config
)
```

### Error Handling

Handle tool execution errors gracefully:

```python
@tool
def risky_operation(param: str) -> str:
    """Operation that might fail."""
    try:
        result = perform_operation(param)
        return f"Success: {result}"
    except Exception as e:
        return f"Error: {str(e)}"
```

The agent receives error messages and can retry or use alternative approaches.

## Best Practices

1. **Clear docstrings**: Write detailed descriptions of what tools do and when to use them
2. **Type hints**: Always use type hints for parameters and return values
3. **Error handling**: Handle errors within tools and return informative messages
4. **Scoping**: Give agents only the tools they need for their role
5. **Testing**: Test tools independently before giving them to agents
6. **Authentication**: Use proper authentication mechanisms for sensitive operations
7. **Rate limiting**: Implement rate limiting for API-based tools
8. **Validation**: Validate inputs within tools before executing operations

## Common Patterns

### Composing Multiple Tools

```python
from google.adk.tools import google_search, code_execution

research_agent = LlmAgent(
    name="researcher",
    model="gemini-2.5-pro",
    instruction="Research topics and analyze data.",
    tools=[google_search, code_execution]
)
```

### Conditional Tool Use

```python
from google.adk.tools import tool

@tool
def get_user_preference(user_id: str) -> dict:
    """Get user preferences to customize behavior."""
    return {"language": "en", "timezone": "UTC"}

@tool
def format_response(content: str, preferences: dict) -> str:
    """Format response based on user preferences."""
    # Use preferences to customize output
    return formatted_content
```

## Documentation References

- Built-in tools: https://github.com/google/adk-docs/blob/main/docs/tools/built-in-tools.md
- Function tools: https://github.com/google/adk-docs/blob/main/docs/tools/function-tools.md
- OpenAPI: https://github.com/google/adk-docs/blob/main/docs/tools/openapi-tools.md
- MCP tools: https://github.com/google/adk-docs/blob/main/docs/tools/mcp-tools.md
- Google Cloud: https://github.com/google/adk-docs/blob/main/docs/tools/google-cloud-tools.md
- Authentication: https://github.com/google/adk-docs/blob/main/docs/tools/authentication.md
- Streaming tools: https://github.com/google/adk-docs/blob/main/docs/streaming/streaming-tools.md
