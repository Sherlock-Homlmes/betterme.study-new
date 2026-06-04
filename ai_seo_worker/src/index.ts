import type { Env, WorkflowParams, ArticlePlan } from './types'
export { SEOContentWorkflow } from './workflow'
import { processArticle } from './workflow'
import { deleteArticle, deleteArticleImages, getArticlesIndex, removeArticleFromIndex, getArticleContent } from './services/r2'

export default {
    async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(triggerWorkflow(env))
    },

    async fetch(req: Request, env: Env): Promise<Response> {
        const url = new URL(req.url)

        const secret = req.headers.get('x-internal-secret')
        if (secret !== env.INTERNAL_SECRET) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // POST /trigger — create workflow to generate N new articles
        if (req.method === 'POST' && url.pathname === '/trigger') {
            const body = await req.json<{ targetCount?: number }>().catch(() => ({}))
            const id = await triggerWorkflow(env, body.targetCount)
            return Response.json({ ok: true, workflowId: id })
        }

        // POST /rewrite — rewrite a specific article by slug
        if (req.method === 'POST' && url.pathname === '/rewrite') {
            return handleRewrite(req, env)
        }

        // GET /articles/:slug/content — get article markdown content
        if (req.method === 'GET' && url.pathname.match(/^\/articles\/[^/]+\/content$/)) {
            const slug = url.pathname.split('/articles/')[1]?.replace(/\/content$/, '')
            if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 })
            const content = await getArticleContent(env, slug)
            if (!content) return Response.json({ error: 'Not found' }, { status: 404 })
            return Response.json({ slug, content })
        }

        // DELETE /articles/:slug — delete an article and its images
        if (req.method === 'DELETE' && url.pathname.startsWith('/articles/')) {
            const slug = url.pathname.split('/articles/')[1]?.replace(/\/$/, '')
            if (!slug) return Response.json({ error: 'Missing slug' }, { status: 400 })
            return handleDelete(env, slug)
        }

        // GET /articles — list all articles in the index
        if (req.method === 'GET' && url.pathname === '/articles') {
            const index = await getArticlesIndex(env)
            return Response.json({ articles: index })
        }

        // GET /status/:id — check workflow status
        if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
            const id = url.pathname.split('/status/')[1]
            const instance = await env.SEO_WORKFLOW.get(id)
            const status = await instance.status()
            return Response.json(status)
        }

        return new Response('betterme-seo-worker running', { status: 200 })
    },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function triggerWorkflow(env: Env, targetCount = 10): Promise<string> {
    const params: WorkflowParams = {
        triggeredAt: new Date().toISOString(),
        targetCount,
    }

    const instance = await env.SEO_WORKFLOW.create({
        id: `seo-${new Date().toISOString().split('T')[0]}-${Date.now()}`,
        params,
    })

    console.log(`[SEO] Workflow created: ${instance.id}`)
    return instance.id
}

async function handleRewrite(req: Request, env: Env): Promise<Response> {
    const body = await req.json<{
        slug: string
        title?: string
        primaryKeyword?: string
        secondaryKeywords?: string[]
        outline?: string[]
        angle?: string
        targetWordCount?: number
    }>().catch(() => ({}))

    if (!body.slug) {
        return Response.json({ error: 'Missing slug' }, { status: 400 })
    }

    const existing = await getArticlesIndex(env)
    const found = existing.find((a) => a.slug === body.slug)

    if (!found) {
        return Response.json({ error: `Article "${body.slug}" not found in index` }, { status: 404 })
    }

    const plan: ArticlePlan = {
        title: body.title ?? found.title,
        slug: body.slug,
        primaryKeyword: body.primaryKeyword ?? found.primaryKeyword,
        secondaryKeywords: body.secondaryKeywords ?? [],
        vietnameseKeyword: body.primaryKeyword ?? found.primaryKeyword,
        searchIntent: 'informational',
        difficulty: 'low',
        feasibilityScore: 8,
        competitorGap: 'Rewrite — keeping existing angle',
        outline: body.outline ?? ['Introduction', 'Main Content', 'Practical Tips', 'Conclusion'],
        targetWordCount: body.targetWordCount ?? 1600,
        angle: body.angle ?? `Rewrite of "${found.title}"`,
    }

    console.log(`[SEO] Rewriting article: ${plan.slug}`)
    const result = await processArticle(env, plan, true)

    return Response.json({
        ok: result.success,
        slug: plan.slug,
        images: result.images,
        error: result.error,
    })
}

async function handleDelete(env: Env, slug: string): Promise<Response> {
    console.log(`[SEO] Deleting article: ${slug}`)

    const removed = await removeArticleFromIndex(env, slug)
    if (!removed) {
        return Response.json({ error: `Article "${slug}" not found in index` }, { status: 404 })
    }

    await deleteArticle(env, slug)
    await deleteArticleImages(env, slug)

    try {
        await env.VECTORIZE.deleteByIds([slug])
    } catch {
        console.warn(`[SEO] Vectorize delete failed for ${slug} (may not exist)`)
    }

    console.log(`[SEO] Deleted: ${slug}`)
    return Response.json({ ok: true, slug })
}
