import { GoogleGenAI, Type } from '@google/genai'
import type { Env } from './types'

// ─── Config ──────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image'
const DEFAULT_REGION = 'us-central1'

// ─── Rate-limit safety: sequential pacing + retry on 429 ──────────────────────
// Vertex/Google repeatedly returns RESOURCE_EXHAUSTED (429) when calls fire too
// fast. Everything here runs STRICTLY SEQUENTIAL — no Promise.all, no fan-out —
// and each call is paced + retried with exponential backoff on rate-limit.

/**
 * Generous output budget for STRUCTURED (JSON) calls. gemini-2.5-flash is a
 * thinking model: thinking tokens + visible tokens BOTH come out of
 * maxOutputTokens. We disable thinking on JSON calls (thinkingBudget: 0) and
 * keep this budget high so the schema-constrained JSON never gets truncated
 * mid-string (which produced "Unterminated string in JSON" errors).
 */
const STRUCTURED_MAX_TOKENS = 24576

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Minimum gap between two consecutive Gemini calls within the same isolate. */
const MIN_CALL_GAP_MS = 4000
let lastCallAt = 0

async function enforcePace(): Promise<void> {
    const wait = MIN_CALL_GAP_MS - (Date.now() - lastCallAt)
    if (wait > 0) await sleep(wait)
    lastCallAt = Date.now()
}

function isRateLimitError(err: unknown): boolean {
    const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
    return /429|RESOURCE_EXHAUSTED|resource_exhausted|rate.?limit|quota exceeded|too many requests/i.test(detail)
}

/**
 * Run a Gemini operation sequentially with retry-on-429.
 * Backoff: 8s, 16s, 32s, 60s, 60s (+ up to 4s jitter) per attempt.
 */
async function callGeminiWithRetry<T>(
    operation: () => Promise<T>,
    label: string,
    maxRetries = 5,
): Promise<T> {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        await enforcePace()
        try {
            return await operation()
        } catch (err) {
            lastError = err
            if (!isRateLimitError(err) || attempt === maxRetries) throw err

            const base = Math.min(60000, 8000 * 2 ** attempt)
            const delay = base + Math.floor(Math.random() * 4000)
            console.warn(`[Gemini] ${label}: 429 rate limit — retry ${attempt + 1}/${maxRetries} sau ${Math.round(delay / 1000)}s`)
            await sleep(delay)
        }
    }
    throw lastError
}

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

export interface GroundingSource {
    url: string
    title: string
}

export interface GeminiOptions {
    systemPrompt?: string
    useSearch?: boolean
    temperature?: number
    maxTokens?: number
    /** SDK-style schema object (uses Type enum) for structured output. */
    responseSchema?: Record<string, unknown>
    /**
     * Called with real source URLs extracted from Google Search grounding
     * metadata (only fires when useSearch is true). Lets the caller pass the
     * verified URLs downstream so references can be rendered as hyperlinks.
     */
    onSources?: (sources: GroundingSource[]) => void
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

/**
 * Detect truncated output. gemini-2.5-flash returns finishReason === 'MAX_TOKENS'
 * when the response is cut short — for structured JSON this means an incomplete
 * payload ("Unterminated string in JSON" downstream). Throw a retryable error so
 * the workflow step / caller can back off and try again.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertNotTruncated(response: any, label: string): void {
    const reason = response?.candidates?.[0]?.finishReason
    if (reason === 'MAX_TOKENS') {
        throw new Error(`${label}: response truncated (finishReason=MAX_TOKENS) — increase token budget`)
    }
}

/** Pull real (url, title) pairs out of a Gemini googleSearch grounding response. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGroundingSources(response: any): GroundingSource[] {
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks
    if (!Array.isArray(chunks)) return []
    const seen = new Set<string>()
    const out: GroundingSource[] = []
    for (const c of chunks) {
        const url = c?.web?.uri as string | undefined
        if (!url || seen.has(url)) continue
        seen.add(url)
        out.push({ url, title: (c?.web?.title as string) ?? '' })
    }
    return out
}

/** Search-grounded call → raw text, then structure into exact JSON schema. */
async function callGeminiSearchThenStructure(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    opts: GeminiOptions,
): Promise<string> {
    console.log('[Gemini] Search + Schema → 2-call approach')

    // Step 1: Search call (no schema) — strictly sequential, retried on 429.
    // thinking disabled: research is extraction, not reasoning — saves the token
    // budget for the actual search-grounded content.
    const searchResponse = await callGeminiWithRetry(
        () => ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: opts.systemPrompt,
                tools: [{ googleSearch: {} }],
                temperature: opts.temperature ?? 0.7,
                maxOutputTokens: opts.maxTokens ?? STRUCTURED_MAX_TOKENS,
                thinkingConfig: { thinkingBudget: 0 },
            },
        }),
        'gemini-search',
    )
    assertNotTruncated(searchResponse, 'gemini-search')

    // Capture real source URLs from Google Search grounding metadata so the
    // writer can render references as clickable links.
    const sources = extractGroundingSources(searchResponse)
    if (sources.length) {
        console.log(`[Gemini] Captured ${sources.length} grounding sources`)
        opts.onSources?.(sources)
    }

    // Step 2: Structure the raw research data into exact JSON schema, injecting
    // the real source URLs so each citation carries a usable link.
    const sourcesBlock = sources.length
        ? [
            '',
            '---NGUỒN URL THẬT TỪ GOOGLE SEARCH---',
            sources.map((s, i) => `${i + 1}. ${s.url} — ${s.title}`).join('\n'),
            '---HẾT NGUỒN---',
            'BẮT BUỘC: với mỗi citation trong authorityData và sectionSources, nếu có URL phù hợp trong danh sách trên thì KÈM URL đó vào cuối citation (vd: "Author, Year. Title. Journal. https://...").',
        ].join('\n')
        : ''

    const structureResponse = await callGeminiWithRetry(
        () => ai.models.generateContent({
            model,
            contents: [
                'Dưới đây là dữ liệu research từ Google Search.',
                'Hãy trích xuất CHÍNH XÁC thành JSON theo schema yêu cầu.',
                '',
                '---RAW DATA---',
                searchResponse.text ?? '',
                '---END RAW DATA---',
                sourcesBlock,
            ].join('\n'),
            config: {
                systemInstruction: 'Bạn là JSON formatter. Chỉ trả về JSON hợp lệ theo schema, không thêm gì khác.',
                responseMimeType: 'application/json',
                responseSchema: opts.responseSchema!,
                temperature: 0.1,
                maxOutputTokens: opts.maxTokens ?? STRUCTURED_MAX_TOKENS,
                thinkingConfig: { thinkingBudget: 0 },
            },
        }),
        'gemini-structure',
    )
    assertNotTruncated(structureResponse, 'gemini-structure')

    return structureResponse.text ?? ''
}

/** Single Gemini API call — no special fallback logic. */
async function callGeminiSingle(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    opts: GeminiOptions,
): Promise<string> {
    const hasSchema = !!opts.responseSchema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
        temperature: opts.temperature ?? 0.7,
        topP: 0.95,
        // Structured (JSON) calls need a large budget and NO thinking, otherwise
        // thinking eats the tokens and the schema-constrained JSON truncates.
        maxOutputTokens: opts.maxTokens ?? (hasSchema ? STRUCTURED_MAX_TOKENS : 8192),
    }

    if (hasSchema) {
        config.thinkingConfig = { thinkingBudget: 0 }
    }

    if (opts.systemPrompt) {
        config.systemInstruction = opts.systemPrompt
    }

    if (opts.useSearch) {
        config.tools = [{ googleSearch: {} }]
    }

    if (hasSchema) {
        config.responseMimeType = 'application/json'
        config.responseSchema = opts.responseSchema
    }

    const response = await callGeminiWithRetry(
        () => ai.models.generateContent({
            model,
            contents: prompt,
            config,
        }),
        hasSchema ? 'gemini-structured' : 'gemini-generate',
    )
    if (hasSchema) assertNotTruncated(response, 'gemini-structured')

    return response.text ?? ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip markdown fences (best-effort, only used on non-structured output). */
function stripFences(raw: string): string {
    return raw
        .replace(/^```json\s*/m, '')
        .replace(/^```\s*/m, '')
        .replace(/```\s*$/m, '')
        .trim()
}

/**
 * Best-effort repair of JSON that was truncated mid-output (MAX_TOKENS).
 * Walks the string tracking string/escape state and nesting depth, then at the
 * cut point closes any open string and unwinds open braces/brackets back to 0.
 * Returns null if the input already looks complete (so the caller can surface
 * the real parse error). Repair is intentionally conservative: it may drop the
 * trailing partial element, but the surviving prefix is guaranteed to parse.
 */
function repairTruncatedJSON(s: string): string | null {
    let inString = false
    let escape = false
    const stack: Array<'{' | '['> = []
    let lastStructuralEnd = -1 // index AFTER the last ','/'}'/']' at depth >= 1

    for (let i = 0; i < s.length; i++) {
        const ch = s[i]
        if (inString) {
            if (escape) escape = false
            else if (ch === '\\') escape = true
            else if (ch === '"') inString = false
            continue
        }
        if (ch === '"') { inString = true; continue }
        if (ch === '{' || ch === '[') { stack.push(ch); continue }
        if (ch === '}' || ch === ']') {
            if (stack.length) stack.pop()
            lastStructuralEnd = i + 1
            continue
        }
        if (ch === ',') lastStructuralEnd = i + 1
    }

    // Already complete — nothing to repair.
    if (!inString && stack.length === 0) return null

    // Prefer cutting back to the last clean element boundary, then close.
    const base = lastStructuralEnd > 0 ? s.slice(0, lastStructuralEnd) : s
    let repaired = inString ? `${base}` : base
    // Remove a trailing dangling comma so closing braces parse.
    repaired = repaired.replace(/,\s*$/, '')

    const closers = stack.map((open) => (open === '{' ? '}' : ']'))
    repaired += closers.join('')

    // Verify the repair actually parses; if not, give up.
    try {
        JSON.parse(repaired)
    } catch {
        return null
    }
    return repaired
}

/**
 * Strip markdown fences then JSON.parse. If parsing fails (typically truncated
 * output from MAX_TOKENS), attempt a truncation repair before giving up — and
 * always surface the length + tail so the failure is debuggable.
 */
export function parseJSON<T>(raw: string): T {
    const clean = stripFences(raw)
    try {
        return JSON.parse(clean) as T
    } catch (err) {
        const repaired = repairTruncatedJSON(clean)
        if (repaired) {
            console.warn(`[parseJSON] JSON was truncated (len=${clean.length}) — repaired`)
            return JSON.parse(repaired) as T
        }
        throw new Error(
            `JSON parse failed (len=${clean.length}): ${(err as Error).message}. ` +
            `tail="${clean.slice(-180)}"`,
        )
    }
}

// ─── Gemini Image Generation ─────────────────────────────────────────────────

export async function generateImage(
    env: Env,
    prompt: string,
): Promise<Uint8Array> {
    const { ai } = await getClient(env)
    const model = modelResource(env, GEMINI_IMAGE_MODEL)

    // Image generation is the most aggressively rate-limited model — retry on 429.
    const response = await callGeminiWithRetry(
        () => ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        }),
        'gemini-image',
    )

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
