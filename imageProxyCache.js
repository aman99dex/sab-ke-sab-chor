import net from "node:net";

const IMAGE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 180;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const imageCache = new Map();

function isPrivateIpv4(host) {
  const parts = host.split(".").map((value) => Number(value));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(host) {
  const normalized = host.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  return false;
}

function isBlockedHost(hostname) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return true;

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }

  if (net.isIP(host) === 4) return isPrivateIpv4(host);
  if (net.isIP(host) === 6) return isPrivateIpv6(host);
  return false;
}

function normalizeImageUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    if (isBlockedHost(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function pruneCache() {
  const now = Date.now();

  for (const [url, entry] of imageCache.entries()) {
    if (now - entry.timestamp > IMAGE_TTL_MS) {
      imageCache.delete(url);
    }
  }

  while (imageCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = imageCache.keys().next().value;
    if (!oldestKey) break;
    imageCache.delete(oldestKey);
  }
}

function getCachedImage(url) {
  pruneCache();
  const hit = imageCache.get(url);
  if (!hit) return null;

  // Reinsert for LRU-ish behavior.
  imageCache.delete(url);
  imageCache.set(url, hit);

  return hit;
}

function setCachedImage(url, payload) {
  imageCache.set(url, {
    ...payload,
    timestamp: Date.now(),
  });
  pruneCache();
}

async function fetchImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "NetaWatch/3.0 image-proxy",
        "Accept": "image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        error: `Image fetch failed with HTTP ${response.status}`,
      };
    }

    const contentType = (response.headers.get("content-type") || "application/octet-stream").toLowerCase();
    if (!contentType.startsWith("image/")) {
      return {
        ok: false,
        statusCode: 415,
        error: `Unsupported content-type: ${contentType}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        statusCode: 413,
        error: `Image too large (${buffer.byteLength} bytes)`,
      };
    }

    return {
      ok: true,
      buffer,
      contentType,
      contentLength: buffer.byteLength,
    };
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return {
      ok: false,
      statusCode: 504,
      error: timedOut ? "Image fetch timed out" : "Image fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function getProxyImage(rawUrl, { refresh = false } = {}) {
  const url = normalizeImageUrl(rawUrl);
  if (!url) {
    return {
      ok: false,
      statusCode: 400,
      error: "Invalid image URL",
    };
  }

  if (!refresh) {
    const cached = getCachedImage(url);
    if (cached) {
      return {
        ok: true,
        fromCache: true,
        url,
        contentType: cached.contentType,
        contentLength: cached.contentLength,
        buffer: cached.buffer,
      };
    }
  }

  const fetched = await fetchImage(url);
  if (!fetched.ok) {
    return fetched;
  }

  setCachedImage(url, {
    buffer: fetched.buffer,
    contentType: fetched.contentType,
    contentLength: fetched.contentLength,
  });

  return {
    ok: true,
    fromCache: false,
    url,
    contentType: fetched.contentType,
    contentLength: fetched.contentLength,
    buffer: fetched.buffer,
  };
}

export function getImageProxyCacheStats() {
  pruneCache();

  let totalBytes = 0;
  for (const entry of imageCache.values()) {
    totalBytes += entry.contentLength || 0;
  }

  return {
    entries: imageCache.size,
    totalBytes,
    ttlMs: IMAGE_TTL_MS,
    maxEntries: MAX_CACHE_ENTRIES,
    maxImageBytes: MAX_IMAGE_BYTES,
  };
}
