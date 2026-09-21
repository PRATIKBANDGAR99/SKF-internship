# SKF QA Portal - Python FastAPI Backend Dockerfile
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001

WORKDIR /app

# Install basic system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Ensure uploads folder exists
RUN mkdir -p /app/uploads

# Expose FastAPI backend port
EXPOSE 8001

# Healthcheck to verify FastAPI & PostgreSQL connection
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Run Uvicorn server on port 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
