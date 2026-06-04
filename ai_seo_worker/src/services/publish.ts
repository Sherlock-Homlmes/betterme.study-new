import type { Env } from '../types'
import { getArticleContent, getArticlesIndex } from './r2'

const OLD_CDN_HOST = 'seo-files.betterme.dev'
const NEW_CDN_HOST = 'files.betterme.dev'

const IMAGE_PATH_REGEX = new RegExp(
    `https?://${OLD_CDN_HOST.replace('.', '\\.')}/([^\\s)"\\]]+)`,
    'g',
)

export interface PublishResult {
    ok: boolean
    slug: string
    imagesCopied: number
    githubCommitSha?: string
    error?: string
}

export async function publishArticle(env: Env, slug: string): Promise<PublishResult> {
    const index = await getArticlesIndex(env)
    const meta = index.find((a) => a.slug === slug)
    if (!meta) {
        return { ok: false, slug, imagesCopied: 0, error: `Article "${slug}" not found in index` }
    }

    const content = await getArticleContent(env, slug)
    if (!content) {
        return { ok: false, slug, imagesCopied: 0, error: `Article content not found for "${slug}"` }
    }

    const imagePaths = extractImagePaths(content)
    console.log(`[Publish] Found ${imagePaths.length} images for ${slug}`)

    let imagesCopied = 0
    for (const imagePath of imagePaths) {
        try {
            const obj = await env.CONTENT_BUCKET.get(imagePath)
            if (!obj) {
                console.warn(`[Publish] Image not found in content bucket: ${imagePath}`)
                continue
            }
            const data = await obj.arrayBuffer()
            await env.LANDING_BUCKET.put(imagePath, data, {
                httpMetadata: obj.httpMetadata,
                customMetadata: obj.customMetadata,
            })
            imagesCopied++
            console.log(`[Publish] Copied image: ${imagePath}`)
        } catch (err) {
            console.error(`[Publish] Failed to copy image ${imagePath}: ${err}`)
        }
    }

    const updatedContent = content.replaceAll(OLD_CDN_HOST, NEW_CDN_HOST)

    let githubCommitSha: string | undefined
    try {
        githubCommitSha = await commitToGitHub(env, slug, updatedContent)
        console.log(`[Publish] GitHub commit: ${githubCommitSha}`)
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
            ok: false,
            slug,
            imagesCopied,
            error: `Images copied (${imagesCopied}) but GitHub commit failed: ${message}`,
        }
    }

    return { ok: true, slug, imagesCopied, githubCommitSha }
}

function extractImagePaths(markdown: string): string[] {
    const paths = new Set<string>()
    let match: RegExpExecArray | null
    const regex = new RegExp(IMAGE_PATH_REGEX.source, 'g')
    while ((match = regex.exec(markdown)) !== null) {
        paths.add(match[1])
    }
    return [...paths]
}

async function commitToGitHub(env: Env, slug: string, content: string): Promise<string> {
    const repo = env.GITHUB_REPO
    const token = env.GITHUB_TOKEN
    const branch = 'master'
    const filePath = `landing/src/content/blog/${slug}.md`

    const url = `https://api.github.com/repos/${repo}/contents/${filePath}`

    let sha: string | undefined
    const checkRes = await fetch(`${url}?ref=${branch}`, {
        headers: githubHeaders(token),
    })
    if (checkRes.ok) {
        const data = (await checkRes.json()) as { sha: string }
        sha = data.sha
    }

    const body: Record<string, unknown> = {
        message: `blog: publish "${slug}"`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch,
    }
    if (sha) {
        body.sha = sha
    }

    const res = await fetch(url, {
        method: 'PUT',
        headers: githubHeaders(token),
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`GitHub API ${res.status}: ${errBody}`)
    }

    const result = (await res.json()) as { commit: { sha: string } }
    return result.commit.sha
}

function githubHeaders(token: string): Record<string, string> {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ai-seo-worker',
        'Content-Type': 'application/json',
    }
}
