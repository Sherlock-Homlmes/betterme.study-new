import type { APIRoute } from 'astro'
import { verifyAuth, seoHeaders } from './_lib'

export const ALL: APIRoute = async ({ request, params }) => {
    const auth = await verifyAuth(request)
    if (!auth.ok) return auth.response

    const slug = params.slug
    const seoUrl = import.meta.env.SEO_WORKER_URL || 'https://ai-seo-worker.betterme.dev'

    if (request.method === 'DELETE') {
        const res = await fetch(`${seoUrl}/articles/${slug}`, {
            method: 'DELETE',
            headers: seoHeaders(),
        })
        const data = await res.json()
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export function getStaticPaths() {
    return []
}
