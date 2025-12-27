# Deploying ADK Agents

ADK agents can be deployed to various Google Cloud platforms for production use.

## Deployment Options

### Cloud Run (Recommended for most cases)

Cloud Run provides serverless deployment with automatic scaling.

**Prerequisites:**
- Google Cloud project with billing enabled
- Cloud Run API enabled
- Docker installed locally

**Steps:**

1. **Create a Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY . .

# Expose port
EXPOSE 8080

# Run the agent server
CMD ["python", "main.py"]
```

2. **Create main.py with server**

```python
from google.adk.agents import LlmAgent
from google.adk.runtime import serve
import os

# Define your agent
agent = LlmAgent(
    name="my_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful assistant.",
    tools=[...]
)

# Serve on Cloud Run
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    serve(agent, host="0.0.0.0", port=port)
```

3. **Deploy to Cloud Run**

```bash
# Build and deploy in one command
gcloud run deploy my-agent \
    --source . \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_CLOUD_PROJECT=my-project

# Or build Docker image first
docker build -t gcr.io/my-project/my-agent .
docker push gcr.io/my-project/my-agent

gcloud run deploy my-agent \
    --image gcr.io/my-project/my-agent \
    --region us-central1 \
    --allow-unauthenticated
```

**Configuration options:**
- `--memory`: Set memory limit (default: 512Mi)
- `--cpu`: Set CPU allocation (default: 1)
- `--timeout`: Request timeout (default: 300s, max: 3600s)
- `--max-instances`: Maximum concurrent instances
- `--min-instances`: Minimum instances (for faster cold starts)

### Vertex AI Agent Engine

Vertex AI Agent Engine provides managed infrastructure optimized for AI agents.

**Steps:**

1. **Prepare agent configuration**

```python
# agent_config.py
from google.adk.agents import LlmAgent

def create_agent():
    return LlmAgent(
        name="vertex_agent",
        model="gemini-2.5-flash",
        instruction="You are a helpful assistant.",
        tools=[...]
    )
```

2. **Deploy to Vertex AI**

```bash
# Using ADK CLI
adk deploy \
    --agent-module agent_config:create_agent \
    --platform vertex-ai \
    --project my-project \
    --region us-central1

# Or using gcloud
gcloud ai agents deploy \
    --agent-file=agent.yaml \
    --region=us-central1
```

**Benefits:**
- Managed scaling and infrastructure
- Integrated monitoring and logging
- Built-in security features
- Optimized for Gemini models

### Google Kubernetes Engine (GKE)

For more control over infrastructure and scaling.

**Steps:**

1. **Create Kubernetes deployment**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adk-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: adk-agent
  template:
    metadata:
      labels:
        app: adk-agent
    spec:
      containers:
      - name: agent
        image: gcr.io/my-project/my-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: GOOGLE_CLOUD_PROJECT
          value: "my-project"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: adk-agent-service
spec:
  type: LoadBalancer
  selector:
    app: adk-agent
  ports:
  - port: 80
    targetPort: 8080
```

2. **Deploy to GKE**

```bash
# Create GKE cluster
gcloud container clusters create adk-cluster \
    --region us-central1 \
    --num-nodes 3

# Deploy
kubectl apply -f deployment.yaml

# Get service endpoint
kubectl get service adk-agent-service
```

## Configuration

### Environment Variables

```python
import os

# Common configuration
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL = os.environ.get("MODEL", "gemini-2.5-flash")

agent = LlmAgent(
    name="configurable_agent",
    model=MODEL,
    instruction="You are a helpful assistant."
)
```

### Runtime Configuration

```python
from google.adk.runtime import RunConfig

config = RunConfig(
    max_turns=10,
    timeout=30,
    streaming=True,
    enable_observability=True
)

serve(agent, config=config, port=8080)
```

## API Endpoints

Deployed agents expose REST API endpoints:

### POST /chat

Send messages to the agent:

```bash
curl -X POST https://my-agent-url/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, agent!",
    "session_id": "user-123"
  }'
```

### POST /chat/stream

Stream responses:

```bash
curl -X POST https://my-agent-url/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me a story",
    "session_id": "user-123"
  }'
```

### GET /health

Health check endpoint:

```bash
curl https://my-agent-url/health
```

## Security

### Authentication

Enable authentication on Cloud Run:

```bash
gcloud run deploy my-agent \
    --source . \
    --region us-central1 \
    --no-allow-unauthenticated

# Clients must include auth token
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
    https://my-agent-url/chat
```

### Service Account

Use service accounts for Google Cloud API access:

```bash
# Create service account
gcloud iam service-accounts create adk-agent \
    --display-name "ADK Agent"

# Grant permissions
gcloud projects add-iam-policy-binding my-project \
    --member "serviceAccount:adk-agent@my-project.iam.gserviceaccount.com" \
    --role "roles/aiplatform.user"

# Deploy with service account
gcloud run deploy my-agent \
    --source . \
    --service-account adk-agent@my-project.iam.gserviceaccount.com
```

### Secret Management

Use Secret Manager for sensitive data:

```python
from google.cloud import secretmanager

def get_secret(secret_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

API_KEY = get_secret("api-key")
```

## Monitoring

### Cloud Logging

```python
import logging
from google.cloud import logging as cloud_logging

# Setup Cloud Logging
client = cloud_logging.Client()
client.setup_logging()

# Log from your agent
logger = logging.getLogger(__name__)
logger.info("Agent started")
logger.error("Tool execution failed", extra={"tool": "search"})
```

### Cloud Monitoring

Set up alerts and dashboards:

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=my-agent"

# Create alert
gcloud alpha monitoring policies create \
    --notification-channels=CHANNEL_ID \
    --display-name="Agent Error Rate" \
    --condition-threshold-value=0.1
```

## Scaling

### Auto-scaling Configuration

Cloud Run auto-scales based on traffic:

```bash
gcloud run deploy my-agent \
    --source . \
    --min-instances 1 \
    --max-instances 100 \
    --concurrency 80
```

### Cost Optimization

- Use `--min-instances 0` for infrequent traffic
- Use `--min-instances 1+` to avoid cold starts
- Choose appropriate CPU/memory allocation
- Use `gemini-2.5-flash` for cost-effective deployments
- Implement caching for repeated queries

## Testing Deployments

```bash
# Local testing
python main.py

# Test deployed endpoint
curl -X POST https://my-agent-url/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Load testing
ab -n 1000 -c 10 -p request.json \
  -T "application/json" \
  https://my-agent-url/chat
```

## Documentation References

- Cloud Run: https://github.com/google/adk-docs/blob/main/docs/deploy/cloud-run.md
- Vertex AI: https://github.com/google/adk-docs/blob/main/docs/deploy/agent-engine.md
- GKE: https://github.com/google/adk-docs/blob/main/docs/deploy/gke.md
- Runtime config: https://github.com/google/adk-docs/blob/main/docs/runtime/runconfig.md
