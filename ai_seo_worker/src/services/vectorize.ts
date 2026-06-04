import type { Env } from '../types'

// Only skip when truly the same topic — not just loosely related
// 0.92 = near-identical topic (same keyword, same angle)
// Lower values catch related-but-different topics which should still be allowed
const SIMILARITY_THRESHOLD = 0.92

// ─── Embedding ────────────────────────────────────────────────────────────────

export async function embedText(env: Env, text: string): Promise<number[]> {
    const result = (await env.AI.run('@cf/qwen/qwen3-embedding-0.6b', {
        text: [text],
    })) as { data: number[][] }

    const vec = result.data?.[0]
    if (!vec || vec.length === 0) throw new Error('Empty embedding returned')
    return vec
}

// ─── Similarity check ─────────────────────────────────────────────────────────

export interface SimilarityResult {
    isSimilar: boolean
    matches: string[] // titles of similar articles
}

export async function checkSimilarity(
    env: Env,
    title: string,
    keywords: string[],
): Promise<SimilarityResult> {
    // Combine title + keywords into one query string for richer embedding
    const query = `${title} ${keywords.join(' ')}`
    const vector = await embedText(env, query)

    const results = await env.VECTORIZE.query(vector, {
        topK: 5,
        returnMetadata: 'all',
    })

    const highSimilarity = results.matches.filter((m) => m.score >= SIMILARITY_THRESHOLD)

    return {
        isSimilar: highSimilarity.length > 0,
        matches: highSimilarity.map((m) => (m.metadata?.title as string | undefined) ?? m.id),
    }
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertArticle(
    env: Env,
    slug: string,
    title: string,
    keywords: string[],
): Promise<void> {
    const text = `${title} ${keywords.join(' ')}`
    const vector = await embedText(env, text)

    await env.VECTORIZE.upsert([
        {
            id: slug,
            values: vector,
            metadata: {
                title,
                slug,
                indexedAt: new Date().toISOString(),
            },
        },
    ])
}