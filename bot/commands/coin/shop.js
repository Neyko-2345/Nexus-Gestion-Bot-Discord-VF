const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const DEFAULT_SHOP = [
    { name: 'Wagon', emoji: '🚂', price: 200, description: 'Permet de miner des minerais (3 charges / 15min)', type: 'wagon' },
    { name: 'Entreprise', emoji: '🏢', price: 10000, description: "Créez votre propre entreprise et engagez des employés", type: 'entreprise' },
];

module.exports = {
    name: "shop",
    aliases: ["boutique", "magasin"],
    description: "Affiche le shop et permet d'acheter des articles",
    category: "coin",
    usage: ["shop"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const shopItems = client.db.get(`shop_items_${guildId}`) || DEFAULT_SHOP;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        if (shopItems.length === 0) return message.reply(`Le shop est vide pour l'instant.`);

        const ITEMS_PER_PAGE = 5;
        const pages = [];
        for (let i = 0; i < shopItems.length; i += ITEMS_PER_PAGE) {
            pages.push(shopItems.slice(i, i + ITEMS_PER_PAGE));
        }

        let page = 0;
        const buildEmbed = (p) => {
            const embed = new Discord.EmbedBuilder()
                .setTitle(`🛒 Shop${pages.length > 1 ? ` — page ${p+1}/${pages.length}` : ''}`)
                .setColor('#F1C40F').setTimestamp();
            pages[p].forEach(item => {
                embed.addFields({ name: `${item.emoji} ${item.name} — ${item.price} ${coinEmoji}`, value: item.description, inline: false });
            });
            return embed;
        };
        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('shop_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('shop_buy').setLabel('🛒 Acheter').setStyle(Discord.ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('shop_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= pages.length - 1)
        );

        const msg = await message.channel.send(v2({ embeds: [buildEmbed(0)], components: [buildRow(0)] }));
        const col = msg.createMessageComponentCollector({ time: 60000 });
        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'shop_prev') { page = Math.max(0, page - 1); await i.update(v2({ embeds: [buildEmbed(page)], components: [buildRow(page)] })); }
            if (i.customId === 'shop_next') { page = Math.min(pages.length - 1, page + 1); await i.update(v2({ embeds: [buildEmbed(page)], components: [buildRow(page)] })); }
            if (i.customId === 'shop_buy') {
                await i.reply({ content: `Pour acheter, utilisez \`${prefix}buy <nom_article>\``, ephemeral: true });
            }
        });
        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
