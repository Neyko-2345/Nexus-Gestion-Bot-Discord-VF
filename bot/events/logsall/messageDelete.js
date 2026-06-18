const Discord = require('discord.js');
module.exports = {
    name: 'messageDelete',
    run: async (client, message) => {
        if (!message.guild || !message.author || message.author.bot) return;
        const chanId = client.db.get(`logsall_${message.guild.id}`);
        if (!chanId) return;
        const chan = message.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(`🗑️ Message supprimé`)
            .setDescription(`**Salon :** ${message.channel}\n**Contenu :**\n${message.content || '*[Fichier ou embed sans texte]*'}`)
            .setColor('#ED4245').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
