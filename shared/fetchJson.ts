export async function fetchJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const text = await res.text()
  if (!res.ok) {
    console.error(`Fetch error ${res.status} ${url}:`, text)
    throw new Error(`API error ${res.status} (see console)`)
  }
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('Invalid JSON response from', url, 'response body:', text)
    throw new Error('Invalid JSON response from server')
  }
}