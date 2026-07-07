# Roadmap admin API + UI (ECS-ready). Build from project root:
#   docker build -t roadmap-admin .
#   docker run -p 8080:8080 -e ROADMAP_ADMIN_TOKEN=secret -v $(pwd)/data:/data roadmap-admin
#
# For ECS: mount EFS at /data (ROADMAP_DATA_DIR). Without persistent storage,
# edits are lost when the task is replaced.

# --- Stage 1: build React UI (not needed at runtime) ---
FROM node:20-slim AS frontend
WORKDIR /build/web/frontend
COPY web/frontend/package.json web/frontend/package-lock.json ./
RUN npm ci
COPY web/frontend/ ./
RUN npm run build

# --- Stage 2: Python API + baked static assets ---
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY render.py releases.csv roadmap.csv lifecycle.json ./
COPY web/ ./web/
COPY --from=frontend /build/web/static/dist ./web/static/dist

ENV ROADMAP_DATA_DIR=/data
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')"

CMD ["uvicorn", "web.app:app", "--host", "0.0.0.0", "--port", "8080"]
