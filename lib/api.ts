export type MediaFormat = {
  id: string;
  label: string;
  type: "video" | "audio";
  quality?: string;
  size?: string;
  extension: string;
};

export type MediaAnalysis = {
  title: string;
  thumbnail?: string;
  duration?: string;
  formats: MediaFormat[];
};

export class ApiError extends Error {
  constructor(message: string, public code = "UNKNOWN") {
    super(message);
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { error?: { code?: string; message?: string } };
    return {
      message: payload.error?.message ?? fallback,
      code: payload.error?.code ?? "REQUEST_FAILED",
    };
  } catch {
    return { message: fallback, code: "REQUEST_FAILED" };
  }
}

export async function analyzeMedia(url: string): Promise<MediaAnalysis> {
  if (!API_URL) {
    throw new ApiError("YouTube analysis is not connected yet. Your link was not sent anywhere.", "NOT_CONFIGURED");
  }

  const response = await fetch(`${API_URL}/v1/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await readApiError(response, "We could not analyze that link. Check it and try again.");
    throw new ApiError(error.message, error.code);
  }

  return response.json() as Promise<MediaAnalysis>;
}

export async function downloadMedia(url: string, formatId: string): Promise<Blob> {
  if (!API_URL) {
    throw new ApiError("YouTube download service is not connected yet.", "NOT_CONFIGURED");
  }

  const response = await fetch(`${API_URL}/v1/download`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, formatId }),
  });

  if (!response.ok) {
    const error = await readApiError(
      response,
      "We could not download that YouTube format. Check that the video is public and that you have permission to save it.",
    );
    throw new ApiError(error.message, error.code);
  }

  return response.blob();
}
