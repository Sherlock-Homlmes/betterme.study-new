import type { APIRoute } from 'astro'
import { verifyAuth, seoHeaders } from './_lib'

export const GET: APIRoute = async ({ request }) => {
    const auth = await verifyAuth(request)
    if (!auth.ok) return auth.response

    const seoUrl = import.meta.env.SEO_WORKER_URL || 'https://ai-seo-worker.betterme.dev'
    const res = await fetch(`${seoUrl}/articles`, { headers: seoHeaders() })
    const data = await res.json()
    return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
    })
}
