const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder } = require('discord.js');

module.exports = {
    name: "trep",
    aliases: ["teamrep", "teamreputation"],
    description: "Convertir les coins de la banque d'équipe en points de réputation (fondateurs/co-fondateurs uniquement)",
    category: "coin",
    usage: ["trep"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId  = message.author.id;
        const guildId = message.guild.id;

        const teams = client.db.get(`teams_${guildId}`) || [];
        const team  = teams.find(t => (t.members || []).includes(userId) || t.founder === userId);
        if (!team) return message.reply(`❌ Vous n'êtes dans aucune team.`);

        const userRank = (team.ranks?.[userId] || '').toLowerCase();
        if (team.founder !== userId && !['co-fondateur', 'cofondateur'].includes(userRank)) {
            return message.reply(`❌ Seuls les **fondateurs** et **co-fondateurs** peuvent convertir des coins en réputation.`);
        }

        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const repCost   = client.db.get(`team_point_price_${guildId}`) || 2000;
        const bank      = team.bank || 0;

        const embed = new Discord.EmbedBuilder()
            .setTitle(`⭐ Réputation de ${team.name}`)
            .setDescription(
                `**Banque d'équipe :** ${bank} ${coinEmoji}\n` +
                `**Points de réputation actuels :** ${team.rep || 0} ⭐\n\n` +
                `**Taux de conversion :** \`${repCost} ${coinEmoji}\` = **1 point de réputation**\n\n` +
                `Cliquez sur **Convertir** pour ouvrir le formulaire.`
            )
            .setColor('#FEE75C').setTimestamp();

        const msg = await message.channel.send(v2({ embeds: [embed], components: [new ActionRowBuilder().addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('trep_open')
                .setLabel('⭐ Convertir des coins en rép')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(bank < repCost)
        )] }));

        const btn = await msg.awaitMessageComponent({ filter: i => i.user.id === userId && i.customId === 'trep_open', time: 60000 }).catch(() => null);
        if (!btn) return msg.edit({ components: [] }).catch(() => {});

        const modal = new Discord.ModalBuilder()
            .setTitle(`⭐ Convertir en Réputation — ${team.name}`)
            .setCustomId('trep_modal');
        modal.addComponents(new ActionRowBuilder().addComponents(
            new Discord.TextInputBuilder()
                .setCustomId('trep_amount')
                .setLabel(`Nombre de points de réputation à acheter`)
                .setStyle(Discord.TextInputStyle.Short)
                .setRequired(true)
                .setPlaceholder(`Max : ${Math.floor(bank / repCost)} (banque : ${bank} ${coinEmoji})`)
        ));

        await btn.showModal(modal);
        const mi = await btn.awaitModalSubmit({ filter: m => m.user.id === userId, time: 60000 }).catch(() => null);
        if (!mi) return msg.edit({ components: [] }).catch(() => {});

        const amount = parseInt(mi.fields.getTextInputValue('trep_amount'));
        if (isNaN(amount) || amount <= 0) {
            await msg.edit({ components: [] }).catch(() => {});
            return mi.reply({ content: '❌ Montant invalide.', ephemeral: true });
        }

        const cost = amount * repCost;
        const freshTeams = client.db.get(`teams_${guildId}`) || [];
        const freshTeam  = freshTeams.find(t => t.name === team.name);
        if (!freshTeam || (freshTeam.bank || 0) < cost) {
            await msg.edit({ components: [] }).catch(() => {});
            return mi.reply({ content: `❌ La banque d'équipe ne contient que **${freshTeam?.bank || 0} ${coinEmoji}** (il faut **${cost} ${coinEmoji}**).`, ephemeral: true });
        }

        const updatedTeams = freshTeams.map(t => {
            if (t.name === team.name) {
                return {
                    ...t,
                    bank: (t.bank || 0) - cost,
                    rep:  (t.rep  || 0) + amount,
                };
            }
            return t;
        });
        client.db.set(`teams_${guildId}`, updatedTeams);

        await msg.edit({ components: [] }).catch(() => {});
        await mi.reply(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('⭐ Conversion réussie !')
            .setDescription(
                `**${amount}** point(s) de réputation ajouté(s) à **${team.name}** !\n` +
                `Coût : **${cost} ${coinEmoji}** retirés de la banque.\n\n` +
                `Réputation totale : **${(freshTeam.rep || 0) + amount}** ⭐`
            )
            .setColor('#FEE75C')
        ]}));
    }
};
