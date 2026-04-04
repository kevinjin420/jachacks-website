FROM python:3.13-slim

WORKDIR /app

# Install Jac and dependencies
RUN pip install --no-cache-dir jaclang jac-scale aiohttp

# Copy backend
COPY main.jac ./
COPY jac.toml ./
COPY serve.py ./

# Copy pre-built frontend
COPY frontend/dist ./frontend/dist/

# Expose port
EXPOSE 3000

# Set SMTP env vars (override at deploy time)
ENV SMTP_EMAIL=""
ENV SMTP_PASSWORD=""
ENV PORT=3000

# Start both: Jac backend on 8001, Python proxy on 3000
CMD bash -c "jac start main.jac --no_client -p 8001 & sleep 5 && python3 serve.py"
