const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MessageFlags,
} = require('discord.js');

/**
 * Converts { embeds: [...], components: [...] } message options into Components V2.
 * - Thumbnail displayed as section accessory (small corner image, NOT a full gallery image)
 * - Visual separator added after the title when present
 * Preserves all other properties (ephemeral, content, allowedMentions, fetchReply, etc.)
 *
 * Usage:
 *   channel.send(v2({ embeds: [embed], components: [row] }))
 *   interaction.reply(v2({ embeds: [embed], components: [row], ephemeral: true }))
 */
function v2(opts) {
    const { embeds, components = [], flags: existingFlags = 0, ephemeral, ...rest } = opts;
    const ephemeralFlag = ephemeral ? MessageFlags.Ephemeral : 0;

    if (!embeds || !embeds.length) return opts;

    const embed = embeds[0];
    const data  = (embed && embed.data) ? embed.data : {};

    const container = new ContainerBuilder();
    if (data.color != null) container.setAccentColor(data.color);

    const hasTitle = !!(data.author?.name || data.title);

    // ── Title section (with optional thumbnail accessory) ──
    if (hasTitle) {
        const titleLines = [];
        if (data.author?.name) titleLines.push(`-# ${data.author.name}`);
        if (data.title)        titleLines.push(`## ${data.title}`);
        const titleContent = titleLines.join('\n') || '\u200b';

        if (data.thumbnail?.url) {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(titleContent))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(data.thumbnail.url))
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(titleContent)
            );
        }

        // Visual separator after title
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
    }

    // ── Body (description + fields) ──
    const bodyLines = [];
    if (data.description) bodyLines.push(data.description);

    if (data.fields?.length) {
        for (const f of data.fields) {
            bodyLines.push(`\n**${f.name}**\n${f.value}`);
        }
    }

    if (bodyLines.length > 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(bodyLines.join('\n'))
        );
    } else if (!hasTitle) {
        // Empty embed — keep a placeholder so the message is never empty
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('\u200b')
        );
    }

    // ── Image (large gallery image — thumbnail is handled separately above) ──
    if (data.image?.url) {
        const mg = new MediaGalleryBuilder();
        mg.addItems(new MediaGalleryItemBuilder().setURL(data.image.url));
        container.addMediaGalleryComponents(mg);
    }

    // ── Action rows ──
    const activeRows = components.filter(r => r && r.components && r.components.length > 0);
    if (activeRows.length) {
        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
        );
        for (const row of activeRows) {
            container.addActionRowComponents(row);
        }
    }

    return {
        ...rest,
        components: [container],
        flags: existingFlags | ephemeralFlag | MessageFlags.IsComponentsV2,
    };
}

module.exports = { v2 };
