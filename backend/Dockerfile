# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies for OpenCV and MySQL
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    python3-dev \
    default-jre \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Verify critical dependencies are installed (AI deps commented out for faster startup)
# RUN python -c "import numpy; import cv2; import sentence_transformers; print('✓ AI Dependencies Verified')"

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Command will be overridden by docker-compose for server vs worker
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
