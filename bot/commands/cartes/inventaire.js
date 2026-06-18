const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');

function buildInvContainer(userId, boosters, username) {
    const total = (boosters.classique || 0) + (boosters.premium || 0) + (boosters.legendaire || 0);

    if (total === 0) return null;

    const lines = [];
    if (boosters.classique > 0)  lines.push(`<:emoji_295:1516713823552278598> **Booster Classique** — x${boosters.classique}`);
    if (boosters.premium > 0)    lines.push(`<:emoji_296:1516713844985036891> **Booster Premium** — x${boosters.premium}`);
    if (boosters.legendaire > 0) lines.push(`<:emoji_297:1516713877662863522> **Booster Légendaire** — x${boosters.legendaire}`);

    const container = new ContainerBuilder().setAccentColor(0xF1C40F);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## <:icontb:1516711894122237962> Inventaire de ${username}`)
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines.join('\n'))
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );

    const btns = [];
    if (boosters.classique  > 0) btns.push(new ButtonBuilder().setCustomId(`inv_open_c_${userId}`).setLabel('Ouvrir Classique').setStyle(ButtonStyle.Secondary));
    if (boosters.premium    > 0) btns.push(new ButtonBuilder().setCustomId(`inv_open_p_${userId}`).setLabel('Ouvrir Premium').setStyle(ButtonStyle.Primary));
    if (boosters.legendaire > 0) btns.push(new ButtonBuilder().setCustomId(`inv_open_l_${userId}`).setLabel('Ouvrir Légendaire').setStyle(ButtonStyle.Danger));

    container.addActionRowComponents(new ActionRowBuilder().addComponents(...btns));
    return container;
}

module.exports = {
    name: 'inventaire',
    aliases: ['inv'],
    description: 'Voir et ouvrir tes boosters',
    category: 'cartes',
    usage: ['inventaire'],

    run: async (client, message) => {
        const userId   = message.author.id;
        const username = message.author.username;
        const boosters = client.db.get(`boosters_${userId}`) || { classique: 0, premium: 0, legendaire: 0 };

        const total = (boosters.classique || 0) + (boosters.premium || 0) + (boosters.legendaire || 0);

        if (total === 0) {
            const c = new ContainerBuilder().setAccentColor(0xF1C40F);
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Tu n\'as aucun booster ! Achètes-en un avec `&booster`.'));
            return message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        const container = buildInvContainer(userId, boosters, username);
        await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
