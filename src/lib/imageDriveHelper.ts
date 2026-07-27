/**
 * Helper utility to convert standard Google Drive sharing links to direct,
 * embeddable image URLs that can be rendered inside <img> tags.
 */
export function getCleanImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  
  const trimmed = url.trim();

  // If already base64 or blob URL, return as is
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  
  // Patterns for matching Google Drive file IDs across various URL structures
  const driveFilePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const driveOpenPattern = /[?&]id=([a-zA-Z0-9_-]+)/i;
  const docsFilePattern = /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const lh3Pattern = /googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i;

  let fileId = "";

  if (trimmed.includes("google.com") || trimmed.includes("googleusercontent.com")) {
    const fileMatch = trimmed.match(driveFilePattern);
    const docsMatch = trimmed.match(docsFilePattern);
    const lh3Match = trimmed.match(lh3Pattern);
    const idMatch = trimmed.match(driveOpenPattern);

    if (fileMatch && fileMatch[1]) {
      fileId = fileMatch[1];
    } else if (docsMatch && docsMatch[1]) {
      fileId = docsMatch[1];
    } else if (lh3Match && lh3Match[1]) {
      fileId = lh3Match[1];
    } else if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    }
  }

  if (fileId) {
    // Return high-capacity CDN direct image hosting link
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

