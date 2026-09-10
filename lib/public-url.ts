/** Returns the public origin that Agora-managed workers can reach. */
export function resolvePublicBaseUrl(): string {
  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    const clean = vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${clean}`;
  }

  const envUrl = process.env.APP_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.startsWith('http') ? envUrl.replace(/\/$/, '') : `https://${envUrl.replace(/\/$/, '')}`;
  }

  return process.env.NODE_ENV === 'production' ? 'https://roundtable-ai-v1.vercel.app' : 'http://localhost:3000';
}
