const Discord = require('discord.js');
module.exports = {
    name: 'guildMemberAdd',
    run: async (client, member) => {
        const guild = member.guild;
        const chanId = client.db.get(`logsall_${guild.id}`);
        if (!chanId) return;
        const chan = guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(`📥 Membre rejoint`)
            .setDescription(`${member.user} (\`${member.user.id}\`) a rejoint le serveur`)
            .addFields({ name: 'Compte créé le', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true })
            .addFields({ name: 'Membres total', value: `${guild.memberCount}`, inline: true })
            .setColor('#57F287').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
