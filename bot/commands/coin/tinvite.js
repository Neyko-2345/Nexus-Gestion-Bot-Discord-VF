const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "tinvite",
    aliases: ["tinv"],
    description: "Invite un membre dans votre team",
    category: "coin",
    usage: ["tinvite <@membre>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const team = teams.find(t => t.members?.includes(userId));
        if (!team) return message.reply(`Vous n'êtes dans aucune team.`);

        const rank = team.ranks?.[userId];
        if (!['Fondateur', 'Co-fondateur', 'Officier'].includes(rank)) return message.reply(`Seul le Fondateur, Co-fondateur ou Officier peut inviter.`);

        const target = message.mentions.members.first();
        if (!target || target.user.bot) return message.reply(`Mentionnez un membre valide.`);
        if (teams.some(t => t.members?.includes(target.id))) return message.reply(`Ce membre est déjà dans une team.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tinv_accept').setLabel('✅ Accepter').setStyle(Discord.ButtonStyle.Success),
            new ButtonBuilder().setCustomId('tinv_refuse').setLabel('❌ Refuser').setStyle(Discord.ButtonStyle.Danger)
        );
        const msg = await message.channel.send(v2({ content: `${target}`, embeds: [new Discord.EmbedBuilder()
            .setTitle(`⚔️ Invitation Team`)
            .setDescription(`${message.author} vous invite à rejoindre la team **${team.name}** !\nAcceptez-vous ?`)
            .setColor('#F1C40F')
        ], components: [row] }));

        const col = msg.createMessageComponentCollector({ time: 60000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== target.id) return i.reply({ content: 'Cette invitation ne vous est pas destinée.', ephemeral: true });
            if (i.customId === 'tinv_accept') {
                const updatedTeams = client.db.get(`teams_${guildId}`) || [];
                const idx = updatedTeams.findIndex(t => t.id === team.id);
                if (idx === -1) return i.update(v2({ content: 'Team introuvable.', embeds: [], components: [] }));
                updatedTeams[idx].members = updatedTeams[idx].members || [];
                updatedTeams[idx].members.push(target.id);
                updatedTeams[idx].ranks = updatedTeams[idx].ranks || {};
                updatedTeams[idx].ranks[target.id] = 'Membre';
                client.db.set(`teams_${guildId}`, updatedTeams);
                await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#F1C40F')
                    .setDescription(`✅ ${target} a rejoint la team **${team.name}** !`)
                ], components: [] }));
            } else {
                await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`❌ ${target} a refusé l'invitation.`)
                ], components: [] }));
            }
        });
        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
