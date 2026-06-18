const Discord = require('discord.js');
module.exports = {
    name: 'roleCreate',
    run: async (client, role) => {
        const chanId = client.db.get(`logsall_${role.guild.id}`);
        if (!chanId) return;
        const chan = role.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🏷️ Rôle créé`)
            .setDescription(`**Nom :** ${role.name}\n**ID :** \`${role.id}\`\n**Couleur :** \`${role.hexColor}\``)
            .setColor('#57F287').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
