const Discord = require('discord.js');
module.exports = {
    name: 'messageUpdate',
    run: async (client, oldMessage, newMessage) => {
        if (!newMessage.guild || !newMessage.author || newMessage.author.bot) return;
        if (oldMessage.content === newMessage.content) return;
        const chanId = client.db.get(`logsall_${newMessage.guild.id}`);
        if (!chanId) return;
        const chan = newMessage.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${newMessage.author.tag}`, iconURL: newMessage.author.displayAvatarURL() })
            .setTitle(`✏️ Message modifié`)
            .setDescription(`**Salon :** ${newMessage.channel}\n**Avant :** ${oldMessage.content || '*vide*'}\n**Après :** ${newMessage.content || '*vide*'}`)
            .setURL(newMessage.url)
            .setColor('#FEE75C').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
