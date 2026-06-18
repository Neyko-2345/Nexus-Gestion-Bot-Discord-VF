const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');

function getUniqueCards(collection) {
    const map = new Map();
    for (const card of collection) {
        const key = `${card.nom}|${card.image}|${card.valeur}`;
        if (map.has(key)) map.get(key).count++;
        else map.set(key, { ...card, count: 1 });
    }
    return [...map.values()];
}

function buildColContainer(collection, page, userId, username) {
    const unique     = getUniqueCards(collection);
    const total      = collection.length;
    const totalValue = collection.reduce((s, c) => s + c.valeur, 0);
    const safePage   = Math.max(0, Math.min(page, unique.length - 1));
    const card       = unique[safePage];

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 📦 Collection de ${username}`)
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Total de cartes** : \`${total}\` <:icontb:1516711894122237962>\n` +
            `**Valeur totale** : \`${totalValue}\` <:coin:1510618513876717709>`
        )
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const countStr = card.count > 1 ? ` — x${card.count}` : '';
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${card.nom}**${countStr}\n**Valeur** : \`${card.valeur}\` <:coin:1510618513876717709>`
        )
    );
    const mg = new MediaGalleryBuilder();
    mg.addItems(new MediaGalleryItemBuilder().setURL(card.image));
    container.addMediaGalleryComponents(mg);

    const prevBtn = new ButtonBuilder().setCustomId(`col_prev_${userId}`).setLabel('⬅️ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(safePage === 0);
    const nextBtn = new ButtonBuilder().setCustomId(`col_next_${userId}`).setLabel('Suivant ➡️').setStyle(ButtonStyle.Secondary).setDisabled(safePage >= unique.length - 1);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(prevBtn, nextBtn));

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    );

    const sellAllBtn = new ButtonBuilder().setCustomId(`col_sell_all_${userId}`).setLabel('🗑️ Tout vendre').setStyle(ButtonStyle.Danger);
    const sell1Btn   = new ButtonBuilder().setCustomId(`col_sell_1_${userId}`).setLabel('💰 Vendre 1').setStyle(ButtonStyle.Success);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(sellAllBtn, sell1Btn));

    return container;
}

module.exports = {
    name: 'collection',
    aliases: ['col'],
    description: 'Voir et vendre ta collection de cartes',
    category: 'cartes',
    usage: ['collection'],

    run: async (client, message) => {
        const userId     = message.author.id;
        const username   = message.author.username;
        const collection = client.db.get(`collection_${userId}`) || [];

        if (collection.length === 0) {
            const c = new ContainerBuilder();
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Ta collection est vide ! Commence par acheter un booster avec `&booster`.'));
            return message.channel.send({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        client.db.set(`col_page_${userId}`, 0);

        const container = buildColContainer(collection, 0, userId, username);
        const msg = await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        client.db.set(`col_main_msg_${userId}`, { channelId: message.channel.id, messageId: msg.id, username });
    },
};
