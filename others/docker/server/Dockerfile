FROM ghcr.io/astral-sh/uv:python3.14-bookworm
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Node.js từ official image
COPY --from=node:lts-bookworm /usr/local /usr/local

# Verify installation
RUN node --version && npm --version
