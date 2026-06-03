// ─── Domain types ────────────────────────────────────────────────────────────

export interface ArticlePlan {
    title: string
    slug: string
    primaryKeyword: string
    secondaryKeywords: string[]
    vietnameseKeyword: string
    searchIntent: 'informational' | 'navigational' | 'commercial'
    difficulty: 'low' | 'medium' | 'high'
    feasibilityScore: number // 1–10, higher = more achievable for betterme.dev
    competitorGap: string   // what competitors miss
    outline: string[]       // H2 sections
    targetWordCount: number
    angle: string           // unique content angle
}

export interface StrategyResult {
    siteAnalysis: {
        currentOpportunities: string[]
        contentGaps: string[]
        recommendedFocus: string
    }
    articles: ArticlePlan[]
}

export interface ResearchResult {
    topCompetitorInsights: string[]
    contentGaps: string[]
    keyFacts: string[]
    commonQuestions: string[]
    vietnameseSpecific: string[]   // challenges specific to Vietnamese learners
    uniqueAngle: string
    authorityData: string[]
    recentDevelopments: string[]
}

export interface ArticleIndex {
    slug: string
    title: string
    primaryKeyword: string
    publishedAt: string
}

export interface ArticleResult {
    plan: ArticlePlan
    content: string
    success: boolean
    skipped: boolean
    error?: string
    skipReason?: string
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export interface WorkflowParams {
    triggeredAt: string
    targetCount: number
}

// ─── Cloudflare Env ──────────────────────────────────────────────────────────

export interface Env {
    // Workflow binding
    SEO_WORKFLOW: Workflow

    // Storage
    CONTENT_BUCKET: R2Bucket
    VECTORIZE: VectorizeIndex
    AI: Ai

    // Vertex AI / GCP secrets
    GCP_PRIVATE_KEY: string       // RSA private key PEM (service account)
    GCP_SERVICE_ACCOUNT: string   // service account email
    GCP_PROJECT_ID: string
    GCP_REGION: string            // e.g. us-central1

    // Notifications
    DISCORD_WEBHOOK_URL: string

    // HTTP manual trigger auth
    INTERNAL_SECRET: string
}