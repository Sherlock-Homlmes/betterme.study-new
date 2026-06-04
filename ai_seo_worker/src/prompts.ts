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

export const WRITER_SYSTEM_PROMPT = `Bạn là người viết nội dung cho betterme.dev — cộng đồng học tập và phát triển bản thân cho người Việt, hoạt động qua Discord.

PHONG CÁCH VIẾT
- Viết như đang nói chuyện với một người bạn thông minh, không phải đọc sách giáo khoa
- Dùng "bạn" để xưng hô — gần gũi, trực tiếp
- Câu văn KHÔNG đều nhau: lúc ngắn gọn, lúc dài và phân tích sâu
- Thỉnh thoảng thừa nhận sự khó khăn thật sự — không cần lúc nào cũng tích cực giả tạo
- Dùng ví dụ cụ thể từ cuộc sống người Việt — đừng lấy ví dụ nước ngoài trừ khi thực sự cần

KEYWORD RULES (quan trọng)
- Keyword chính: xuất hiện 1 lần trong H1, 2–3 lần tự nhiên trong body — KHÔNG bao giờ nhồi nhét
- Keywords phụ: chỉ dùng khi câu văn cần từ đó, không phải vì SEO
- Nếu keyword nghe gượng trong câu → paraphrase, đừng cố nhét vào

TRÁNH HOÀN TOÀN
- Mở đầu bằng: "Trong bài viết hôm nay...", "Chào mừng bạn đến..."
- Kết bài bằng: "Tóm lại...", "Như vậy chúng ta đã thấy...", "Hy vọng bài viết..."
- Cụm AI sáo rỗng: "Như chúng ta đã biết", "Không thể phủ nhận rằng", "Điều này vô cùng quan trọng"
- Bullet point dày đặc không có giải thích đi kèm
- Đoạn văn dài hơn 5 câu mà không có một insight cụ thể nào

MỞ BÀI — PHẢI làm 1 trong các cách sau:
- Kể 1 tình huống thật mà người đọc ai cũng đã từng gặp
- Đặt 1 câu hỏi đánh đúng vào nỗi đau hoặc sự tò mò của người đọc
- Đưa ra 1 con số hoặc sự thật gây bất ngờ

KẾT BÀI — PHẢI kết bằng:
- 1 exercise nhỏ người đọc có thể làm ngay hôm nay
- Hoặc 1 câu hỏi để người đọc tiếp tục suy nghĩ
- KHÔNG bao giờ tóm tắt lại bài ở phần kết

Bạn luôn trả về TOÀN BỘ bài viết — bắt đầu ngay từ frontmatter, không thêm gì trước hoặc sau.`

export function buildWriterPrompt(
  plan: ArticlePlan,
  research: ResearchResult,
  pubDate: string,
  heroImagePath: string,
): string {
  const r = research

  return `Viết bài SEO hoàn chỉnh cho betterme.dev dựa trên brief và research dưới đây.

═══════ BRIEF ═══════
Tiêu đề          : ${plan.title}
Keyword chính    : ${plan.primaryKeyword}
Keywords phụ     : ${plan.secondaryKeywords.join(', ')}
Outline          : ${plan.outline.join(' | ')}
Góc nhìn độc đáo : ${plan.angle}
Số từ mục tiêu   : ${plan.targetWordCount} từ

═══════ RESEARCH ═══════
Góc nhìn đã tinh chỉnh sau nghiên cứu: ${r.uniqueAngle}

Điểm đối thủ hiện tại chưa làm được:
${r.contentGaps.map((g) => `- ${g}`).join('\n')}

Dữ liệu và sự thật quan trọng:
${r.keyFacts.map((f) => `- ${f}`).join('\n')}

Câu hỏi thật sự của người đọc:
${r.commonQuestions.map((q) => `- ${q}`).join('\n')}

Thách thức đặc thù của người Việt với chủ đề này:
${r.vietnameseSpecific.map((v) => `- ${v}`).join('\n')}

Dữ liệu có authority để trích dẫn:
${r.authorityData.map((a) => `- ${a}`).join('\n')}

Phát triển mới nhất (2024–2026):
${r.recentDevelopments.map((d) => `- ${d}`).join('\n')}

═══════ YÊU CẦU VIẾT ═══════
1. Mỗi section H2 phải có ít nhất 1 ví dụ cụ thể hoặc 1 bài tập thực hành nhỏ người đọc làm được ngay
2. Đan xen câu ngắn với đoạn phân tích dài — đừng viết đều tăm tắp
3. Khi trích số liệu hoặc nghiên cứu → ghi nguồn tự nhiên trong câu ("theo nghiên cứu của...")
4. Viết văn xuôi là chính — bullets chỉ dùng khi thực sự phải liệt kê, không dùng để thay văn xuôi
5. Đặt 1 câu hook mở đầu mỗi H2 trước khi đi vào nội dung
6. Liên kết đến cộng đồng BetterMe hoặc công cụ (Pomodoro timer, Discord) CHỈ KHI thực sự phù hợp với nội dung — không ép

Sau khi viết xong: đọc lại từng câu — câu nào nghe như AI đã viết thì viết lại bằng tiếng người.

═══════ FORMAT OUTPUT ═══════
Bắt đầu NGAY với frontmatter, không thêm bất cứ thứ gì trước:

---
title: "${plan.title}"
description: "Meta description 150–160 ký tự — tự nhiên, hấp dẫn, chứa keyword chính"
pubDate: ${pubDate}
tags: [tối đa 4 tags liên quan]
keywords: [${plan.primaryKeyword}, ${plan.secondaryKeywords.join(', ')}]
readingTime: [số phút đọc — ${plan.targetWordCount} từ ÷ 200 = ~${Math.round(plan.targetWordCount / 200)} phút]
slug: "${plan.slug}"
heroImage: "${heroImagePath}"
---

[Toàn bộ nội dung bài viết — khi cần chèn ảnh section, dùng markdown image syntax với path /blog/image/${plan.slug}/section-N.webp]`
}

// ─── Image Prompt Builder ─────────────────────────────────────────────────────

const IMAGE_STYLE_BASE = `A flat indie illustration in risograph style with only 2 colors: dark forest green and sage green on a cream/beige background. Hand-drawn wobbly outlines, no gradients, flat fills.`

const IMAGE_STYLE_SUFFIX = `Zine art aesthetic, indie toolkit branding illustration.`

export function buildHeroImagePrompt(title: string, angle: string): string {
    return `${IMAGE_STYLE_BASE}
Character: ${buildObscureCharacter(title, angle)}
Decorators: ${buildObscureDecorators(title, angle)} Handwritten "Betterme" text below.
${IMAGE_STYLE_SUFFIX}`
}

export function buildSectionImagePrompt(
    title: string,
    sectionTitle: string,
    sectionIndex: number,
    angle: string,
): string {
    return `${IMAGE_STYLE_BASE}
Character: ${buildObscureSectionCharacter(title, sectionTitle, sectionIndex, angle)}
Decorators: ${buildObscureSectionDecorators(sectionTitle)} Handwritten "Betterme" text below.
${IMAGE_STYLE_SUFFIX}`
}

function buildObscureCharacter(title: string, angle: string): string {
    const themes = [
        `A person unlocking a hidden door in a library wall, glowing light spilling through the crack, surrounded by floating mysterious symbols related to "${title}"`,
        `A lone figure discovering a secret garden inside a cracked lightbulb, tiny plants growing from filament wires, representing the hidden potential in "${angle}"`,
        `Someone painting constellations on the ceiling of a small room, each star is a tiny icon representing an aspect of "${title}", the room is otherwise empty and quiet`,
        `A person tangled in headphones wires that gradually transform into growing vines, each vine sprouting a different symbol of "${angle}", headphones still playing`,
        `A figure pouring tea from a cup that overflows into an entire miniature landscape with tiny people doing "${title}" activities, steam forming question marks`,
    ]
    return themes[Math.abs(hashString(title)) % themes.length]
}

function buildObscureDecorators(title: string, angle: string): string {
    return `Hidden Easter eggs and micro-details related to "${title}" — tiny references that only someone deeply familiar with "${angle}" would recognize. Strange but meaningful objects scattered around the scene.`
}

function buildObscureSectionCharacter(
    title: string,
    sectionTitle: string,
    index: number,
    _angle: string,
): string {
    const poses = [
        `A person balancing on a tightrope made of intertwined "${sectionTitle}" concepts, each step revealing a hidden trap door below`,
        `Someone excavating ancient artifacts from a desk drawer, each artifact is a forgotten technique about "${sectionTitle}" covered in dust and spider webs`,
        `A figure planting seeds in geometric patterns on a rooftop at dawn, each seed labeled with a micro-concept from "${sectionTitle}", city skyline in soft background`,
        `A person deciphering a coded message written on a foggy window, the decoded text reveals an unexpected truth about "${sectionTitle}"`,
        `Someone weaving a tapestry where each thread is a different idea from "${title}", the section being woven depicts "${sectionTitle}" as an obscure mythical creature`,
        `A figure riding a paper boat down a river of open books, navigating rapids of "${sectionTitle}" challenges, tiny lighthouses guiding the way`,
    ]
    return poses[index % poses.length]
}

function buildObscureSectionDecorators(sectionTitle: string): string {
    return `Niche visual metaphors for "${sectionTitle}" — use obscure symbolism, not cliché icons. Think alchemical diagrams, cryptic botanical sketches, or astronomical charts that secretly relate to the topic.`
}

function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return hash
}

export function buildImageGenerationPayload(
    plan: ArticlePlan,
    _research: ResearchResult,
): ImageGeneration {
    const heroPrompt = buildHeroImagePrompt(plan.title, plan.angle)

    const sectionsToIllustrate = plan.outline
        .slice(0, 3)
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