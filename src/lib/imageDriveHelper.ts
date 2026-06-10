/**
 * Helper utility to convert standard Google Drive sharing links to direct,
 * embeddable image URLs that can be rendered inside <img> tags.
 */
export function getCleanImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  
  const trimmed = url.trim();
  
  // Patterns for match Google Drive file IDs
  // 1. https://drive.google.com/file/d/FILE_ID/view...
  const driveFilePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  // 2. https://drive.google.com/open?id=FILE_ID
  const driveOpenPattern = /drive\.google\.com\/open\?.*?id=([a-zA-Z0-9_-]+)/i;
  // 3. https://docs.google.com/file/d/FILE_ID/...
  const docsFilePattern = /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  // 4. https://drive.google.com/uc?id=FILE_ID...
  const driveUcPattern = /drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/i;

  let fileId = "";

  const ucMatch = trimmed.match(driveUcPattern);
  const fileMatch = trimmed.match(driveFilePattern);
  const openMatch = trimmed.match(driveOpenPattern);
  const docsMatch = trimmed.match(docsFilePattern);

  if (fileMatch && fileMatch[1]) {
    fileId = fileMatch[1];
  } else if (openMatch && openMatch[1]) {
    fileId = openMatch[1];
  } else if (docsMatch && docsMatch[1]) {
    fileId = docsMatch[1];
  } else if (ucMatch && ucMatch[1]) {
    fileId = ucMatch[1];
  }

  if (fileId) {
    // Returning the most reliable Google Drive direct image hosting link
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}
