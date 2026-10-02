export type ApiRequest = {
  <T = Record<string, unknown>>(path: string, options?: RequestInit): Promise<T>;
  stream<T = Record<string, unknown>>(path: string, options: RequestInit, onEvent: (event: T) => void): Promise<void>;
};

type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;

async function readError(response: Response) {
  try {
    const body = await response.json();
    const detail = [body.authReason, body.authMessage].filter((value): value is string => typeof value === 'string' && value.length > 0).join(': ');
    return typeof body.error === 'string' ? detail ? `${body.error} (${detail})` : body.error : 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export function createApi(getToken: TokenGetter, workspaceId?: string): ApiRequest {
  const send = async (path: string, options: RequestInit = {}, skipCache = false) => {
    const token = await getToken({ skipCache });
    if (!token) throw new Error('Please sign in again.');
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/api${path}`, {
      ...options,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
        ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  };

  const authenticated = async (path: string, options: RequestInit = {}) => {
    let response = await send(path, options);
    if (response.status === 401) response = await send(path, options, true);
    return response;
  };

  const requestJson = async <T>(path: string, options: RequestInit = {}) => {
    const response = await authenticated(path, options);
    if (!response.ok) throw new Error(await readError(response));
    return response.json() as Promise<T>;
  };

  const stream = async <T>(path: string, options: RequestInit, onEvent: (event: T) => void) => {
    const response = await authenticated(path, options);
    if (!response.ok) throw new Error(await readError(response));
    if (!response.body) throw new Error('The response stream was unavailable.');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    while (true) {
      const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as T);
      if (done) break;
    }
    if (buffer.trim()) onEvent(JSON.parse(buffer) as T);
  };

  return Object.assign(requestJson, { stream }) as ApiRequest;
}
