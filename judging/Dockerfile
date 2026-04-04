FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir jaclang==0.13.5 jac-scale==0.2.13 aiohttp

COPY main.jac jac.toml serve.py ./
COPY frontend/dist ./frontend/dist/

EXPOSE 3000

ENV SMTP_EMAIL=""
ENV SMTP_PASSWORD=""
ENV PORT=3000

CMD bash -c "jac start main.jac --no_client -p 8001 & sleep 8 && python3 serve.py"
