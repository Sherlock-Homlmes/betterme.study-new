import type { APIRoute } from 'astro'
import { verifyAuth, seoHeaders } from './_lib'

export const POST: APIRoute = async ({ request }) => {
    const auth = await verifyAuth(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const seoUrl = import.meta.env.SEO_WORKER_URL || 'https://ai-seo-worker.betterme.dev'
    const res = await fetch(`${seoUrl}/trigger`, {
        method: 'POST',
        headers: seoHeaders(),
        body: JSON.stringify(body),
    })
    const data = await res.json()
    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
    })
}
