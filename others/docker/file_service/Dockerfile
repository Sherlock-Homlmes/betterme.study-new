FROM python:3.13

RUN apt-get update && apt-get install -y ffmpeg

RUN pip install --upgrade pip
RUN pip install poetry

ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
