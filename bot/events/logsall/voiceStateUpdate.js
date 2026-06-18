const Discord = require('discord.js');
module.exports = {
    name: 'voiceStateUpdate',
    run: async (client, oldState, newState) => {
        const guild = newState.guild;
        const chanId = client.db.get(`logsall_${guild.id}`);
        if (!chanId) return;
        const chan = guild.channels.cache.get(chanId);
        if (!chan) return;

        const member = newState.guild.members.cache.get(newState.id);
        if (!member) return;

        let action;
        if (!oldState.channelId && newState.channelId) {
            action = `🎤 ${member.user} a rejoint **${newState.channel?.name}**`;
        } else if (oldState.channelId && !newState.channelId) {
            action = `🔇 ${member.user} a quitté **${oldState.channel?.name}**`;
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            action = `🔀 ${member.user} a changé : **${oldState.channel?.name}** → **${newState.channel?.name}**`;
        } else return;

        const embed = new Discord.EmbedBuilder()
            .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTitle(`🎤 Activité vocale`)
            .setDescription(action)
            .setColor('#5865F2').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
