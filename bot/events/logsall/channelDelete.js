const Discord = require('discord.js');
module.exports = {
    name: 'channelDelete',
    run: async (client, channel) => {
        if (!channel.guild) return;
        const chanId = client.db.get(`logsall_${channel.guild.id}`);
        if (!chanId) return;
        const logChan = channel.guild.channels.cache.get(chanId);
        if (!logChan) return;
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🗑️ Salon supprimé`)
            .setDescription(`**Nom :** #${channel.name}\n**Type :** ${channel.type}\n**ID :** \`${channel.id}\``)
            .setColor('#ED4245').setTimestamp();
        logChan.send({ embeds: [embed] }).catch(() => {});
    }
};
