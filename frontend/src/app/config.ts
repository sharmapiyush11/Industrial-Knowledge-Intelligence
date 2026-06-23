const isLocalhost = (hostname: string): boolean => {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  );
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && isLocalhost(window.location.hostname)) {
    return `http://${window.location.hostname}:8000`;
  }
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (url) {
    return url.replace(/\/$/, "");
  }
  return "";
};

export const getWsBaseUrl = (): string => {
  if (typeof window !== "undefined" && isLocalhost(window.location.hostname)) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:8000/ws/alerts`;
  }

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
