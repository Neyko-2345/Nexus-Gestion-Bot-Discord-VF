const { Bot } = require('../../structures/client');
const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    run: async (client, member) => {
        const guild = member.guild;

        // Leave logs
        const leaveChan = client.db.get(`leavelogs_${guild.id}`);
        if (leaveChan) {
            const embed = new Discord.EmbedBuilder()
                .setTitle(`📤 Membre parti`)
                .setDescription(`${member.user.tag} (\`${member.user.id}\`) a quitté le serveur`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields({ name: 'Membres total', value: `${guild.memberCount}`, inline: true })
                .setColor('#ED4245').setTimestamp();
            guild.channels.cache.get(leaveChan)?.send({ embeds: [embed] });
        }
    }
};
