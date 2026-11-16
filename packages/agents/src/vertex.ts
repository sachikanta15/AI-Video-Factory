import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
let cached: { token: string; expiresAt: number } | undefined;

export async function vertexAccessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const { stdout } = await execFileAsync("gcloud", ["auth", "application-default", "print-access-token"], {
    env: { ...process.env, CLOUDSDK_LOG_DIR: process.env.CLOUDSDK_LOG_DIR ?? "/private/tmp/gcloud-logs" },
    maxBuffer: 16_384,
  });
  const token = stdout.trim();
  if (!token) throw new Error("Vertex ADC returned an empty access token");
  cached = { token, expiresAt: Date.now() + 45 * 60_000 };
  return token;
}

export function vertexUrl(project: string, location: string, model: string): string {
  return `https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
}
