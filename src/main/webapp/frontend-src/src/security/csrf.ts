let csrfToken: string | null = null;

const TOKEN_ENDPOINT = '/bookstore/auth?action=csrfToken';
const HEADER_NAME = 'X-CSRF-Token';

async function loadCsrfToken(): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok || !data.success || typeof data.csrfToken !== 'string') {
    throw new Error('Unable to initialize CSRF protection');
  }
  csrfToken = data.csrfToken;
  return csrfToken;
}

function isStateChanging(method?: string): boolean {
  const normalized = (method || 'GET').toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(normalized);
}

export function resetCsrfToken(): void {
  csrfToken = null;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const stateChanging = isStateChanging(init.method);
  const requestInit: RequestInit = { ...init, credentials: init.credentials || 'include' };

  if (stateChanging) {
    const headers = new Headers(init.headers);
    headers.set(HEADER_NAME, csrfToken || await loadCsrfToken());
    requestInit.headers = headers;
  }

  let response = await fetch(input, requestInit);
  const responseToken = response.headers.get(HEADER_NAME);
  if (responseToken) csrfToken = responseToken;

  if (stateChanging && response.status === 403 && !responseToken) {
    csrfToken = null;
    const headers = new Headers(init.headers);
    headers.set(HEADER_NAME, await loadCsrfToken());
    response = await fetch(input, { ...requestInit, headers });
    const retryToken = response.headers.get(HEADER_NAME);
    if (retryToken) csrfToken = retryToken;
  }

  return response;
}
