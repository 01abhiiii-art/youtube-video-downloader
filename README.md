# ClipFetch.in — YouTube-only

Production-quality Next.js + TypeScript + Tailwind frontend and Fastify API for analyzing and downloading public YouTube videos.

## Run locally

```bash
pnpm install
pnpm dev
```

Run the API in a second terminal:

```bash
pnpm dev:api
```

The API listens on `http://127.0.0.1:8787` by default. To connect the frontend, set
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8787` in `.env.local`, then restart Next.js.
`NEXT_PUBLIC_API_URL` is optional; without it, the UI intentionally shows a configuration
state and never fakes a successful download.
Downloads require external `yt-dlp` and `ffmpeg` executables on the API host (or set
`YTDLP_PATH` and `FFMPEG_PATH`).
Both API endpoints accept only public YouTube watch, Shorts, embed, and youtu.be video
URLs. Other domains, direct media URLs, playlists, channels, and unsupported YouTube
URL shapes are rejected. `POST /v1/download` accepts
`{"url":"https://www.youtube.com/watch?v=...","formatId":"..."}` and streams a format
reported for that video. Use only content you are authorized to save; cookies, credentials,
private URLs, and DRM bypass are not supported. Existing public-host and private-IP
protections remain in place before yt-dlp is invoked.

Production-style commands:

```bash
pnpm build:api
pnpm start:api
```

Health checks are `GET /health` and `GET /ready`; analysis is `POST /v1/analyze` with
`{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}`. Errors use the shape
`{"error":{"code":"...","message":"..."}}`.

## Validation

Run `pnpm typecheck`, `pnpm typecheck:api`, `pnpm lint`, `pnpm build`, and `pnpm build:api`.

## Deployment

Deploy the frontend to Vercel from the repository root with the framework set to
Next.js. Set `NEXT_PUBLIC_API_URL` to the public Render URL for the API, for example
`https://clipfetch-api.onrender.com`.

The backend includes a `Dockerfile` and `render.yaml` for Render. Create a Render
Web Service from the repository using the Docker runtime; the image installs both
`yt-dlp` and `ffmpeg`, binds to Render's `PORT`, and exposes `GET /health`. The
frontend must not use the local `.env.local` value in production.
