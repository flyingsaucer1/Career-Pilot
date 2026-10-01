export interface ProviderStatus {
  provider: string;
  model: string | null;
  ready: boolean;
  message: string;
}

export async function checkOllamaStatus(
  baseUrl: string,
  model: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<ProviderStatus> {
  const status = { provider: 'Ollama', model: model || null, ready: false };
  if (!model) return { ...status, message: 'Choose an installed model in OLLAMA_MODEL.' };
  try {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return { ...status, message: 'Ollama is not responding normally.' };
    const payload = await response.json() as { models?: Array<{ name?: string; model?: string }> };
    const normalize = (name: string) => name.includes(':') ? name : `${name}:latest`;
    const installed = Array.isArray(payload.models) && payload.models.some(
      (item) => normalize(item.name || item.model || '') === normalize(model)
    );
    return {
      ...status, ready: installed,
      message: installed ? 'Local model is available.' : `Download ${model} in Ollama to enable AI features.`,
    };
  } catch {
    return { ...status, message: 'Start Ollama to enable AI features.' };
  }
}
