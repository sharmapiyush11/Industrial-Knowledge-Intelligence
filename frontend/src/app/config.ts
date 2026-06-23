export const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (url) {
    return url.replace(/\/$/, "");
  }
  return "";
};

export const getWsBaseUrl = (): string => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrl) return wsUrl;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    const base = backendUrl.replace(/\/$/, "");
    return base.replace(/^http/, "ws") + "/ws/alerts";
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//127.0.0.1:8000/ws/alerts`;
  }
  return "";
};

export const API_BASE = getApiBaseUrl();
export const WS_BASE = getWsBaseUrl();
