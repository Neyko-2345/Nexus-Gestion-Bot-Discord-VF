const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const DEFAULT_TSHOP = [
    {
        name: 'Troupe Standard',
        emoji: '⚔️',
        price: 500,
        description: 'Soldat de base pour votre armée.',
        type: 'army',
        power: 1,
        amount: 1,
    },
    {
        name: 'Troupe Élite',
        emoji: '🛡️',
        price: 2000,
        description: 'Soldat d\'élite très redoutable.',
        type: 'army',
        power: 5,
        amount: 1,
    },
    {
        name: 'Pack Troupes x10',
        emoji: '⚔️',
        price: 4000,
        description: '10 troupes standard en un seul achat.',
        type: 'army',
        power: 1,
        amount: 10,
    },
    {
        name: 'Pack Élites x5',
        emoji: '🛡️',
        price: 8000,
        description: '5 troupes élites en un seul achat.',
        type: 'army',
        power: 5,
        amount: 5,
    },
    {
        name: 'Bouclier 24h',
        emoji: '🔒',
        price: 5000,
        description: 'Protège votre team contre les attaques pendant 24h.',
        type: 'shield',
        duration: 86400000,
    },
    {
        name: 'Bouclier 72h',
        emoji: '🔒',
        price: 12000,
        description: 'Protège votre team contre les attaques pendant 72h.',
        type: 'shield',
        duration: 259200000,
    },
];

module.exports = {
    name: "tshop",
    aliases: ["teamshop", "shopteam"],
    description: "Affiche le shop d'équipe (troupes, boucliers, améliorations)",
    category: "coin",
    usage: ["tshop"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const teams = client.db.get(`teams_${guildId}`) || [];
        const team  = teams.find(t => (t.members || []).includes(userId) || t.founder === userId);
        if (!team) return message.reply(`❌ Vous n'êtes dans aucune team. Créez-en une avec \`${prefix}tcreate <nom>\`.`);

        const items = client.db.get(`tshop_items_${guildId}`) || DEFAULT_TSHOP;
        const ITEMS_PER_PAGE = 4;
        const chunks = [];
        for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) chunks.push(items.slice(i, i + ITEMS_PER_PAGE));

        const buildEmbed = (page) => {
            const chunk = chunks[page] || [];
            const bank  = team.bank || 0;
            const army  = team.army || 0;
            const rep   = team.rep  || 0;

            const itemLines = chunk.map((item, i) => {
                const idx = page * ITEMS_PER_PAGE + i + 1;
                let extra = '';
                if (item.type === 'army')   extra = ` — Puissance : +${(item.power || 1) * (item.amount || 1)}`;
                if (item.type === 'shield') extra = ` — Durée : ${Math.floor(item.duration / 3600000)}h`;
                return (
                    `**${idx}. ${item.emoji || '🛒'} ${item.name}** — ${item.price} ${coinEmoji}${extra}\n` +
                    `> ${item.description}\n` +
                    `> Acheter : \`${prefix}tbuy ${item.name}\``
                );
            });

            return new Discord.EmbedBuilder()
                .setTitle(`🛒 Shop d'Équipe — ${team.name}`)
                .setDescription(
                    `💰 **Banque :** ${bank} ${coinEmoji} | ⭐ **Rép :** ${rep} | ⚔️ **Armée :** ${army} troupes\n` +
                    `*Achetez avec la banque de votre team : \`${prefix}tbuy <article>\`*\n\n` +
                    itemLines.join('\n\n')
                )
                .setColor('#FEE75C')
                
                .setTimestamp();
        };

        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tshop_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('tshop_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= chunks.length - 1)
        );

        if (chunks.length === 1) {
            return message.channel.send({ embeds: [buildEmbed(0)] });
        }

        let page = 0;
        const msg = await message.channel.send(v2({ embeds: [buildEmbed(0)], components: [buildRow(0)] }));
        const col = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 120000 });
        col.on('collect', async i => {
            if (i.customId === 'tshop_prev') page = Math.max(0, page - 1);
            if (i.customId === 'tshop_next') page = Math.min(chunks.length - 1, page + 1);
            await i.update(v2({ embeds: [buildEmbed(page)], components: [buildRow(page)] }));
        });
        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
