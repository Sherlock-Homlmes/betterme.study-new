import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers'
import type { Env, WorkflowParams, ArticleResult, ArticlePlan, StrategyResult, ResearchResult } from './types'
import { callGemini, generateImage, parseJSON, sleep, STRATEGY_RESPONSE_SCHEMA, RESEARCH_RESPONSE_SCHEMA } from './vertex'
import type { GroundingSource } from './vertex'
import { checkSimilarity, upsertArticle } from './services/vectorize'
import {
    saveArticle, saveImage, deleteArticleImages,
    getArticlesIndex, updateArticlesIndex,
} from './services/r2'
import { notifyDiscord } from './services/discord'
import {
    STRATEGY_SYSTEM_PROMPT, buildStrategyPrompt,
    RESEARCH_SYSTEM_PROMPT, buildResearchPrompt,
    WRITER_SYSTEM_PROMPT, buildWriterPrompt,
    buildImageGenerationPayload,
} from './prompts'

export class SEOContentWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
    async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
        const env = this.env
        const { triggeredAt, targetCount } = event.payload

        console.log(`[SEO Workflow] Started at ${triggeredAt}, target: ${targetCount} articles`)

        const existingArticles = await step.do('fetch-existing-articles', async () => {
            const index = await getArticlesIndex(env)
            console.log(`[SEO] Found ${index.length} existing articles`)
            return index
        })

        const strategy = await step.do('generate-strategy', {
            retries: { limit: 2, delay: '30 seconds', backoff: 'exponential' },
        }, async () => {
            const existingTitles = existingArticles.map(
                (a) => `${a.title} [keyword: ${a.primaryKeyword}]`
            )
            const prompt = buildStrategyPrompt(existingTitles)

            console.log('[SEO] Calling Gemini for strategy (structured output + Google Search)...')
            const raw = await callGemini(env, prompt, {
                systemPrompt: STRATEGY_SYSTEM_PROMPT,
                useSearch: true,
                temperature: 0.3,
                responseSchema: STRATEGY_RESPONSE_SCHEMA,
            })

            return parseJSON<StrategyResult>(raw)
        })

        console.log(`[SEO] Strategy generated: ${strategy.articles.length} article plans`)
        console.log(`[SEO] Focus: ${strategy.siteAnalysis.recommendedFocus}`)

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

            if (i < plans.length - 1) {
                await step.sleep(`rate-limit-pause-${i}`, '90 seconds')
            }
        }

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

export async function processArticle(
    env: Env,
    plan: ArticlePlan,
    skipSimilarity = false,
): Promise<ArticleResult> {
    if (!skipSimilarity) {
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
    }

    try {
        // Clean up old images before regenerating (rewrite case)
        if (skipSimilarity) {
            await deleteArticleImages(env, plan.slug)
            console.log(`[SEO] Cleaned old images for rewrite: ${plan.slug}`)
        }

        // Deep research
        console.log(`[SEO] Researching: ${plan.title}`)
        const groundingSources: GroundingSource[] = []
        const researchRaw = await callGemini(env, buildResearchPrompt(plan), {
            systemPrompt: RESEARCH_SYSTEM_PROMPT,
            useSearch: true,
            temperature: 0.2,
            responseSchema: RESEARCH_RESPONSE_SCHEMA,
            onSources: (sources) => {
                // Keep only the most relevant sources (dedup already done upstream).
                groundingSources.push(...sources.slice(0, 15))
            },
        })
        const research = parseJSON<ResearchResult>(researchRaw)
        console.log(`[SEO] Research done, ${groundingSources.length} source URLs captured`)

        // Generate images — hero + section illustrations (fail entire article if any image fails).
        // Runs STRICTLY SEQUENTIAL with sleeps between calls: image generation is the
        // most aggressively rate-limited model, back-to-back calls trigger 429 RESOURCE_EXHAUSTED.
        console.log(`[SEO] Generating images for: ${plan.title}`)
        const imagePayload = buildImageGenerationPayload(plan, research)
        const savedImages: { hero?: string; sections: string[] } = { sections: [] }

        // Hero/banner image
        const heroBytes = await generateImage(env, imagePayload.hero)
        const heroPath = await saveImage(env, plan.slug, 'banner.webp', heroBytes)
        savedImages.hero = heroPath
        console.log(`[SEO] Hero image saved: ${heroPath}`)

        // Section images (one per outline section) — pace each call to avoid 429
        for (let s = 0; s < imagePayload.sections.length; s++) {
            if (s > 0) {
                await sleep(8000) // breathe between image generations
            }
            const section = imagePayload.sections[s]
            const sectionBytes = await generateImage(env, section.prompt)
            const sectionPath = await saveImage(
                env,
                plan.slug,
                `section-${section.index + 1}.webp`,
                sectionBytes,
            )
            savedImages.sections.push(sectionPath)
            console.log(`[SEO] Section image saved: ${sectionPath}`)
        }

        // Pause before the big writer call so the model recovers its quota.
        await sleep(10000)

        const CDN = 'https://seo-files.betterme.dev'

        // Write article — pass exact image paths so writer only references existing images
        console.log(`[SEO] Writing: ${plan.title}`)
        const pubDate = new Date().toISOString().split('T')[0]
        const content = await callGemini(
            env,
            buildWriterPrompt(
                plan, research, pubDate,
                savedImages.hero ? `${CDN}${savedImages.hero}` : '',
                savedImages.sections.map((p) => `${CDN}${p}`),
                groundingSources,
            ),
            {
                systemPrompt: WRITER_SYSTEM_PROMPT,
                useSearch: false,
                temperature: 0.85,
                // Thinking model: budget covers reasoning + full 2000-2500 word article.
                maxTokens: 24576,
            },
        )

        // Save markdown to R2
        await saveArticle(env, plan.slug, content)

        // Cost tracking
        const imageCount = 1 + savedImages.sections.length
        const estimatedUsd = imageCount * 0.02 + 0.005 // rough Gemini image + text estimate
        const articleCost = { geminiTokens: 12000, imageCount, estimatedUsd: Math.round(estimatedUsd * 1000) / 1000 }

        // Update article index
        await updateArticlesIndex(env, {
            slug: plan.slug,
            title: plan.title,
            primaryKeyword: plan.primaryKeyword,
            publishedAt: new Date().toISOString(),
            imageCount,
            cost: articleCost,
        })

        // Embed + upsert to Vectorize
        await upsertArticle(env, plan.slug, plan.title, [
            plan.primaryKeyword,
            ...plan.secondaryKeywords,
        ])

        return { plan, content, success: true, skipped: false, images: savedImages, cost: articleCost }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[SEO] Failed: ${plan.slug} — ${message}`)
        return { plan, content: '', success: false, skipped: false, error: message }
    }
}
