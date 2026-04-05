FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir jaclang==0.13.5 jac-scale==0.2.13 aiohttp && apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY main.jac jac.toml serve.py ./
COPY frontend/dist ./frontend/dist/

EXPOSE 10000

ENV SMTP_EMAIL=""
ENV SMTP_PASSWORD=""
ENV PORT=10000

# Jac runs from /app/data (persistent disk keeps the SQLite DB)
# Always copy fresh code files, but DB stays on disk
RUN printf '#!/bin/bash\nset -e\nmkdir -p /app/data\ncp /app/main.jac /app/data/main.jac\ncp /app/jac.toml /app/data/jac.toml\necho "Starting Jac backend on port 8001..."\ncd /app/data\njac start main.jac --no_client -p 8001 &\necho "Waiting for Jac..."\nfor i in $(seq 1 60); do\n  if curl -sf http://localhost:8001/walker/health -H "Content-Type: application/json" -d "{}" > /dev/null 2>&1; then\n    echo "Jac is ready!"\n    break\n  fi\n  sleep 2\ndone\necho "Starting frontend on port 10000..."\ncd /app\nexec python3 serve.py\n' > /app/start.sh && chmod +x /app/start.sh

CMD ["/bin/bash", "/app/start.sh"]
