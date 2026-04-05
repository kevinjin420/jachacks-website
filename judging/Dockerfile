FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir jaclang==0.13.5 jac-scale==0.2.13 aiohttp

COPY main.jac jac.toml serve.py ./
COPY frontend/dist ./frontend/dist/

EXPOSE 10000

ENV SMTP_EMAIL=""
ENV SMTP_PASSWORD=""
ENV PORT=10000

# Write a startup script that waits for Jac to be ready
RUN echo '#!/bin/bash\nset -e\necho "Starting frontend proxy..."\npython3 serve.py &\nFRONT_PID=$!\necho "Starting Jac backend..."\njac start main.jac --no_client -p 8001 &\nJAC_PID=$!\necho "Waiting for Jac backend to start..."\nfor i in $(seq 1 30); do\n  if curl -s http://localhost:8001/walker/health -H "Content-Type: application/json" -d "{}" > /dev/null 2>&1; then\n    echo "Jac backend is ready!"\n    break\n  fi\n  echo "Waiting... ($i/30)"\n  sleep 2\ndone\necho "All services running!"\nwait $FRONT_PID' > /app/start.sh && chmod +x /app/start.sh

CMD ["/bin/bash", "/app/start.sh"]
