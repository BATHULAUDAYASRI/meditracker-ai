FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /app/data

EXPOSE 8080

# SQLite DB file path; mount a volume in production or switch DATABASE_URL to PostgreSQL
ENV DATABASE_URL=sqlite:///./data/meditracker.db

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
