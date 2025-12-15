export function getBaseUrl(): string {
  // Check for explicit env vars first
  const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) {
    return baseUrl.replace(/\/$/, "");
  }
  
  // Use Vercel's auto-generated URL
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  
  return "";
}

export function withIframeUrl(tool: any) {
  if (!tool) {
    return tool;
  }

  const plain =
    typeof tool.toObject === "function" ? tool.toObject({ virtuals: true }) : { ...tool };

  // Remove internal blob URL from response
  if (plain.reactAppBlobUrl) {
    delete plain.reactAppBlobUrl;
  }

  const iframeUrl = plain.appType === 'react'
    ? (plain.reactAppUrl || `/mini-tools-react/${plain.iframeSlug}/`)
    : `/mini-tools/${plain.iframeSlug}`;

  return {
    ...plain,
    iframeUrl,
  };
}

