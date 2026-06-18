const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');

function buildShopContainer() {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## <:emoji_294:1516712949694332928> Shop Boosters')
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            '<:emoji_295:1516713823552278598> **Booster Classique** — `1 000` coins — Idéal pour débuter sa collection\n' +
            '<:emoji_296:1516713844985036891> **Booster Premium** — `10 000` coins — Contient souvent de bonnes cartes\n' +
            '<:emoji_297:1516713877662863522> **Booster Légendaire** — `50 000` coins — Le top du top pour les collectionneurs'
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
