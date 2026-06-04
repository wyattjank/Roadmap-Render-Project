# Roadmap admin API + UI (ECS-ready). Build from project root:
#   docker build -t roadmap-admin .
#   docker run -p 8080:8080 -e ROADMAP_ADMIN_TOKEN=secret -v $(pwd)/data:/data roadmap-admin

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY render.py releases.csv roadmap.csv ./
COPY web/ ./web/

ENV ROADMAP_DATA_DIR=/data
ENV PORT=8080

EXPOSE 8080

CMD ["uvicorn", "web.app:app", "--host", "0.0.0.0", "--port", "8080"]
