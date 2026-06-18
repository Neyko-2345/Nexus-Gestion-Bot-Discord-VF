const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require('discord.js');

const ALL_CATEGORIES = [
    { key: 'antiraid',    label: '🛡️ Anti-Raid',     cats: ['antiraid'] },
    { key: 'moderation',  label: '🔨 Modération',     cats: ['moderation'] },
    { key: 'gestion',     label: '⚙️ Gestion',        cats: ['gestion'] },
    { key: 'logs',        label: '📋 Logs',            cats: ['logs'] },
    { key: 'utilitaire',  label: '🔧 Utilitaires',    cats: ['utilitaire'] },
    { key: 'botcontrol',  label: '🤖 Bot Control',    cats: ['bot gestion', 'botcontrol'] },
    { key: 'coin',        label: '💰 Bot Coin',        cats: ['coin'] },
    { key: 'film',        label: '🎬 Bot Film',        cats: ['film'] },
];

const ITEMS_PER_PAGE = 10;

function buildPagedEmbed(cmds, prefix, color, footer, title) {
    const chunks = [];
    let current = [];
    cmds.forEach(c => {
        const usageLines = (c.usage || []).map(u => `  \`${prefix}${u}\``).join('\n');
        const aliasLine  = c.aliases?.length ? `*Alias : ${c.aliases.map(a => `\`${prefix}${a}\``).join(', ')}*` : '';
        let entry = `**\`${prefix}${c.name}\`** — ${c.description || 'Aucune description.'}`;
        if (usageLines) entry += `\n${usageLines}`;
        if (aliasLine)  entry += `\n${aliasLine}`;
        current.push(entry);
        if (current.length >= ITEMS_PER_PAGE) { chunks.push(current); current = []; }
    });
    if (current.length > 0) chunks.push(current);
    if (chunks.length === 0) chunks.push(['Aucune commande dans cette catégorie.']);
    return chunks.map((ch, i) => new Discord.EmbedBuilder()
        .setTitle(`${title}${chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : ''}`)
        .setDescription(`*<> = obligatoire, [] = facultatif*\n\n${ch.join('\n\n')}`)
        .setColor(color)
    );
}

module.exports = {
    name: 'interactionCreate',
    run: async (client, interaction) => {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
        if (
            interaction.customId !== 'helpall_cat_select' &&
            !interaction.customId.startsWith('helpall_prev_') &&
            !interaction.customId.startsWith('helpall_next_') &&
            !interaction.customId.startsWith('helpall_back_')
        ) return;

        const color = client.db.get(`color_${interaction.guildId}`) || client.color;
        const prefix = client.db.get(`prefix_${interaction.guildId}`) || client.prefix;
        const footer = client.footer;

        const authorId = client.db.get(`helpall_author_${interaction.guildId}_${interaction.message.id}`);
        if (authorId && authorId !== interaction.user.id) {
            return interaction.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
        }

        // Bouton retour au menu principal
        if (interaction.customId.startsWith('helpall_back_')) {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('helpall_cat_select')
                    .setPlaceholder('Sélectionner une catégorie...')
                    .addOptions(ALL_CATEGORIES.map(c => ({ label: c.label, value: c.key })))
            );
            const embed = new Discord.EmbedBuilder()
                .setTitle('📖 NΞXUS — Aide complète (Owners)')
                .setDescription(
                    `Sélectionnez une catégorie pour voir toutes les commandes avec leur description.\n\n` +
                    ALL_CATEGORIES.map(c => `**${c.label}**`).join('\n')
                )
                .setColor(color);
            return interaction.update(v2({ embeds: [embed], components: [row] }));
        }

        // Sélection de catégorie
        if (interaction.customId === 'helpall_cat_select') {
            const key = interaction.values[0];
            const cat = ALL_CATEGORIES.find(c => c.key === key);
            if (!cat) return;

            const cmds = client.commands.filter(c => cat.cats.includes(c.category));
            const pages = buildPagedEmbed(cmds, prefix, color, footer, cat.label);
            let page = 0;

            const buildRow = (p) => {
                const btns = [new ButtonBuilder().setCustomId(`helpall_back_${key}`).setLabel('↩ Retour').setStyle(Discord.ButtonStyle.Secondary)];
                if (pages.length > 1) {
                    btns.push(new ButtonBuilder().setCustomId(`helpall_prev_${key}`).setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0));
                    btns.push(new ButtonBuilder().setCustomId(`helpall_next_${key}`).setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= pages.length - 1));
                }
                return new ActionRowBuilder().addComponents(btns);
            };

            await interaction.update(v2({ embeds: [pages[0]], components: [buildRow(0)] }));

            // Stop existing collector on this message to prevent double-execution
            const msgId = interaction.message.id;
            if (!client._helpallCollectors) client._helpallCollectors = new Map();
            if (client._helpallCollectors.has(msgId)) client._helpallCollectors.get(msgId).stop('replaced');

            const col = interaction.message.createMessageComponentCollector({ filter: i => !authorId || i.user.id === authorId, time: 120000 });
            client._helpallCollectors.set(msgId, col);

            col.on('collect', async i => {
                if (authorId && i.user.id !== authorId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
                if (i.customId.startsWith('helpall_back_')) {
                    col.stop();
                    const backRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('helpall_cat_select')
                            .setPlaceholder('Sélectionner une catégorie...')
                            .addOptions(ALL_CATEGORIES.map(c => ({ label: c.label, value: c.key })))
                    );
                    const backEmbed = new Discord.EmbedBuilder()
                        .setTitle('📖 NΞXUS — Aide complète (Owners)')
                        .setDescription(
                            `Sélectionnez une catégorie pour voir toutes les commandes avec leur description.\n\n` +
                            ALL_CATEGORIES.map(c => `**${c.label}**`).join('\n')
                        )
                        .setColor(color);
                    return i.update(v2({ embeds: [backEmbed], components: [backRow] }));
                }
                if (i.customId.startsWith('helpall_prev_')) page = Math.max(0, page - 1);
                if (i.customId.startsWith('helpall_next_')) page = Math.min(pages.length - 1, page + 1);
                await i.update(v2({ embeds: [pages[page]], components: [buildRow(page)] }));
            });
            col.on('end', (_, reason) => {
                client._helpallCollectors?.delete(msgId);
                if (reason !== 'replaced') interaction.message.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
