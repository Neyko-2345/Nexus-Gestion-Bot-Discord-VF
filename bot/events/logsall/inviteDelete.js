const Discord = require('discord.js');
module.exports = {
    name: 'inviteDelete',
    run: async (client, invite) => {
        if (!invite.guild) return;
        const chanId = client.db.get(`logsall_${invite.guild.id}`);
        if (!chanId) return;
        const chan = invite.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🔗 Invitation expirée / supprimée`)
            .setDescription(`**Code :** \`${invite.code}\`\n**Salon :** ${invite.channel}`)
            .setColor('#ED4245').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
