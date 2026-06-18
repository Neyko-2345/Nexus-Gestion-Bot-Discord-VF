const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const LOG_CHANNEL_ID    = '1508451206446579874';
const TICKET_CHANNEL_ID = '1508483886026457179';

module.exports = {
    name: "convertshop",
    aliases: ["cshop", "celestialshop"],
    description: "Shop spécial — achats avec des Pièces Célestes uniquement",
    category: "coin",
    usage: ["convertshop"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId        = message.guild.id;
        const userId         = message.author.id;
        const items          = client.db.get(`convertshop_items_${guildId}`) || [];
        const celestialEmoji = client.db.get(`celestial_emoji_${guildId}`) || '<:emoji_283:1515365679698673857>';
        const celestialName  = client.db.get(`celestial_name_${guildId}`)  || 'Pièce Céleste';

        if (items.length === 0) {
            return message.reply(`Le ${celestialName} Shop est vide. Les owners peuvent ajouter des items avec \`${prefix}items addc <emoji> <nom> <prix>\`.`);
        }

        const getUserCelestial = () => client.db.get(`coin_celestial_${userId}_${guildId}`) || 0;

        const pages = [];
        for (let i = 0; i < items.length; i += 5) pages.push(items.slice(i, i + 5));
        let page = 0;

        const buildEmbed = (p) => new Discord.EmbedBuilder()
            .setTitle(`${celestialEmoji} ${celestialName} Shop`)
            .setColor('#FFD700')
            .setDescription(
                `Votre solde : **${getUserCelestial()} ${celestialEmoji}**\n\n` +
                pages[p].map((item, i) =>
                    `**${p * 5 + i + 1}.** ${item.emoji ? item.emoji + ' ' : ''}**${item.name}** — ${item.price} ${celestialEmoji}` +
                    (item.description ? `\n*${item.description}*` : '')
                ).join('\n\n')
            );

        const buildRow = (p) => {
            const buttons = [];
            if (p > 0) buttons.push(new ButtonBuilder().setCustomId('cshop_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary));
            pages[p].forEach((item, i) => buttons.push(
                new ButtonBuilder()
                    .setCustomId(`cshop_buy_${p * 5 + i}`)
                    .setLabel(`Acheter #${p * 5 + i + 1}`)
                    .setStyle(Discord.ButtonStyle.Primary)
            ));
            if (p < pages.length - 1) buttons.push(new ButtonBuilder().setCustomId('cshop_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary));
            const rows = [];
            for (let i = 0; i < buttons.length; i += 5) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
            return rows;
        };

        const msg = await message.channel.send(v2({ embeds: [buildEmbed(page)], components: buildRow(page) }));
        const col = msg.createMessageComponentCollector({ time: 120000 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce shop ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'cshop_prev') { page--; return i.update(v2({ embeds: [buildEmbed(page)], components: buildRow(page) })); }
            if (i.customId === 'cshop_next') { page++; return i.update(v2({ embeds: [buildEmbed(page)], components: buildRow(page) })); }

            if (i.customId.startsWith('cshop_buy_')) {
                const idx  = parseInt(i.customId.split('_')[2]);
                const item = items[idx];
                if (!item) return i.reply({ content: 'Item introuvable.', ephemeral: true });

                const current = getUserCelestial();
                if (current < item.price) {
                    return i.reply({
                        content: `❌ Pas assez de ${celestialEmoji}. Il vous faut **${item.price}** et vous en avez **${current}**.`,
                        ephemeral: true
                    });
                }

                client.db.subtract(`coin_celestial_${userId}_${guildId}`, item.price);

                // ── Log vers le salon owner ──
                const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    logChannel.send(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('🛒 Achat ConvertShop')
                        .setColor('#F1C40F').setTimestamp()
                        .setDescription(
                            `👤 **Acheteur :** ${i.user} (\`${i.user.tag}\`)\n` +
                            `📦 **Item :** ${item.emoji ? item.emoji + ' ' : ''}**${item.name}**\n` +
                            `💰 **Prix :** ${item.price} ${celestialEmoji}\n` +
                            `📩 L'utilisateur a été invité à ouvrir un ticket.`
                        )
                    ]})).catch(() => {});
                }

                return i.reply(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('✅ Achat confirmé !')
                    .setColor('#57F287').setTimestamp()
                    .setDescription(
                        `${item.emoji ? item.emoji + ' ' : ''}**${item.name}** acheté pour **${item.price} ${celestialEmoji}** !\n\n` +
                        `📩 **Ouvrez un ticket <#${TICKET_CHANNEL_ID}> pour récupérer votre item !**`
                    )
                ], ephemeral: true }));
            }
        });

        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
