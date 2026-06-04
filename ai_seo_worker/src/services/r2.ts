import type { Env, ArticleIndex } from '../types'

const INDEX_KEY = 'meta/articles-index.json'
const ARTICLES_PREFIX = 'articles/'
const IMAGES_PREFIX = 'blog/image/'

export async function saveArticle(env: Env, slug: string, content: string): Promise<void> {
    await env.CONTENT_BUCKET.put(`${ARTICLES_PREFIX}${slug}.md`, content, {
        httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
        customMetadata: { savedAt: new Date().toISOString() },
    })
}

export async function deleteArticle(env: Env, slug: string): Promise<void> {
    await env.CONTENT_BUCKET.delete(`${ARTICLES_PREFIX}${slug}.md`)
}

export async function getArticleContent(env: Env, slug: string): Promise<string | null> {
    const obj = await env.CONTENT_BUCKET.get(`${ARTICLES_PREFIX}${slug}.md`)
    if (!obj) return null
    return await obj.text()
}

// ─── Images ───────────────────────────────────────────────────────────────────
// Stored at: blog/image/[slug]/[filename]  e.g. blog/image/meo-hoc-tap/banner.webp

export async function saveImage(
    env: Env,
    slug: string,
    filename: string,
    data: Uint8Array,
): Promise<string> {
    const fullKey = `${IMAGES_PREFIX}${slug}/${filename}`
    await env.CONTENT_BUCKET.put(fullKey, data, {
        httpMetadata: { contentType: 'image/png' },
        customMetadata: { savedAt: new Date().toISOString() },
    })
    return `/${fullKey}`
}

export async function deleteArticleImages(env: Env, slug: string): Promise<void> {
    const prefix = `${IMAGES_PREFIX}${slug}/`
    let cursor: string | undefined
    do {
        const listed = await env.CONTENT_BUCKET.list({ prefix, cursor })
        for (const obj of listed.objects) {
            await env.CONTENT_BUCKET.delete(obj.key)
        }
        cursor = listed.truncated ? listed.cursor : undefined
    } while (cursor)
}

// ─── Index ────────────────────────────────────────────────────────────────────

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

export async function removeArticleFromIndex(env: Env, slug: string): Promise<boolean> {
    const index = await getArticlesIndex(env)
    const existing = index.findIndex((a) => a.slug === slug)
    if (existing < 0) return false

    index.splice(existing, 1)
    await env.CONTENT_BUCKET.put(INDEX_KEY, JSON.stringify(index, null, 2), {
        httpMetadata: { contentType: 'application/json' },
    })
    return true
}
