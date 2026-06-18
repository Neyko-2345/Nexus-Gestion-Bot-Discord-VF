const Discord = require('discord.js');
module.exports = {
    name: 'roleDelete',
    run: async (client, role) => {
        const chanId = client.db.get(`logsall_${role.guild.id}`);
        if (!chanId) return;
        const chan = role.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🗑️ Rôle supprimé`)
            .setDescription(`**Nom :** ${role.name}\n**ID :** \`${role.id}\``)
            .setColor('#ED4245').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
