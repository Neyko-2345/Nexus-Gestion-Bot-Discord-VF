const Discord = require('discord.js');
module.exports = {
    name: 'guildMemberRemove',
    run: async (client, member) => {
        const guild = member.guild;
        const chanId = client.db.get(`logsall_${guild.id}`);
        if (!chanId) return;
        const chan = guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(`📤 Membre parti`)
            .setDescription(`${member.user} (\`${member.user.id}\`) a quitté le serveur`)
            .addFields({ name: 'Membres total', value: `${guild.memberCount}`, inline: true })
            .setColor('#ED4245').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
