# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into a 'backend' package directory
# This ensures that imports like 'from .database import ...' work correctly
# because 'backend' will be treated as a package.
COPY . backend/

# Set PYTHONPATH to include /app so 'backend' package is found
ENV PYTHONPATH=/app

# Make port 8000 available
EXPOSE 8000

# Run uvicorn pointing to the backend package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
