const { Bot } = require('../../structures/client');
const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    run: async (client, member) => {
        const guild = member.guild;

        // Join logs
        const joinlogsChan = client.db.get(`joinlogs_${guild.id}`);
        if (joinlogsChan) {
            const embed = new Discord.EmbedBuilder()
                .setTitle(`📥 Membre rejoint`)
                .setDescription(`${member.user.tag} (\`${member.user.id}\`) a rejoint le serveur`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields({ name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true })
                .addFields({ name: 'Membres total', value: `${guild.memberCount}`, inline: true })
                .setColor('#57F287').setTimestamp();
            guild.channels.cache.get(joinlogsChan)?.send({ embeds: [embed] });
        }
    }
};
