export function getApiBase(): string {
  const fromEnv = import.meta.env?.VITE_API_URL as string | undefined;
  return fromEnv?.replace(/\/+$/, '') || 'http://localhost:3001';
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}


