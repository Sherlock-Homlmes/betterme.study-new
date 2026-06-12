import { GoogleGenAI, Type } from '@google/genai'
import type { Env } from './types'

// ─── Config ──────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'
const DEFAULT_REGION = 'us-central1'

// ─── JWT / OAuth (kept for Workers — SDK web build has no service-account auth) ─

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

// ─── SDK Client Factory ──────────────────────────────────────────────────────

/** Full Vertex AI model resource name: projects/{p}/locations/{l}/publishers/google/models/{m} */
function modelResource(env: Env, model: string): string {
    const region = env.GCP_REGION || DEFAULT_REGION
    return `projects/${env.GCP_PROJECT_ID}/locations/${region}/publishers/google/models/${model}`
}

/**
 * Create an SDK client that talks to Vertex AI using our JWT-derived access token.
 * The web build doesn't support project-based auth, so we pass the token via
 * httpOptions.headers and use full model resource names.
 */
async function getClient(env: Env): Promise<{ ai: GoogleGenAI; accessToken: string }> {
    const accessToken = await getAccessToken(env)
    const region = env.GCP_REGION || DEFAULT_REGION

    const ai = new GoogleGenAI({
        apiKey: 'vertex-auth',
        vertexai: true,
        httpOptions: {
            baseUrl: `https://${region}-aiplatform.googleapis.com`,
            apiVersion: 'v1',
            headers: {
                // SDK's WebAuth skips x-goog-api-key if already set.
                'x-goog-api-key': 'vertex-auth',
                // This is the real auth header for Vertex AI.
                Authorization: `Bearer ${accessToken}`,
            },
        },
    })

    return { ai, accessToken }
}

// ─── Structured Output Schemas (OpenAPI 3.0 / SDK Type enum) ────────────────

export const STRATEGY_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        siteAnalysis: {
            type: Type.OBJECT,
            properties: {
                currentOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                contentGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedFocus: { type: Type.STRING },
            },
            required: ['currentOpportunities', 'contentGaps', 'recommendedFocus'],
        },
        articles: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    slug: { type: Type.STRING },
                    primaryKeyword: { type: Type.STRING },
                    secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    vietnameseKeyword: { type: Type.STRING },
                    searchIntent: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    feasibilityScore: { type: Type.NUMBER },
                    competitorsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorGap: { type: Type.STRING },
                    outline: { type: Type.ARRAY, items: { type: Type.STRING } },
                    targetWordCount: { type: Type.NUMBER },
                    angle: { type: Type.STRING },
                    citationTargets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                    'title', 'slug', 'primaryKeyword', 'secondaryKeywords',
                    'vietnameseKeyword', 'searchIntent', 'difficulty', 'feasibilityScore',
                    'competitorGap', 'outline', 'targetWordCount', 'angle',
                ],
            },
        },
    },
    required: ['siteAnalysis', 'articles'],
}

export const RESEARCH_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        topCompetitorInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
        contentGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
        commonQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        vietnameseSpecific: { type: Type.ARRAY, items: { type: Type.STRING } },
        uniqueAngle: { type: Type.STRING },
        authorityData: { type: Type.ARRAY, items: { type: Type.STRING } },
        recentDevelopments: { type: Type.ARRAY, items: { type: Type.STRING } },
        sectionSources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    section: { type: Type.STRING },
                    sources: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['section', 'sources'],
            },
        },
    },
    required: [
        'topCompetitorInsights', 'contentGaps', 'keyFacts', 'commonQuestions',
        'vietnameseSpecific', 'uniqueAngle', 'authorityData', 'recentDevelopments',
    ],
}

// ─── Gemini Text Generation ──────────────────────────────────────────────────

export interface GeminiOptions {
    systemPrompt?: string
    useSearch?: boolean
    temperature?: number
    maxTokens?: number
    /** SDK-style schema object (uses Type enum) for structured output. */
    responseSchema?: Record<string, unknown>
}

/**
 * Call Gemini via the official SDK.
 *
 * Handles the Search × Schema incompatibility automatically:
 *   - search + schema → 2-call (search first, then structure into schema)
 *   - search only     → single call with googleSearch tool
 *   - schema only     → single call with structured output
 *   - neither         → plain text generation
 */
export async function callGemini(
    env: Env,
    prompt: string,
    opts: GeminiOptions = {},
): Promise<string> {
    const { ai } = await getClient(env)
    const model = modelResource(env, GEMINI_MODEL)

    // Gemini API does not support controlled generation with googleSearch.
    if (opts.useSearch && opts.responseSchema) {
        return callGeminiSearchThenStructure(ai, model, prompt, opts)
    }

    return callGeminiSingle(ai, model, prompt, opts)
}

/** Search-grounded call → raw text, then structure into exact JSON schema. */
async function callGeminiSearchThenStructure(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    opts: GeminiOptions,
): Promise<string> {
    console.log('[Gemini] Search + Schema → 2-call approach')

    // Step 1: Search call (no schema)
    const searchResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: opts.systemPrompt,
            tools: [{ googleSearch: {} }],
            temperature: opts.temperature ?? 0.7,
            maxOutputTokens: opts.maxTokens ?? 8192,
        },
    })

    // Step 2: Structure the raw research data into exact JSON schema
    const structureResponse = await ai.models.generateContent({
        model,
        contents: [
            'Dưới đây là dữ liệu research từ Google Search.',
            'Hãy trích xuất CHÍNH XÁC thành JSON theo schema yêu cầu.',
            '',
            '---RAW DATA---',
            searchResponse.text ?? '',
            '---END RAW DATA---',
        ].join('\n'),
        config: {
            systemInstruction: 'Bạn là JSON formatter. Chỉ trả về JSON hợp lệ theo schema, không thêm gì khác.',
            responseMimeType: 'application/json',
            responseSchema: opts.responseSchema!,
            temperature: 0.1,
            maxOutputTokens: opts.maxTokens ?? 8192,
        },
    })

    return structureResponse.text ?? ''
}

/** Single Gemini API call — no special fallback logic. */
async function callGeminiSingle(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    opts: GeminiOptions,
): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
        temperature: opts.temperature ?? 0.7,
        topP: 0.95,
        maxOutputTokens: opts.maxTokens ?? 8192,
    }

    if (opts.systemPrompt) {
        config.systemInstruction = opts.systemPrompt
    }

    if (opts.useSearch) {
        config.tools = [{ googleSearch: {} }]
    }

    if (opts.responseSchema) {
        config.responseMimeType = 'application/json'
        config.responseSchema = opts.responseSchema
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
    })

    return response.text ?? ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown fences then JSON.parse — safety net for non-structured calls. */
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
    const { ai } = await getClient(env)
    const model = modelResource(env, GEMINI_IMAGE_MODEL)

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
    })

    const parts = response.candidates?.[0]?.content?.parts
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
