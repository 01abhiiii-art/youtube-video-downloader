# ClipFetch YouTube API

Run from the repository root with `pnpm dev:api` (default:
`http://127.0.0.1:8787`) or build with `pnpm build:api` and run
`pnpm start:api`.

Request:

```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

Response:

```json
{
  "title": "file",
  "formats": [
    { "id": "video-mp4", "label": "video (mp4)", "type": "video", "quality": "source", "extension": "mp4" }
  ]
}
```

Only public YouTube watch, Shorts, embed, and youtu.be video URLs are accepted;
other domains and unsupported YouTube URL shapes are rejected. The installed
`yt-dlp` executable analyzes and downloads the selected YouTube format; `ffmpeg` muxes
adaptive video and audio streams into an MKV download. Localhost
and private IP ranges are still rejected before yt-dlp runs. Downloads use
`POST /v1/download` with `{ "url": "...", "formatId": "..." }`; set `YTDLP_PATH`
when `yt-dlp` is not on `PATH`; set `FFMPEG_PATH` to the ffmpeg directory when it is
not on `PATH`. Cookies, credentials, private/authenticated videos,
direct media URLs, and DRM bypass are not supported. Errors consistently use
`{ "error": { "code": "...", "message": "..." } }`.
