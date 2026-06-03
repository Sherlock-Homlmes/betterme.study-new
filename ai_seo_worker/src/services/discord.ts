import type { ArticleResult } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscordEmbed {
    title: string
    description?: string
    color: number
    fields: { name: string; value: string; inline?: boolean }[]
    timestamp: string
    footer?: { text: string }
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR_SUCCESS = 0x00b894  // green
const COLOR_PARTIAL = 0xfdcb6e  // yellow
const COLOR_FAIL = 0xe17055  // red

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function notifyDiscord(
    webhookUrl: string,
    results: ArticleResult[],
    triggeredAt: string,
): Promise<void> {
    const success = results.filter((r) => r.success)
    const skipped = results.filter((r) => r.skipped)
    const failed = results.filter((r) => !r.success && !r.skipped)

    const color =
        failed.length === results.length
            ? COLOR_FAIL
            : success.length === 0
                ? COLOR_PARTIAL
                : COLOR_SUCCESS

    const fields: DiscordEmbed['fields'] = []

    // Published
    fields.push({
        name: `✅ Đã xuất bản (${success.length})`,
        value:
            success.length > 0
                ? success
                    .map(
                        (r) =>
                            `**${r.plan.title}**\n└ \`${r.plan.primaryKeyword}\` · ${r.plan.targetWordCount} từ`,
                    )
                    .join('\n\n')
                : '_Không có bài nào_',
    })

    // Skipped
    if (skipped.length > 0) {
        fields.push({
            name: `⏭️ Bỏ qua — trùng lặp (${skipped.length})`,
            value: skipped.map((r) => `• ${r.plan.title}\n  └ ${r.skipReason}`).join('\n'),
        })
    }

    // Failed
    if (failed.length > 0) {
        fields.push({
            name: `❌ Lỗi (${failed.length})`,
            value: failed
                .map((r) => `• ${r.plan.title}\n  └ \`${r.error ?? 'unknown'}\``)
                .join('\n'),
        })
    }

    // Summary
    fields.push({
        name: '📊 Tổng kết',
        value: [
            `Xuất bản: **${success.length}**`,
            `Bỏ qua: **${skipped.length}**`,
            `Lỗi: **${failed.length}**`,
        ].join('  ·  '),
        inline: false,
    })

    const embed: DiscordEmbed = {
        title: '🤖 BetterMe SEO — Báo cáo nội dung hàng ngày',
        description: success.length > 0
            ? 'Content đã được lưu vào R2. Hãy vào dashboard để review và publish lên Astro nhé!'
            : 'Hôm nay không có bài nào được xuất bản.',
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `Trigger lúc: ${triggeredAt}` },
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
    })

    if (!res.ok) {
        console.error('Discord webhook failed:', res.status, await res.text())
    }
}