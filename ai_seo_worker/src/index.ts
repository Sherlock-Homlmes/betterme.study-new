import type { Env, WorkflowParams, ArticlePlan } from './types'
export { SEOContentWorkflow } from './workflow'
import { processArticle } from './workflow'
import {
    saveArticle, deleteArticle, deleteArticleImages,
    getArticlesIndex, updateArticlesIndex, removeArticleFromIndex,
    getArticleContent,
} from './services/r2'
import { publishArticle } from './services/publish'

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-internal-secret',
    'Access-Control-Max-Age': '86400',
    'Referrer-Policy': 'no-referrer-when-cross-origin',
}

function corsResponse(body: unknown, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers)
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
        headers.set(k, v)
    }
    return Response.json(body, { ...init, headers })
}

export default {
    async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(triggerWorkflow(env))
    },

    async fetch(req: Request, env: Env): Promise<Response> {
        const url = new URL(req.url)
        const path = url.pathname

        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS })
        }

        if (req.method === 'GET' && path === '/ping') {
            return corsResponse({ ok: true, service: 'ai-seo-worker', time: new Date().toISOString() })
        }

        const secret = req.headers.get('x-internal-secret')
        if (secret !== env.INTERNAL_SECRET) {
            return corsResponse({ error: 'Unauthorized' }, { status: 401 })
        }

        // ── POST /articles — generate new articles (workflow) ───────────────────
        if (req.method === 'POST' && path === '/articles') {
            const body = await req.json<{ targetCount?: number }>().catch(() => ({}))
            const id = await triggerWorkflow(env, body.targetCount)
            return corsResponse({ ok: true, workflowId: id, targetCount: body.targetCount || 5 })
        }

        // ── GET /articles — list all articles ───────────────────────────────────
        if (req.method === 'GET' && path === '/articles') {
            const index = await getArticlesIndex(env)
            return corsResponse({ articles: index })
        }

        // ── /articles/:slug routes ──────────────────────────────────────────────
        const articleMatch = path.match(/^\/articles\/([^/]+)(?:\/(.+))?$/)
        if (articleMatch) {
            const slug = articleMatch[1]
            const sub = articleMatch[2] || ''

            // POST /articles/:slug/_regenerate
            if (req.method === 'POST' && sub === '_regenerate') {
                return handleRegenerate(req, env, slug)
            }

            // GET /articles/:slug — get article content
            if (req.method === 'GET' && !sub) {
                return handleGetArticle(env, slug)
            }

            // PATCH /articles/:slug — update article content
            if (req.method === 'PATCH' && !sub) {
                return handleUpdateArticle(req, env, slug)
            }

            // DELETE /articles/:slug
            if (req.method === 'DELETE' && !sub) {
                return handleDelete(env, slug)
            }
        }

        // ── GET /article-workflows — list running workflows ─────────────────────
        if (req.method === 'GET' && path === '/article-workflows') {
            return handleListWorkflows(env)
        }

        // ── GET /status/:id ─────────────────────────────────────────────────────
        if (req.method === 'GET' && path.startsWith('/status/')) {
            const id = path.split('/status/')[1]
            const instance = await env.SEO_WORKFLOW.get(id)
            const status = await instance.status()
            return corsResponse(status)
        }

        // ── POST /publish — publish article to landing ────────────────────────
        if (req.method === 'POST' && path === '/publish') {
            return handlePublish(req, env)
        }

            return corsResponse({ error: 'Not found' }, { status: 404 })
    },
}

// ─── Workflow ──────────────────────────────────────────────────────────────────

async function triggerWorkflow(env: Env, targetCount = 5): Promise<string> {
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

// ─── Get article ───────────────────────────────────────────────────────────────

async function handleGetArticle(env: Env, slug: string): Promise<Response> {
    const index = await getArticlesIndex(env)
    const meta = index.find((a) => a.slug === slug)
    if (!meta) return corsResponse({ error: 'Not found' }, { status: 404 })

    const content = await getArticleContent(env, slug)
    return corsResponse({ ...meta, content: content || '' })
}

// ─── Update article ────────────────────────────────────────────────────────────

async function handleUpdateArticle(req: Request, env: Env, slug: string): Promise<Response> {
    const body = await req.json<{ content?: string; title?: string; primaryKeyword?: string }>().catch(() => ({}))

    const index = await getArticlesIndex(env)
    const existing = index.find((a) => a.slug === slug)
    if (!existing) return corsResponse({ error: 'Not found' }, { status: 404 })

    if (body.content) {
        await saveArticle(env, slug, body.content)
    }

    if (body.title || body.primaryKeyword) {
        await updateArticlesIndex(env, {
            ...existing,
            title: body.title ?? existing.title,
            primaryKeyword: body.primaryKeyword ?? existing.primaryKeyword,
        })
    }

    return corsResponse({ ok: true, slug })
}

// ─── Regenerate article ────────────────────────────────────────────────────────

async function handleRegenerate(req: Request, env: Env, slug: string): Promise<Response> {
    const body = await req.json<{
        title?: string
        primaryKeyword?: string
        secondaryKeywords?: string[]
        outline?: string[]
        angle?: string
    }>().catch(() => ({}))

    const existing = await getArticlesIndex(env)
    const found = existing.find((a) => a.slug === slug)
    if (!found) return corsResponse({ error: `Article "${slug}" not found` }, { status: 404 })

    const plan: ArticlePlan = {
        title: body.title ?? found.title,
        slug,
        primaryKeyword: body.primaryKeyword ?? found.primaryKeyword,
        secondaryKeywords: body.secondaryKeywords ?? [],
        vietnameseKeyword: body.primaryKeyword ?? found.primaryKeyword,
        searchIntent: 'informational',
        difficulty: 'low',
        feasibilityScore: 8,
        competitorGap: 'Regenerate',
        outline: body.outline ?? ['Introduction', 'Main Content', 'Practical Tips', 'Conclusion'],
        targetWordCount: 1500,
        angle: body.angle ?? `Regenerate of "${found.title}"`,
    }

    console.log(`[SEO] Regenerating article: ${slug}`)
    const result = await processArticle(env, plan, true)

    return corsResponse({
        ok: result.success,
        slug,
        images: result.images,
        cost: result.cost,
        error: result.error,
    })
}

// ─── Delete article ────────────────────────────────────────────────────────────

async function handleDelete(env: Env, slug: string): Promise<Response> {
    const removed = await removeArticleFromIndex(env, slug)
    if (!removed) return corsResponse({ error: `Article "${slug}" not found` }, { status: 404 })

    await deleteArticle(env, slug)
    await deleteArticleImages(env, slug)

    try {
        await env.VECTORIZE.deleteByIds([slug])
    } catch {
        console.warn(`[SEO] Vectorize delete failed for ${slug}`)
    }

    console.log(`[SEO] Deleted: ${slug}`)
    return corsResponse({ ok: true, slug })
}

// ─── List workflows ────────────────────────────────────────────────────────────

async function handleListWorkflows(env: Env): Promise<Response> {
    const today = new Date().toISOString().split('T')[0]

    const workflows: Array<{
        id: string
        status: string
        triggerDate: string
        targetCount: number
    }> = []

    for (let d = 0; d < 7; d++) {
        const date = new Date(Date.now() - d * 86400000).toISOString().split('T')[0]
        for (let h = 0; h < 24; h++) {
            const prefix = `seo-${date}`
            try {
                const instance = await env.SEO_WORKFLOW.get(`${prefix}-${h}`)
                if (instance) {
                    const status = await instance.status()
                    workflows.push({
                        id: `${prefix}-${h}`,
                        status: status.status as string,
                        triggerDate: date,
                        targetCount: (status.payload as WorkflowParams)?.targetCount ?? 0,
                    })
                }
            } catch {
                // workflow doesn't exist, skip
            }
        }
    }

    // Also try to list recent ones with timestamp suffix
    const now = Date.now()
    for (let offset = 0; offset < 7 * 24; offset++) {
        const ts = now - offset * 3600000
        const date = new Date(ts).toISOString().split('T')[0]
        const candidateId = `seo-${date}-${ts - (ts % 3600000) + offset}`
        try {
            const instance = await env.SEO_WORKFLOW.get(candidateId)
            if (instance) {
                const status = await instance.status()
                const existing = workflows.find(w => w.id === candidateId)
                if (!existing) {
                    workflows.push({
                        id: candidateId,
                        status: status.status as string,
                        triggerDate: date,
                        targetCount: (status.payload as WorkflowParams)?.targetCount ?? 0,
                    })
                }
            }
        } catch {
            // skip
        }
    }

    return corsResponse({ workflows: workflows.slice(0, 20) })
}

// ─── Publish ──────────────────────────────────────────────────────────────────

async function handlePublish(req: Request, env: Env): Promise<Response> {
    const body = await req.json<{ slug: string }>().catch(() => ({}))
    if (!body.slug) {
        return corsResponse({ error: 'Missing "slug" in body' }, { status: 400 })
    }

    const result = await publishArticle(env, body.slug)
    if (result.ok) {
        return corsResponse(result)
    }
    return corsResponse(result, { status: 500 })
}
