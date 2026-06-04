export const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.betterme.dev'
export const SEO_WORKER_URL = import.meta.env.SEO_WORKER_URL || 'https://ai-seo-worker.betterme.dev'
export const SEO_WORKER_SECRET = import.meta.env.SEO_WORKER_SECRET || ''

export async function verifyAuth(request: Request): Promise<{ ok: true; user: string } | { ok: false; response: Response }> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
        return { ok: false, response: new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 }) }
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: authHeader },
        })
        if (!res.ok) {
            return { ok: false, response: new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 }) }
        }
        const data = await res.json()
        return { ok: true, user: data.username || data.discord_id || data.id || 'unknown' }
    } catch {
        return { ok: false, response: new Response(JSON.stringify({ error: 'Auth service unavailable' }), { status: 502 }) }
    }
}

export function seoHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        'x-internal-secret': SEO_WORKER_SECRET,
    }
}
