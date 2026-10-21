// The deadline includes downloading and decoding the body, not just the headers.
export async function fetchJson(url, { signal, timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const cancel = () => controller.abort(signal.reason)
  if (signal?.aborted) cancel()
  else signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('加载超时，请重试。', 'TimeoutError')), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`加载失败（${response.status}），请重试。`)
    return await response.json()
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
