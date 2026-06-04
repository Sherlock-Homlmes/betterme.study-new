import type { Env } from './types'

// ─── Config ──────────────────────────────────────────────────────────────────

// Update to gemini-3.5-flash-001 or gemini-3.5-pro when Vertex GA
const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image'
const DEFAULT_REGION = 'us-central1'

// ─── JWT / OAuth ─────────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

function encodeJSON(obj: unknown): string {
    return b64url(new TextEncoder().encode(JSON.stringify(obj)).buffer as ArrayBuffer)
}

async function buildJWT(serviceAccount: string, privateKeyPem: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)

    const header = encodeJSON({ alg: 'RS256', typ: 'JWT' })
    const payload = encodeJSON({
        iss: serviceAccount,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    })

    const signingInput = `${header}.${payload}`

    const pem = privateKeyPem
        .replace(/-----[^-]+-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\s/g, '')

    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))

    const key = await crypto.subtle.importKey(
        'pkcs8',
        der.buffer as ArrayBuffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
    )

    const sig = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(signingInput),
    )

    return `${signingInput}.${b64url(sig)}`
}

async function getAccessToken(env: Env): Promise<string> {
    const jwt = await buildJWT(env.GCP_SERVICE_ACCOUNT, env.GCP_PRIVATE_KEY)

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    })

    const data = (await res.json()) as { access_token?: string; error?: string }
    if (!res.ok || !data.access_token) {
        throw new Error(`OAuth2 error: ${data.error ?? res.statusText}`)
    }

    return data.access_token
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

export interface GeminiOptions {
    systemPrompt?: string
    useSearch?: boolean   // Google Search grounding (incompatible with jsonMode)
    temperature?: number
    maxTokens?: number
    jsonMode?: boolean    // responseMimeType application/json (no search)
}

interface GeminiResponse {
    candidates?: {
        content?: { parts?: { text?: string }[] }
        finishReason?: string
    }[]
    promptFeedback?: { blockReason?: string }
}

export async function callGemini(
    env: Env,
    prompt: string,
    opts: GeminiOptions = {},
): Promise<string> {
    const token = await getAccessToken(env)
    const region = env.GCP_REGION || DEFAULT_REGION
    const project = env.GCP_PROJECT_ID

    const url =
        `https://${region}-aiplatform.googleapis.com/v1/projects/${project}` +
        `/locations/${region}/publishers/google/models/${GEMINI_MODEL}:generateContent`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: opts.temperature ?? 0.7,
            topP: 0.95,
            maxOutputTokens: opts.maxTokens ?? 8192,
            // jsonMode is incompatible with googleSearch tool
            ...(opts.jsonMode && !opts.useSearch
                ? { responseMimeType: 'application/json' }
                : {}),
        },
    }

    if (opts.systemPrompt) {
        body.systemInstruction = { parts: [{ text: opts.systemPrompt }] }
    }

    if (opts.useSearch) {
        body.tools = [{ googleSearch: {} }]
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Vertex AI ${res.status}: ${err}`)
    }

    const data = (await res.json()) as GeminiResponse

    if (data.promptFeedback?.blockReason) {
        throw new Error(`Prompt blocked: ${data.promptFeedback.blockReason}`)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty response from Gemini')

    return text
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown fences then JSON.parse */
export function parseJSON<T>(raw: string): T {
    const clean = raw
        .replace(/^```json\s*/m, '')
        .replace(/^```\s*/m, '')
        .replace(/```\s*$/m, '')
        .trim()
    return JSON.parse(clean) as T
}

// ─── Gemini Image Generation ─────────────────────────────────────────────────

export async function generateImage(
    env: Env,
    prompt: string,
): Promise<Uint8Array> {
    const token = await getAccessToken(env)
    const region = env.GCP_REGION || DEFAULT_REGION
    const project = env.GCP_PROJECT_ID

    const url =
        `https://${region}-aiplatform.googleapis.com/v1/projects/${project}` +
        `/locations/${region}/publishers/google/models/${GEMINI_IMAGE_MODEL}:generateContent`

    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Vertex AI Image ${res.status}: ${err}`)
    }

    const data = await res.json() as {
        candidates?: {
            content?: {
                parts?: Array<{
                    text?: string
                    inlineData?: { mimeType?: string; data?: string }
                }>
            }
        }[]
        promptFeedback?: { blockReason?: string }
    }

    if (data.promptFeedback?.blockReason) {
        throw new Error(`Image prompt blocked: ${data.promptFeedback.blockReason}`)
    }

    const parts = data.candidates?.[0]?.content?.parts
    if (!parts) throw new Error('No parts in image generation response')

    const imagePart = parts.find((p) => p.inlineData?.data)
    if (!imagePart?.inlineData?.data) {
        const textPart = parts.find((p) => p.text)
        throw new Error(`No image in response. Text: ${textPart?.text ?? 'none'}`)
    }

    const binary = atob(imagePart.inlineData.data)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }

    return bytes
}