import type { APIRoute } from 'astro'
import { verifyAuth, seoHeaders } from '../_lib'

export const GET: APIRoute = async ({ request, params }) => {
    const auth = await verifyAuth(request)
    if (!auth.ok) return auth.response

    const slug = params.slug
    const seoUrl = import.meta.env.SEO_WORKER_URL || 'https://ai-seo-worker.betterme.dev'

    const res = await fetch(`${seoUrl}/articles/${slug}/content`, {
        headers: seoHeaders(),
    })
    const data = await res.json()

    // Extract title from frontmatter
    const content = data.content || ''
    const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)
    const title = titleMatch ? titleMatch[1] : slug

    return new Response(JSON.stringify({ slug, title, content: data.content }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
    })
}

export function getStaticPaths() {
    return []
}
