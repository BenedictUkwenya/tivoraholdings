import { createClient } from "@/lib/supabase/client"

/**
 * Public URL for an object in a public bucket. Returns empty string when no path.
 */
export function getPublicFileUrl(bucket: string, urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return ""
  const path = extractStoragePath(bucket, urlOrPath)
  if (!path) return ""
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? ""
}

/**
 * Extract the storage object path from either a path or a legacy public URL.
 * Older rows stored full `getPublicUrl` strings; new rows store just the path.
 */
export function extractStoragePath(bucket: string, urlOrPath: string): string {
  if (!urlOrPath) return ""
  const marker = `/${bucket}/`
  const idx = urlOrPath.indexOf(marker)
  if (idx === -1) return urlOrPath
  return urlOrPath.slice(idx + marker.length).split("?")[0]
}

/**
 * Generate a short-lived signed URL for a private storage object.
 * Returns null if the path can't be resolved.
 */
export async function getSignedFileUrl(
  bucket: string,
  urlOrPath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const path = extractStoragePath(bucket, urlOrPath)
  if (!path) return null

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
