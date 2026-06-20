export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type RefreshResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type AuthResult =
  | {
      type: "login";
      response: LoginResponse;
      decoded: DecodedTokens;
    }
  | {
      type: "refresh";
      response: RefreshResponse;
      decoded: DecodedTokens;
    };

export type DecodedJwt = {
  header: unknown;
  payload: unknown;
};

export type DecodedTokens = {
  accessToken?: DecodedJwt;
  refreshToken?: DecodedJwt;
};

const DEMO_CREDENTIALS = {
  username: "demo",
  password: "demo"
};

export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  return apiBaseUrl.replace(/\/+$/, "");
}

export async function login(): Promise<AuthResult> {
  const response = await postJson<LoginResponse>("/api/v1/auth/login", DEMO_CREDENTIALS);

  return {
    type: "login",
    response,
    decoded: decodeTokens(response)
  };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const response = await postJson<RefreshResponse>("/api/v1/auth/refresh", { refreshToken });

  return {
    type: "refresh",
    response,
    decoded: decodeTokens(response)
  };
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(JSON.stringify(payload, null, 2));
  }

  return payload as TResponse;
}

function decodeTokens(response: LoginResponse | RefreshResponse): DecodedTokens {
  const decoded: DecodedTokens = {
    accessToken: decodeJwt(response.accessToken)
  };

  if ("refreshToken" in response) {
    decoded.refreshToken = decodeJwt(response.refreshToken);
  }

  return decoded;
}

function decodeJwt(token: string): DecodedJwt {
  const [encodedHeader, encodedPayload] = token.split(".");

  return {
    header: parseBase64UrlJson(encodedHeader),
    payload: parseBase64UrlJson(encodedPayload)
  };
}

function parseBase64UrlJson(value: string): unknown {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  if (typeof atob !== "function") {
    throw new Error("JWT decoding requires atob support.");
  }

  return JSON.parse(atob(padded));
}
