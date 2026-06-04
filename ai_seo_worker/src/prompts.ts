import type { ArticlePlan, ResearchResult, ImageGeneration } from './types'

// ─── Strategy Agent ───────────────────────────────────────────────────────────

export const STRATEGY_SYSTEM_PROMPT = `You are a senior SEO strategist specialising in Vietnamese personal development, community, and wellness content.

Your philosophy:
- Long-tail feasibility over vanity volume. A new/growing site like betterme.dev cannot compete for head-terms — find niches it can actually rank for.
- Vietnamese users search in BOTH Vietnamese AND English. Account for both keyword variants.
- Topical authority comes from clusters, not isolated articles. Plan content that builds inter-linking depth inside a topic.
- Search intent first: every brief must serve a clear informational intent — "how to", "mistakes to avoid", "comparison", "habit guide".
- ALWAYS discover competitors dynamically via Google Search — never rely on a fixed domain list. The competitive landscape shifts constantly; what ranks today may not be what ranked last month.

You always return ONLY valid JSON. No markdown, no commentary before or after.`

export function buildStrategyPrompt(existingArticles: string[]): string {
  const covered =
    existingArticles.length > 0
      ? existingArticles.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : '(none yet — fresh site)'

  return `Use Google Search to research SEO opportunities for betterme.dev.

═══════════════════════════════
SITE PROFILE
═══════════════════════════════
Domain        : betterme.dev
Niche         : Cộng đồng học tập và phát triển bản thân toàn diện cho người Việt
Community     : Discord-based learning community (BetterMe) — thousands of active members
Content lang  : Vietnamese (articles written for Vietnamese readers)
USP           : Community-driven, practical, peer-supported — NOT a course platform, NOT a textbook site
Authority     : Growing — assume DR < 30, prioritise low-competition targets
What we offer :
  • Cộng đồng học tập & kết nối qua Discord
  • Công cụ học tập: Pomodoro timer, Discord bot tích hợp AI
  • Tin tức hoạt động: câu lạc bộ, tình nguyện, sự kiện cộng đồng
  • Nội dung sức khoẻ thể chất & tinh thần (gym, dinh dưỡng, ngủ đủ giấc)
  • Nội dung phát triển bản thân: thói quen, tư duy, kỹ năng mềm, mục tiêu

═══════════════════════════════
CONTENT PILLARS (target clusters)
═══════════════════════════════
1. Phương pháp học tập — spaced repetition, Pomodoro, active recall, deep work, flow state
2. Phát triển bản thân — thói quen tốt, tư duy tăng trưởng, quản lý thời gian, goal setting
3. Sức khoẻ thể chất — tập gym, dinh dưỡng cho người đi học/đi làm, giấc ngủ, phục hồi
4. Sức khoẻ tinh thần — burnout, lo âu học tập, self-compassion, mindfulness thực tế
5. Kỹ năng mềm — giao tiếp, lãnh đạo, teamwork, thuyết trình, viết lách
6. Hoạt động cộng đồng — tình nguyện, câu lạc bộ, networking, campus life
7. Công cụ & ứng dụng — app productivity, AI tools, study tools cho học sinh/sinh viên Việt

═══════════════════════════════
KEYWORD STRATEGY RULES
═══════════════════════════════
- Target difficulty ≤ 35 (Ahrefs KD equivalent). Reject anything harder for this site.
- Prefer patterns: "cách [verb] hiệu quả", "[topic] cho người mới bắt đầu",
  "lỗi sai khi [topic]", "phương pháp [topic] tốt nhất", "tại sao [common struggle]",
  "[topic] là gì và cách áp dụng"
- If primary keyword is too competitive → find a niche angle (add demographic, level, use-case, context)
- Each article must target a DIFFERENT topic cluster — no two articles in same cluster today
- Feasibility score 1–10: 8+ = definitely do it, 6–7 = do with niche angle, <6 = reject

═══════════════════════════════
COMPETITOR DISCOVERY — DYNAMIC ONLY
═══════════════════════════════
For EACH proposed article topic:
1. Google: "[primary keyword]" → record which domains actually rank top 5 today
2. Google: "[primary keyword] -site:youtube.com" to surface blog/article competitors
3. Note recurring domains — those are the real competitors for this cluster this week
4. Assess each top result: shallow coverage? outdated (pre-2023)? missing community angle?
5. BetterMe differentiator: community experience, Discord study rooms, AI-powered tools,
   peer accountability — weave naturally, never force it

Do NOT hardcode any competitor list. Every search run should discover fresh competitors.

═══════════════════════════════
ALREADY COVERED — DO NOT REPEAT
═══════════════════════════════
${covered}

═══════════════════════════════
TASK
═══════════════════════════════
1. Search Google to validate keyword demand and competition for each proposed topic.
2. For each of 5 article briefs:
   a. Pick keyword, verify feasibility via search, adjust to niche if needed
   b. Ensure no overlap with already-covered list above
   c. Search and identify REAL competitors ranking today — note what they cover
   d. Define a unique angle that current top-ranking content has missed
   e. Write an outline of 4–6 H2 sections
3. Include a short site analysis of today's best opportunities.

Return ONLY this JSON structure:
{
  "siteAnalysis": {
    "currentOpportunities": ["top 5 keyword clusters to target right now"],
    "contentGaps": ["specific gaps discovered via live search today"],
    "recommendedFocus": "one-sentence strategic direction for this week"
  },
  "articles": [
    {
      "title": "Title in Vietnamese (includes primary keyword naturally)",
      "slug": "slug-in-transliterated-vietnamese-or-english",
      "primaryKeyword": "main keyword (Vietnamese)",
      "secondaryKeywords": ["kw2", "kw3", "kw4"],
      "searchIntent": "informational",
      "difficulty": "low",
      "feasibilityScore": 8,
      "competitorsFound": ["domain1.com — what they cover & where they fall short", "domain2.com — same"],
      "competitorGap": "what all current top-ranking articles miss that we will cover",
      "outline": ["H2 section 1", "H2 section 2", "H2 section 3", "H2 section 4", "H2 section 5"],
      "targetWordCount": 1600,
      "angle": "the unique angle that differentiates this article from everything currently ranking"
    }
  ]
}`
}

// ─── Research Agent ───────────────────────────────────────────────────────────

export const RESEARCH_SYSTEM_PROMPT = `You are a research specialist for personal development, wellness, and community content targeting Vietnamese readers.

Your job: Find the BEST available information on a topic so the writer produces an authoritative, differentiated article — not a rehash of what already exists.

Research priorities:
1. Search Google NOW to see what actually ranks — don't assume based on prior knowledge.
2. What do Vietnamese readers specifically struggle with on this topic?
3. Any authoritative data, studies, or statistics worth citing?
4. Recent developments (2024–2026) that current top-ranking articles haven't covered yet?
5. Concrete examples or analogies that resonate with Vietnamese cultural and daily-life context?
6. Community angles: what are Discord, Reddit, voz.vn, or spiderum.com users actually asking?

You always return ONLY valid JSON.`

export function buildResearchPrompt(plan: ArticlePlan): string {
  return `Use Google Search to deeply research this topic before writing anything.

ARTICLE BRIEF
Title            : ${plan.title}
Primary keyword  : ${plan.primaryKeyword}
Secondary keywords: ${plan.secondaryKeywords.join(', ')}
Unique angle     : ${plan.angle}
Outline to cover : ${plan.outline.join(' → ')}
Competitor gap   : ${plan.competitorGap}

RESEARCH TASKS
1. Search Google for "${plan.primaryKeyword}" → identify the top 5 ranking pages RIGHT NOW, note what they actually cover and what they skip
2. Search "${plan.primaryKeyword} site:voz.vn OR site:spiderum.com OR site:reddit.com" → find what real users ask, debate, and struggle with
3. Identify 3–5 clear content gaps in current top-ranking articles: missing depth, outdated info, no practical exercises, no Vietnamese context
4. Find specific statistics, studies, or expert sources that support our unique angle
5. Find the most-asked questions Vietnamese users have about this topic (from forums, Q&A sites, comment sections)
6. Identify challenges or misconceptions specific to Vietnamese context — cultural norms, education system pressures, lifestyle constraints
7. Find recent 2024–2026 developments: new research, tools, methods, or trends relevant to this topic
8. Find one memorable analogy, story, or real example that makes this topic click for a Vietnamese reader

Return ONLY this JSON:
{
  "topCompetitorInsights": ["what top-ranking articles already cover well — so we don't repeat it"],
  "contentGaps": ["specific gaps we will fill that no current top result addresses"],
  "keyFacts": ["important data points and stats — include source name if found"],
  "commonQuestions": ["questions Vietnamese users actually ask about this topic"],
  "vietnameseSpecific": ["challenges, pressures, or cultural context unique to Vietnamese readers"],
  "uniqueAngle": "refined unique angle based on live research (may update from brief)",
  "authorityData": ["studies, expert opinions, credible data we can cite naturally in the article"],
  "recentDevelopments": ["anything new in 2024–2026 that current top-ranking articles don't mention"]
}`
}

// ─── Writer Agent ─────────────────────────────────────────────────────────────

export const WRITER_SYSTEM_PROMPT = `Bạn viết nội dung cho betterme.dev — cộng đồng học tập & phát triển bản thân cho người Việt (Discord).

═══ TRIẾT LÝ VIẾT — VIẾT CHO AI HIỂU, KHÔNG PHẢI ĐỂ NGƯỜI ĐỌC SCAN ═══

Bài viết phải có semantic density cao — mật độ thông tin có cấu trúc trong đoạn ngắn.
Mục tiêu: AI (ChatGPT, Gemini, Perplexity) có thể copy nguyên đoạn làm answer mà không cần edit.

NGUYÊN TẮC CỐT LÕI:
1. Mỗi đoạn = 1 claim rõ ràng + evidence/example cụ thể. Không fluff, không intro dài, không kết luận chung chung.
2. Trả lời câu hỏi cụ thể, không viết chủ đề chung. Thay vì "Tổng quan về X", viết "Làm thế nào để X trong Y context".
3. Cite-able snippets — AI phải có thể extract nguyên đoạn làm answer:
   - Definition ngắn gọn (1-2 câu định nghĩa rõ ràng)
   - Step-by-step có đánh số (1. 2. 3.)
   - So sánh rõ ràng (A làm được X, B làm được Y)
   - Số liệu cụ thể kèm nguồn ("theo nghiên cứu của...")

PHONG CÁCH:
- Dùng "bạn" — gần gũi, trực tiếp
- Tiếng Việt tự nhiên, không bịa từ, không dịch máy
- Đoạn văn 2-4 câu, mỗi câu chứa 1 thông tin mới — không lặp ý
- Mỗi section H2: 3-5 đoạn, có 1 ví dụ cụ thể hoặc 1 bài tập thực hành

KEYWORD RULES:
- Keyword chính: 1 lần trong H1, 2-3 lần tự nhiên trong body — không nhồi nhét
- Keywords phụ: chỉ dùng khi câu văn cần, không vì SEO

TUYỆT ĐỐI KHÔNG:
- "Trong bài viết hôm nay...", "Chào mừng bạn đến...", "Như chúng ta đã biết..."
- "Tóm lại...", "Như vậy chúng ta đã thấy...", "Hy vọng bài viết..."
- "Không thể phủ nhận rằng", "Điều này vô cùng quan trọng"
- Đoạn văn dài hơn 4 câu
- Lặp lại cùng ý bằng cách diễn đạt khác
- Fluff, filler, câu không chứa thông tin mới
- Bài vượt quá 1500 từ

MỞ BÀI (tối đa 2-3 câu): 1 tình huống cụ thể HOẶC 1 câu hỏi trúng nỗi đau HOẶC 1 con số bất ngờ.
KẾT BÀI (tối đa 3 câu): 1 exercise làm ngay HOẶC 1 câu hỏi để suy nghĩ. KHÔNG tóm tắt lại bài.

ẢNH: CHỈ dùng danh sách ảnh được cung cấp. Cú pháp markdown ![alt](path). KHÔNG dùng <Image> hay HTML.

Bạn luôn trả về TOÀN BỘ bài viết — bắt đầu ngay từ frontmatter, không thêm gì trước hoặc sau.`

export function buildWriterPrompt(
  plan: ArticlePlan,
  research: ResearchResult,
  pubDate: string,
  heroImagePath: string,
  sectionImagePaths: string[],
): string {
  const r = research

  const imageList = sectionImagePaths
    .map((p, i) => `  ${i + 1}. ${p} → chèn vào giữa section H2 thứ ${i + 1}`)
    .join('\n')

  return `Viết bài SEO cho betterme.dev. Ưu tiên semantic density — AI phải extract được snippet làm answer.

═══════ BRIEF ═══════
Tiêu đề          : ${plan.title}
Keyword chính    : ${plan.primaryKeyword}
Keywords phụ     : ${plan.secondaryKeywords.join(', ')}
Outline          : ${plan.outline.join(' | ')}
Góc nhìn độc đáo : ${plan.angle}
Số từ            : 1200-1500 từ (KHÔNG vượt quá 1500)

═══════ RESEARCH ═══════
Góc nhìn đã tinh chỉnh: ${r.uniqueAngle}

Đối thủ chưa làm được:
${r.contentGaps.map((g) => `- ${g}`).join('\n')}

Dữ kiện:
${r.keyFacts.map((f) => `- ${f}`).join('\n')}

Câu hỏi thật sự của người đọc (trả lời trực tiếp từng câu):
${r.commonQuestions.map((q) => `- ${q}`).join('\n')}

Ngữ cảnh người Việt:
${r.vietnameseSpecific.map((v) => `- ${v}`).join('\n')}

Nguồn trích dẫn:
${r.authorityData.map((a) => `- ${a}`).join('\n')}

Phát triển mới (2024-2026):
${r.recentDevelopments.map((d) => `- ${d}`).join('\n')}

═══════ CẤU TRÚC MỖI SECTION H2 ═══════
Mỗi section phải có ít nhất 1 trong các dạng cite-able snippet sau:
a) Definition: 1-2 câu định nghĩa rõ ràng khái niệm chính của section
b) Step-by-step: hướng dẫn dạng "1. → 2. → 3." (có đánh số)
c) So sánh: A mang lại X, B phù hợp hơn cho Y
d) Số liệu + nguồn: "theo [nguồn], [số liệu cụ thể]"

Thêm: 1 ví dụ cụ thể hoặc 1 bài tập nhỏ người đọc làm được ngay.

════════ ẢNH CÓ SẴN (chỉ dùng những ảnh này) ═══════
Hero image (đã có trong frontmatter, không chèn lại):
  ${heroImagePath}

Section images (chèn bằng markdown):
${imageList}

- CHỈ dùng ảnh trong danh sách — KHÔNG tự bịa thêm
- Cú pháp: ![mô tả ngắn](đường-dẫn-ảnh)
- KHÔNG dùng <Image> hay HTML

═══════ FORMAT OUTPUT ═══════
Bắt đầu NGAY với frontmatter:

---
title: "${plan.title}"
description: "Meta description 150–160 ký tự, chứa keyword chính, trả lời trực tiếp intent"
pubDate: ${pubDate}
tags: [tối đa 4 tags]
keywords: [${plan.primaryKeyword}, ${plan.secondaryKeywords.join(', ')}]
readingTime: [6-8 phút]
slug: "${plan.slug}"
heroImage: "${heroImagePath}"
---

[Toàn bộ nội dung — nhớ: mỗi đoạn = 1 claim + evidence, không fluff]`
}

// ─── Image Prompt Builder ─────────────────────────────────────────────────────

const STYLE = `A flat indie illustration in risograph style with only 2 colors: dark forest green and sage green on a cream/beige background. Hand-drawn wobbly outlines, no gradients, flat fills. Zine art aesthetic, indie toolkit branding illustration.`

export function buildHeroImagePrompt(title: string, _angle: string): string {
    return `${STYLE}

Scene: A simple, clear visual metaphor for "${title}".
- One central subject that directly represents the main topic
- A few small related symbols around it
- Handwritten "Betterme" text at the bottom

Keep it minimal and meaningful. No text other than "Betterme".`
}

export function buildSectionImagePrompt(
    _title: string,
    sectionTitle: string,
    _sectionIndex: number,
    _angle: string,
): string {
    return `${STYLE}

Scene: A simple illustration of "${sectionTitle}".
- One clear subject that visually represents this concept
- Minimal background elements
- Handwritten "Betterme" text at the bottom

Keep it minimal and meaningful. No text other than "Betterme".`
}

export function buildImageGenerationPayload(
    plan: ArticlePlan,
    _research: ResearchResult,
): ImageGeneration {
    const heroPrompt = buildHeroImagePrompt(plan.title, plan.angle)

    const sectionsToIllustrate = plan.outline
        .map((section, i) => ({
            sectionTitle: section,
            prompt: buildSectionImagePrompt(plan.title, section, i, plan.angle),
            index: i,
        }))

    return {
        hero: heroPrompt,
        sections: sectionsToIllustrate,
    }
}