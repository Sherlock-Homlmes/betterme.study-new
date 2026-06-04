import type { APIRoute } from 'astro'
import { verifyAuth } from './_lib'

export const POST: APIRoute = async ({ request }) => {
    const auth = await verifyAuth(request)
    if (!auth.ok) return auth.response

    const { token } = await request.json<{ token?: string }>()
    if (!token) {
        return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
    }

    const apiUrl = import.meta.env.PUBLIC_API_URL || 'https://api.betterme.dev'
    try {
        const res = await fetch(`${apiUrl}/api/auth/self`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch {
        return new Response(JSON.stringify({ error: 'Auth service unavailable' }), { status: 502 })
    }
}
