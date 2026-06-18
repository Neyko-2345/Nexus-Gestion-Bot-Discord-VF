const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');
module.exports = {
    name: "tdelete",
    aliases: ["teamdelete"],
    description: "Supprime votre team (fondateur seulement)",
    category: "coin",
    usage: ["tdelete"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const isOwner = client.staff.includes(userId) || client.config.buyers.includes(userId) || client.db.get(`owner_${userId}`) === true;
        const teams = client.db.get(`teams_${guildId}`) || [];
        let team, teamId;
        if (isOwner && args[0]) {
            team = teams.find(t => t.id === args[0] || t.name.toLowerCase() === args.join(' ').toLowerCase());
        } else {
            team = teams.find(t => t.founder === userId);
        }
        if (!team) return message.reply(`Team introuvable ou vous n'êtes pas fondateur.`);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('td_confirm').setLabel('✅ Confirmer').setStyle(Discord.ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('td_cancel').setLabel('❌ Annuler').setStyle(Discord.ButtonStyle.Secondary)
        );
        const msg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`⚠️ Supprimer la team **${team.name}** ? Cette action est **irréversible**.`)
        ], components: [row] }));
        const col = msg.createMessageComponentCollector({ time: 30000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'td_cancel') return i.update(v2({ embeds: [new Discord.EmbedBuilder().setColor('#F1C40F').setDescription('Annulé.')], components: [] }));
            const updatedTeams = (client.db.get(`teams_${guildId}`) || []).filter(t => t.id !== team.id);
            client.db.set(`teams_${guildId}`, updatedTeams);
            await i.update(v2({ embeds: [new Discord.EmbedBuilder().setColor('#F1C40F').setDescription(`✅ Team **${team.name}** supprimée.`)], components: [] }));
        });
        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
