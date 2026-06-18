const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');

const COIN_SUBCATS = [
    { key: 'coin_eco',        label: '💰 Économie',                                    optLabel: 'Économie',       optEmoji: { name: '💰' },                               names: ['balance','deposit','withdraw','pay','daily','work','profile','top','convert','drop','rob','rep','reset','coinreset'] },
    { key: 'coin_casino',     label: '🎰 Casino/Jeux',                                 optLabel: 'Casino/Jeux',    optEmoji: { name: '🎰' },                               names: ['casino','slots','blackjack','pfc','crash'] },
    { key: 'coin_mine',       label: '⛏️ Mine',                                        optLabel: 'Mine',           optEmoji: { name: '⛏️' },                               names: ['mine','minerais','sellminerais'] },
    { key: 'coin_shop',       label: '🛒 Shop',                                        optLabel: 'Shop',           optEmoji: { name: '🛒' },                               names: ['shop','buy','convertshop'] },
    { key: 'coin_alliance',   label: '⚔️ Alliance/Teams',                              optLabel: 'Alliance/Teams', optEmoji: { name: '⚔️' },                               names: ['tcreate','tdelete','tinfos','tinvite','tkick','tleave','tpromote','tdemote','tdep','twith','tbuy','tshop','tarmy','tarmysend','tattack','ttop','tedit','trep','tguide','tconfig'] },
    { key: 'coin_entreprise', label: '🏢 Entreprise',                                  optLabel: 'Entreprise',     optEmoji: { name: '🏢' },                               names: ['entreprise','licencier','recruter','entreprisedelete','empedit','entnotif'] },
    { key: 'coin_illegal',    label: '<:green_weed:1514405349837246545> Illégal',       optLabel: 'Illégal',        optEmoji: { name: 'green_weed', id: '1514405349837246545' }, names: ['mobil','recolt'] },
];

const CARTE_SUBCATS = [
    { key: 'carte_main', label: '<:icontb:1516711894122237962> Cartes', optLabel: 'Cartes', optEmoji: { name: 'icontb', id: '1516711894122237962' }, names: ['booster','inventaire','collection'] },
];

const ALL_SUBCATS = [...COIN_SUBCATS, ...CARTE_SUBCATS];

const YELLOW = '#F1C40F';

function buildPagedEmbed(cmds, prefix, title) {
    const ITEMS_PER_PAGE = 10;
    const chunks = [];
    let current = [];
    cmds.forEach(c => {
        current.push(`\`${prefix}${c.name}\`\n${c.description || 'Aucune description.'}`);
        if (current.length >= ITEMS_PER_PAGE) { chunks.push(current); current = []; }
    });
    if (current.length > 0) chunks.push(current);
    if (chunks.length === 0) chunks.push(['Aucune commande disponible.']);
    return chunks.map((ch, i) => new Discord.EmbedBuilder()
        .setTitle(`${title}${chunks.length > 1 ? ` — page ${i + 1}/${chunks.length}` : ''}`)
        .setDescription(`*<> = obligatoire, [] = facultatif*\n\n${ch.join('\n\n')}`)
        .setColor(YELLOW)
    );
}

function buildMainMenu(prefix) {
    const select = new StringSelectMenuBuilder()
        .setCustomId('help_coin_sub_select')
        .setPlaceholder('Choisir une catégorie...')
        .addOptions(ALL_SUBCATS.map(s => {
            const opt = { label: s.optLabel, value: s.key };
            if (s.optEmoji) opt.emoji = s.optEmoji;
            return opt;
        }));
    const embed = new Discord.EmbedBuilder()
        .setTitle('💰 Bot Coin — Aide')
        .setDescription(
            `Sélectionnez une catégorie dans le menu ci-dessous.\n\n` +
            ALL_SUBCATS.map(s => `**${s.label}**`).join('\n') +
            `\n\n*\`${prefix}help [commande]\` pour les détails d'une commande*`
        )
        .setColor(YELLOW);
    return { embed, components: [new ActionRowBuilder().addComponents(select)] };
}

module.exports = {
    name: 'interactionCreate',
    run: async (client, interaction) => {
        if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
        if (interaction.customId !== 'help_coin_sub_select'
            && interaction.customId !== 'hp_back_coin'
            && interaction.customId !== 'hp_prev'
            && interaction.customId !== 'hp_next') return;

        const prefix   = client.db.get(`prefix_${interaction.guildId}`) || client.prefix;
        const authorId = client.db.get(`help_author_${interaction.guildId}_${interaction.message.id}`);

        if (authorId && authorId !== interaction.user.id) {
            return interaction.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
        }

        if (interaction.customId === 'hp_back_coin') {
            const { embed, components } = buildMainMenu(prefix);
            return interaction.update(v2({ embeds: [embed], components }));
        }

        if (interaction.customId === 'help_coin_sub_select') {
            const key    = interaction.values[0];
            const subcat = ALL_SUBCATS.find(s => s.key === key);
            if (!subcat) return;

            const cmds  = client.commands.filter(c => subcat.names.includes(c.name));
            const pages = buildPagedEmbed(cmds, prefix, subcat.label);
            let page    = 0;

            const buildPageRow = (p) => {
                const btns = [new ButtonBuilder().setCustomId('hp_back_coin').setLabel('↩ Retour').setStyle(Discord.ButtonStyle.Secondary)];
                if (pages.length > 1) {
                    btns.push(new ButtonBuilder().setCustomId('hp_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0));
                    btns.push(new ButtonBuilder().setCustomId('hp_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= pages.length - 1));
                }
                return new ActionRowBuilder().addComponents(btns);
            };

            await interaction.update(v2({ embeds: [pages[0]], components: [buildPageRow(0)] }));

            const msgId = interaction.message.id;
            if (!client._helpCollectors) client._helpCollectors = new Map();
            if (client._helpCollectors.has(msgId)) client._helpCollectors.get(msgId).stop('replaced');

            const col = interaction.message.createMessageComponentCollector({ filter: i => i.user.id === (authorId || i.user.id), time: 120000 });
            client._helpCollectors.set(msgId, col);

            col.on('collect', async i => {
                if (authorId && i.user.id !== authorId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
                if (i.customId === 'hp_back_coin') {
                    col.stop();
                    const { embed, components } = buildMainMenu(prefix);
                    return i.update(v2({ embeds: [embed], components }));
                }
                if (i.customId === 'hp_prev') page = Math.max(0, page - 1);
                if (i.customId === 'hp_next') page = Math.min(pages.length - 1, page + 1);
                await i.update(v2({ embeds: [pages[page]], components: [buildPageRow(page)] }));
            });
            col.on('end', (_, reason) => {
                client._helpCollectors?.delete(msgId);
                if (reason !== 'replaced') interaction.message.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
