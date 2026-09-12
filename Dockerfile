FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp \
  && corepack enable \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build:api

ENV HOST=0.0.0.0
ENV YTDLP_PATH=yt-dlp
ENV FFMPEG_PATH=/usr/bin

EXPOSE 8787
CMD ["node", "backend/dist/server.js"]
