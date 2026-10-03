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
The default yt-dlp operation timeout is 90 seconds and can be changed with
`YTDLP_TIMEOUT_MS`.
Both API endpoints accept only public YouTube watch, Shorts, embed, and youtu.be video
URLs. Other domains, direct media URLs, playlists, channels, and unsupported YouTube
URL shapes are rejected. `POST /v1/download` accepts
`{"url":"https://www.youtube.com/watch?v=...","formatId":"..."}` and streams a format
reported for that video. Use only content you are authorized to save; cookies, credentials,
private URLs, and DRM bypass are not supported. Existing public-host and private-IP
protections remain in place before yt-dlp is invoked.
Some hosting providers may be blocked by YouTube's automated traffic checks. In that
case the API returns `YOUTUBE_BLOCKED`; ClipFetch does not accept cookies or account
credentials as a workaround.

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

Deploy both services to Render with the root `render.yaml` Blueprint. Connect the
GitHub repository in Render and create a new Blueprint instance; Render builds the
API with the Dockerfile and deploys the Next.js frontend as a Node web service. The
Blueprint wires `NEXT_PUBLIC_API_URL` to the API service URL automatically. The API
image installs `yt-dlp` and `ffmpeg`, binds to Render's `PORT`, and exposes
`GET /health`. Do not use the local `.env.local` value in production.
