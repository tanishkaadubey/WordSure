# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables to optimize Python runtime and cache directory
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HOME=/tmp

# Set working directory inside the container
WORKDIR /code

# Copy requirements file
COPY ./requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy all project files into the container
COPY . .

# Hugging Face Spaces expects the container to run on port 7860
EXPOSE 7860

# Run Uvicorn backend listening on host 0.0.0.0 and port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
