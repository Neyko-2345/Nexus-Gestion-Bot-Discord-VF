const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const ITEMS = 5;

module.exports = {
    name: "ttop",
    aliases: ["teamtop", "teamleaderboard"],
    description: "Affiche le classement des teams par réputation",
    category: "coin",
    usage: ["ttop"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];
        if (teams.length === 0) return message.reply(`Aucune team sur ce serveur.`);

        const sorted   = [...teams].sort((a, b) => (b.rep || 0) - (a.rep || 0));
        const maxPages = Math.ceil(sorted.length / ITEMS);
        const medals   = ['🥇', '🥈', '🥉'];

        const buildPage = (page) => {
            const start = page * ITEMS;
            const slice = sorted.slice(start, start + ITEMS);

            const lines = slice.map((t, i) => {
                const rank    = start + i;
                const medal   = medals[rank] || `**#${rank + 1}**`;
                const members = t.members || [];

                // Utilise le founder/coFounders/ranks (structure correcte)
                const coFounders   = t.coFounders || [];
                const regularMembers = members.filter(id => id !== t.founder && !coFounders.includes(id));

                let line = `${medal} **${t.name}** — ⭐ **${t.rep || 0}** rép | 💰 ${t.bank || 0} ${coinEmoji} | ⚔️ ${t.army || 0} troupes\n`;
                line += `> 👑 Fondateur : <@${t.founder}>\n`;
                if (coFounders.length > 0)      line += `> ⚜️ Co-fond. : ${coFounders.map(id => `<@${id}>`).join(', ')}\n`;
                if (regularMembers.length > 0)  line += `> 👥 Membres : ${regularMembers.slice(0, 5).map(id => `<@${id}>`).join(', ')}${regularMembers.length > 5 ? ` +${regularMembers.length - 5}` : ''}\n`;
                line += `> 👤 **${members.length}** membre(s) au total`;
                return line;
            });

            return new Discord.EmbedBuilder()
                .setTitle('🏆 Classement des Teams — Par Réputation')
                .setDescription(lines.join('\n\n') || 'Aucune team.')
                .setColor('#FEE75C')
                
                .setTimestamp();
        };

        const buildRow = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ttop_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('ttop_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= maxPages - 1)
        );

        if (maxPages === 1) return message.channel.send({ embeds: [buildPage(0)] });

        let page = 0;
        const msg = await message.channel.send(v2({ embeds: [buildPage(0)], components: [buildRow(0)] }));
        const col = msg.createMessageComponentCollector({ time: 120000 });
        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'ttop_prev') page = Math.max(0, page - 1);
            if (i.customId === 'ttop_next') page = Math.min(maxPages - 1, page + 1);
            await i.update(v2({ embeds: [buildPage(page)], components: [buildRow(page)] }));
        });
        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
