import type { Env, WorkflowParams } from './types'
export { SEOContentWorkflow } from './workflow'

export default {
    // ── Cron: runs at 3AM Vietnam (20:00 UTC) ──────────────────────────────────
    async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(triggerWorkflow(env))
    },

    // ── HTTP: manual trigger for testing ───────────────────────────────────────
    async fetch(req: Request, env: Env): Promise<Response> {
        const url = new URL(req.url)

        // POST /trigger — manual run (requires INTERNAL_SECRET header)
        if (req.method === 'POST' && url.pathname === '/trigger') {
            const secret = req.headers.get('x-internal-secret')
            if (secret !== env.INTERNAL_SECRET) {
                return new Response('Unauthorized', { status: 401 })
            }

            const body = await req.json<{ targetCount?: number }>().catch(() => ({}))
            const id = await triggerWorkflow(env, body.targetCount)
            return Response.json({ ok: true, workflowId: id })
        }

        // GET /status/:id — check workflow status
        if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
            const secret = req.headers.get('x-internal-secret')
            if (secret !== env.INTERNAL_SECRET) {
                return new Response('Unauthorized', { status: 401 })
            }

            const id = url.pathname.split('/status/')[1]
            const instance = await env.SEO_WORKFLOW.get(id)
            const status = await instance.status()
            return Response.json(status)
        }

        return new Response('betterme-seo-worker running', { status: 200 })
    },
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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