import { createClient } from "@/lib/supabase/client"

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
