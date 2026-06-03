import type { Env, ArticleIndex } from '../types'

const INDEX_KEY = 'meta/articles-index.json'
const ARTICLES_PREFIX = 'articles/'

// ─── Article file ─────────────────────────────────────────────────────────────

export async function saveArticle(env: Env, slug: string, content: string): Promise<void> {
    await env.CONTENT_BUCKET.put(`${ARTICLES_PREFIX}${slug}.md`, content, {
        httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
        customMetadata: { savedAt: new Date().toISOString() },
    })
}

export async function deleteArticle(env: Env, slug: string): Promise<void> {
    await env.CONTENT_BUCKET.delete(`${ARTICLES_PREFIX}${slug}.md`)
}

// ─── Index (lightweight manifest of all articles) ─────────────────────────────

export async function getArticlesIndex(env: Env): Promise<ArticleIndex[]> {
    const obj = await env.CONTENT_BUCKET.get(INDEX_KEY)
    if (!obj) return []

    try {
        const text = await obj.text()
        return JSON.parse(text) as ArticleIndex[]
    } catch {
        return []
    }
}

export async function updateArticlesIndex(
    env: Env,
    article: ArticleIndex,
): Promise<void> {
    const index = await getArticlesIndex(env)

    const existing = index.findIndex((a) => a.slug === article.slug)
    if (existing >= 0) {
        index[existing] = article
    } else {
        index.push(article)
    }

    await env.CONTENT_BUCKET.put(INDEX_KEY, JSON.stringify(index, null, 2), {
        httpMetadata: { contentType: 'application/json' },
    })
}