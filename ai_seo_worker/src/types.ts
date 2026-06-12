// ─── Domain types ────────────────────────────────────────────────────────────

export interface ArticlePlan {
    title: string
    slug: string
    primaryKeyword: string
    secondaryKeywords: string[]
    vietnameseKeyword: string
    searchIntent: 'informational' | 'navigational' | 'commercial'
    difficulty: 'low' | 'medium' | 'high'
    feasibilityScore: number
    competitorsFound?: string[]
    competitorGap: string
    outline: string[]
    targetWordCount: number
    angle: string
    citationTargets?: string[]
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
    vietnameseSpecific: string[]
    uniqueAngle: string
    authorityData: string[]
    recentDevelopments: string[]
    sectionSources?: SectionSource[]
}

export interface SectionSource {
    section: string
    sources: string[]
}

export interface ArticleIndex {
    slug: string
    title: string
    primaryKeyword: string
    publishedAt: string
    imageCount: number
    cost: {
        geminiTokens: number
        imageCount: number
        estimatedUsd: number
    }
}

export interface ArticleResult {
    plan: ArticlePlan
    content: string
    success: boolean
    skipped: boolean
    error?: string
    skipReason?: string
    images?: {
        hero?: string
        sections: string[]
    }
    cost?: {
        geminiTokens: number
        imageCount: number
        estimatedUsd: number
    }
}

export interface ImageSection {
    sectionTitle: string
    prompt: string
    index: number
}

export interface ImageGeneration {
    hero: string
    sections: ImageSection[]
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export interface WorkflowParams {
    triggeredAt: string
    targetCount: number
}

// ─── Cloudflare Env ──────────────────────────────────────────────────────────

export interface Env {
    SEO_WORKFLOW: Workflow
    CONTENT_BUCKET: R2Bucket
    LANDING_BUCKET: R2Bucket
    VECTORIZE: VectorizeIndex
    AI: Ai
    GCP_PRIVATE_KEY: string
    GCP_SERVICE_ACCOUNT: string
    GCP_PROJECT_ID: string
    GCP_REGION: string
    DISCORD_WEBHOOK_URL: string
    INTERNAL_SECRET: string
    GITHUB_TOKEN: string
    GITHUB_REPO: string
}
