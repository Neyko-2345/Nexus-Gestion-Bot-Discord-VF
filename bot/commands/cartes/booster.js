const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

const PRICES_PATH    = path.join(__dirname, '../../data/boosterPrices.json');
const DEFAULT_PRICES = { classique: 1000, premium: 10000, legendaire: 50000 };

function getPrices() {
    try { return JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8')); }
    catch { return { ...DEFAULT_PRICES }; }
}

function fmt(n) { return n.toLocaleString('fr-FR'); }

function buildShopContainer() {
    const prices = getPrices();
    const container = new ContainerBuilder().setAccentColor(0xF1C40F);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## <:emoji_294:1516712949694332928> Shop Boosters')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `<:emoji_295:1516713823552278598> **Booster Classique** — \`${fmt(prices.classique)}\` coins — Idéal pour débuter sa collection\n` +
            `<:emoji_296:1516713844985036891> **Booster Premium** — \`${fmt(prices.premium)}\` coins — Contient souvent de bonnes cartes\n` +
            `<:emoji_297:1516713877662863522> **Booster Légendaire** — \`${fmt(prices.legendaire)}\` coins — Le top du top pour les collectionneurs`
        )
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bp_buy_c').setLabel('Acheter Classique').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('bp_buy_p').setLabel('Acheter Premium').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('bp_buy_l').setLabel('Acheter Légendaire').setStyle(ButtonStyle.Danger),
    );
    container.addActionRowComponents(row);
    return container;
}

module.exports = {
    name: 'booster',
    description: 'Ouvre le shop de boosters de cartes',
    category: 'cartes',
    usage: ['booster'],

    run: async (client, message) => {
        const container = buildShopContainer();
        await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
