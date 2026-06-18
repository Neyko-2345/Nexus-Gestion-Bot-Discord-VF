const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "entreprisedelete",
    aliases: ["deleteentreprise", "entdelete", "delent"],
    description: "Supprime définitivement votre entreprise",
    category: "coin",
    usage: ["entreprisedelete"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId  = message.author.id;

        const ent = client.db.get(`ent_${userId}_${guildId}`);
        if (!ent) return message.reply(`❌ Vous n'avez pas d'entreprise à supprimer.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('entdel_confirm').setLabel('🗑️ Supprimer définitivement').setStyle(Discord.ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('entdel_cancel').setLabel('❌ Annuler').setStyle(Discord.ButtonStyle.Secondary),
        );

        const msg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('⚠️ Supprimer votre entreprise')
            .setColor('#ED4245')
            .setDescription(
                `Vous êtes sur le point de supprimer l'entreprise **${ent.name || 'Mon Entreprise'}**.\n\n` +
                `**Cela supprimera définitivement :**\n` +
                `• Tous vos employés actifs\n` +
                `• Le contenu de votre coffre (${ent.coffre || 0} coins)\n` +
                `• Toutes les données associées\n\n` +
                `⚠️ Cette action est **irréversible**.`
            )
        ], components: [row] }));

        const col = msg.createMessageComponentCollector({ time: 30000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });

            if (i.customId === 'entdel_cancel') {
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#57F287').setDescription('✅ Suppression annulée.')
                ], components: [] }));
            }

            if (i.customId === 'entdel_confirm') {
                client.db.delete(`ent_${userId}_${guildId}`);
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🗑️ Entreprise supprimée')
                    .setColor('#F1C40F').setTimestamp()
                    .setDescription(`Votre entreprise a été supprimée.\nVous pouvez en racheter une dans \`${prefix}shop\`.`)
                ], components: [] }));
            }
        });
        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
