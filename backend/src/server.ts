import Fastify from "fastify";
import cors from "@fastify/cors";
import dns from "node:dns/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const REQUEST_TIMEOUT_MS = 8_000;
const YTDLP_PATH = process.env.YTDLP_PATH ?? "yt-dlp";
const FFMPEG_PATH = process.env.FFMPEG_PATH;
const DENO_PATH = process.env.DENO_PATH;
const YTDLP_TIMEOUT_MS = Number(process.env.YTDLP_TIMEOUT_MS ?? 90_000);
const MAX_DOWNLOAD_BYTES = 512 * 1024 * 1024;
const execFileAsync = promisify(execFile);

type ErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_URL"
  | "PRIVATE_URL"
  | "FETCH_FAILED"
  | "TIMEOUT"
  | "RESPONSE_TOO_LARGE"
  | "UNSUPPORTED_MEDIA";

class ApiFailure extends Error {
  constructor(public code: ErrorCode, message: string, public statusCode = 400) {
    super(message);
  }
}

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const DOWNLOADABLE_EXTENSIONS = new Set(["mp4", "webm", "m4a", "mp3", "ogg", "opus", "wav"]);
const YOUTUBE_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "m.youtube.com",
  "youtu.be", "www.youtu.be", "m.youtu.be",
]);

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") ||
      normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }
  return true;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new ApiFailure("UNSUPPORTED_URL", "Only a valid public http(s) URL is supported."); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.hostname === "localhost" || parsed.hostname.endsWith(".localhost") ||
      parsed.hostname.endsWith(".local")) {
    throw new ApiFailure("UNSUPPORTED_URL", "Only a public http(s) URL is supported.");
  }
  let addresses: string[];
  try {
    addresses = net.isIP(parsed.hostname)
      ? [parsed.hostname]
      : (await dns.lookup(parsed.hostname, { all: true })).map((entry) => entry.address);
  } catch {
    throw new ApiFailure("UNSUPPORTED_URL", "The public hostname could not be resolved.");
  }
  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new ApiFailure("PRIVATE_URL", "Private, local, and loopback URLs are not allowed.");
  }
  return parsed;
}

async function assertYouTubeUrl(raw: string): Promise<URL> {
  const parsed = await assertPublicUrl(raw);
  const hostname = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname) || parsed.port) {
    throw new ApiFailure("UNSUPPORTED_URL", "Only public YouTube video URLs are supported.");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;
  if (hostname.endsWith("youtu.be")) {
    if (segments.length === 1) videoId = segments[0];
  } else if (segments.length === 1 && segments[0] === "watch") {
    videoId = parsed.searchParams.get("v");
    if ([...parsed.searchParams.keys()].some((key) => key !== "v" && key !== "t" && key !== "start")) {
      throw new ApiFailure("UNSUPPORTED_URL", "Only standard YouTube watch URLs are supported.");
    }
  } else if (segments.length === 2 && (segments[0] === "shorts" || segments[0] === "embed")) {
    videoId = segments[1];
  }
  if (!videoId || !YOUTUBE_VIDEO_ID.test(videoId)) {
    throw new ApiFailure("UNSUPPORTED_URL", "Use a public YouTube watch, Shorts, embed, or youtu.be URL.");
  }
  return parsed;
}

function formatFromYtdlp(format: Record<string, unknown>) {
  const id = typeof format.format_id === "string" ? format.format_id : "";
  const ext = typeof format.ext === "string" ? format.ext : "";
  const type = typeof format.vcodec === "string" && format.vcodec !== "none" ? "video" : "audio";
  const hasAudio = typeof format.acodec === "string" && format.acodec !== "none";
  const formatNote = typeof format.format_note === "string" ? format.format_note : "";
  if (!id || !DOWNLOADABLE_EXTENSIONS.has(ext) || !["video", "audio"].includes(type) ||
      id.startsWith("sb") || formatNote.toLowerCase().includes("storyboard")) return null;
  return {
    id, label: type === "video" && !hasAudio ? `video + audio (mkv)` : `${type} (${ext})`, type,
    quality: formatNote || undefined,
    extension: type === "video" && !hasAudio ? "mkv" : ext,
  };
}

async function inspectWithYtdlp(url: URL) {
  try {
    const ytdlpArgs = [
      "--dump-single-json", "--no-playlist", "--no-cookies", "--no-cache-dir",
      "--skip-download", "--socket-timeout", String(REQUEST_TIMEOUT_MS / 1000),
    ];
    if (DENO_PATH) ytdlpArgs.push("--js-runtimes", `deno:${DENO_PATH}`);
    ytdlpArgs.push(url.toString());
    const { stdout } = await execFileAsync(YTDLP_PATH, ytdlpArgs, { timeout: YTDLP_TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
    const metadata = JSON.parse(stdout) as Record<string, unknown>;
    const formats = Array.isArray(metadata.formats)
      ? metadata.formats.map((format) => formatFromYtdlp(format as Record<string, unknown>)).filter(
        (format): format is NonNullable<ReturnType<typeof formatFromYtdlp>> => format !== null,
      )
      : [];
    if (!formats.length) throw new ApiFailure("UNSUPPORTED_MEDIA", "No downloadable public formats were found.", 422);
    return {
      title: typeof metadata.title === "string" ? metadata.title : "Media",
      formats,
    };
  } catch (error) {
    if (error instanceof ApiFailure) throw error;
    if (error && typeof error === "object") {
      const details = error as { stderr?: string; stdout?: string; code?: string | number; killed?: boolean };
      app.log.error({
        code: details.code,
        killed: details.killed,
        stderr: details.stderr?.slice(-2000),
        stdout: details.stdout?.slice(-1000),
      }, "yt-dlp analysis failed");
    }
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError" || name === "TimeoutError" ||
        (error && typeof error === "object" && "killed" in error && error.killed)) {
      throw new ApiFailure("TIMEOUT", "YouTube analysis timed out. Please try again.", 504);
    }
    throw new ApiFailure("FETCH_FAILED", "The public media could not be analyzed.", 422);
  }
}

const app = Fastify({ logger: true });
app.register(cors, { origin: true });
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ApiFailure) return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } });
  const statusCode = typeof error === "object" && error !== null && "statusCode" in error &&
    typeof error.statusCode === "number" ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "The request could not be processed.";
  if (statusCode < 500) {
    return reply.code(statusCode).send({ error: { code: "INVALID_REQUEST", message } });
  }
  app.log.error(error);
  return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } });
});
app.get("/health", async () => ({ status: "ok" }));
app.get("/ready", async (_request, reply) => reply.send({ status: "ready" }));
app.post<{ Body: { url?: unknown } }>("/v1/analyze", async (request, reply) => {
  if (!request.body || typeof request.body.url !== "string" || request.body.url.length > 2048) {
    throw new ApiFailure("INVALID_REQUEST", "Request body must contain a URL string.", 400);
  }
  const initial = await assertYouTubeUrl(request.body.url);
  return reply.send(await inspectWithYtdlp(initial));
});

app.post<{ Body: { url?: unknown; formatId?: unknown } }>("/v1/download", async (request, reply) => {
  if (!request.body || typeof request.body.url !== "string" || request.body.url.length > 2048 ||
      typeof request.body.formatId !== "string" || !/^[A-Za-z0-9._+-]+$/.test(request.body.formatId)) {
    throw new ApiFailure("INVALID_REQUEST", "Request body must contain a URL and format id.", 400);
  }
  const url = await assertYouTubeUrl(request.body.url);
  const analysis = await inspectWithYtdlp(url);
  if (!analysis.formats.some((format) => format.id === request.body.formatId)) {
    throw new ApiFailure("INVALID_REQUEST", "That format is not available for this YouTube video.", 400);
  }
  const selected = analysis.formats.find((format) => format.id === request.body.formatId);
  if (!selected) throw new ApiFailure("INVALID_REQUEST", "That format is not available for this YouTube video.", 400);
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "clipfetch-"));
  try {
    const formatSelector = selected.type === "video"
      ? `${selected.id}+bestaudio/${selected.id}`
      : selected.id;
    const ytdlpArgs = [
      "--no-playlist", "--no-cookies", "--no-cache-dir", "--no-part",
      "--socket-timeout", String(REQUEST_TIMEOUT_MS / 1000), "--format", formatSelector,
      "--merge-output-format", "mkv", "--output", path.join(tempDir, "download.%(ext)s"), url.toString(),
    ];
    if (FFMPEG_PATH) ytdlpArgs.unshift("--ffmpeg-location", FFMPEG_PATH);
    if (DENO_PATH) ytdlpArgs.splice(6, 0, "--js-runtimes", `deno:${DENO_PATH}`);
    const result = await execFileAsync(YTDLP_PATH, ytdlpArgs, { timeout: YTDLP_TIMEOUT_MS, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
    const files = (await readdir(tempDir)).filter((file) => file.startsWith("download."));
    if (files.length !== 1) {
      app.log.error({ tempDir, files, stdout: result.stdout, stderr: result.stderr }, "yt-dlp did not create one output file");
      throw new ApiFailure("FETCH_FAILED", "The downloaded media file was not created.", 422);
    }
    const filePath = path.join(tempDir, files[0]);
    const fileInfo = await stat(filePath);
    if (fileInfo.size > MAX_DOWNLOAD_BYTES) throw new ApiFailure("RESPONSE_TOO_LARGE", "The download is too large.", 413);
    const extension = path.extname(filePath).slice(1) || selected.extension;
    reply.header("content-type", "application/octet-stream");
    reply.header("content-disposition", `attachment; filename="youtube-download.${extension}"`);
    return reply.send(createReadStream(filePath).on("close", () => { void rm(tempDir, { recursive: true, force: true }); }));
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    if (error instanceof ApiFailure) throw error;
    app.log.error(error);
    const name = error instanceof Error ? error.name : "";
    if (name === "AbortError" || name === "TimeoutError") throw new ApiFailure("TIMEOUT", "The media server timed out.", 504);
    throw new ApiFailure("FETCH_FAILED", "The public media could not be downloaded.", 422);
  }
});

app.listen({ port: PORT, host: HOST }).catch((error) => { app.log.error(error); process.exit(1); });
