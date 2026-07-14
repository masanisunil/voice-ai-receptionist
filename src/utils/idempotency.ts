import crypto from "node:crypto";

export function hashRequest(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function scopedIdempotencyKey(scope: string, rawKey: string): string {
  return `${scope}:${rawKey}`;
}
