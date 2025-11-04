FROM python:3.9-slim

WORKDIR /app


RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY . .


RUN mkdir -p /app/out /app/identities


EXPOSE 5001


HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:5001/healthz || exit 1

CMD ["python", "app_ziti.py"]
