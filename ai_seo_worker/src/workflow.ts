import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import type { Env, WorkflowParams, ArticleResult, ArticlePlan, StrategyResult, ResearchResult } from './types'
import { callGemini, parseJSON } from './vertex'
import { checkSimilarity, upsertArticle } from './services/vectorize'
import { saveArticle, getArticlesIndex, updateArticlesIndex } from './services/r2'
import { notifyDiscord } from './services/discord'
import {
    STRATEGY_SYSTEM_PROMPT, buildStrategyPrompt,
    RESEARCH_SYSTEM_PROMPT, buildResearchPrompt,
    WRITER_SYSTEM_PROMPT, buildWriterPrompt,
} from './prompts'

export class SEOContentWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
    async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
        const env = this.env
        const { triggeredAt, targetCount } = event.payload

        console.log(`[SEO Workflow] Started at ${triggeredAt}, target: ${targetCount} articles`)

        // ── Step 1: Load existing article index from R2 ──────────────────────────
        const existingArticles = await step.do('fetch-existing-articles', async () => {
            const index = await getArticlesIndex(env)
            console.log(`[SEO] Found ${index.length} existing articles`)
            return index
        })

        // ── Step 2: Strategy — research keyword opportunities, plan 5 articles ───
        const strategy = await step.do('generate-strategy', {
            retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' },
        }, async () => {
            const existingTitles = existingArticles.map(
                (a) => `${a.title} [keyword: ${a.primaryKeyword}]`
            )
            const prompt = buildStrategyPrompt(existingTitles)

            console.log('[SEO] Calling Gemini for strategy (with Google Search)...')
            const raw = await callGemini(env, prompt, {
                systemPrompt: STRATEGY_SYSTEM_PROMPT,
                useSearch: true,   // search grounding for real keyword research
                temperature: 0.3,  // low temp → consistent, analytical output
            })

            return parseJSON<StrategyResult>(raw)
        })

        console.log(`[SEO] Strategy generated: ${strategy.articles.length} article plans`)
        console.log(`[SEO] Focus: ${strategy.siteAnalysis.recommendedFocus}`)

        // ── Step 3: Process each article plan ────────────────────────────────────
        const results: ArticleResult[] = []
        const plans = strategy.articles.slice(0, targetCount)

        for (let i = 0; i < plans.length; i++) {
            const plan = plans[i]

            const result = await step.do(`process-article-${plan.slug}`, {
                retries: { limit: 2, delay: '1 minute', backoff: 'exponential' },
            }, async () => {
                return await processArticle(env, plan)
            })

            results.push(result)
            console.log(`[SEO] Article ${i + 1}/${plans.length}: ${plan.slug} → ${result.success ? '✅' : result.skipped ? '⏭️' : '❌'}`)

            // Rate limit buffer between articles (Gemini quota)
            if (i < plans.length - 1) {
                await step.sleep(`rate-limit-pause-${i}`, '90 seconds')
            }
        }

        // ── Step 4: Notify Discord ────────────────────────────────────────────────
        await step.do('notify-discord', async () => {
            await notifyDiscord(env.DISCORD_WEBHOOK_URL, results, triggeredAt)
            console.log('[SEO] Discord notified')
        })

        const published = results.filter((r) => r.success).length
        console.log(`[SEO] Done — ${published}/${plans.length} articles published`)

        return {
            published,
            skipped: results.filter((r) => r.skipped).length,
            failed: results.filter((r) => !r.success && !r.skipped).length,
        }
    }
}

// ─── Article processor ────────────────────────────────────────────────────────

async function processArticle(env: Env, plan: ArticlePlan): Promise<ArticleResult> {
    // 1. Similarity check — avoid duplicate topics
    const { isSimilar, matches } = await checkSimilarity(
        env,
        plan.title,
        [plan.primaryKeyword, ...plan.secondaryKeywords],
    )

    if (isSimilar) {
        return {
            plan,
            content: '',
            success: false,
            skipped: true,
            skipReason: `Trùng với: ${matches.join(', ')}`,
        }
    }

    try {
        // 2. Deep research with Google Search grounding
        console.log(`[SEO] Researching: ${plan.title}`)
        const researchRaw = await callGemini(env, buildResearchPrompt(plan), {
            systemPrompt: RESEARCH_SYSTEM_PROMPT,
            useSearch: true,
            temperature: 0.2,  // very low — factual research pass
        })
        const research = parseJSON<ResearchResult>(researchRaw)

        // 3. Write article — high temp for natural, human-like prose
        console.log(`[SEO] Writing: ${plan.title}`)
        const pubDate = new Date().toISOString().split('T')[0]
        const content = await callGemini(env, buildWriterPrompt(plan, research, pubDate), {
            systemPrompt: WRITER_SYSTEM_PROMPT,
            useSearch: false,
            temperature: 0.85,
            maxTokens: 12000,
        })

        // 4. Save markdown to R2
        await saveArticle(env, plan.slug, content)

        // 5. Update article index in R2
        await updateArticlesIndex(env, {
            slug: plan.slug,
            title: plan.title,
            primaryKeyword: plan.primaryKeyword,
            publishedAt: new Date().toISOString(),
        })

        // 6. Embed + upsert to Vectorize for future duplicate detection
        await upsertArticle(env, plan.slug, plan.title, [
            plan.primaryKeyword,
            ...plan.secondaryKeywords,
        ])

        return { plan, content, success: true, skipped: false }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[SEO] Failed: ${plan.slug} — ${message}`)
        return { plan, content: '', success: false, skipped: false, error: message }
    }
}