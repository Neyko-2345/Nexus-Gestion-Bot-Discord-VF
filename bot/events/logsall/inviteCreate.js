const Discord = require('discord.js');
module.exports = {
    name: 'inviteCreate',
    run: async (client, invite) => {
        if (!invite.guild) return;
        const chanId = client.db.get(`logsall_${invite.guild.id}`);
        if (!chanId) return;
        const chan = invite.guild.channels.cache.get(chanId);
        if (!chan) return;
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🔗 Invitation créée`)
            .setDescription(
                `**Code :** \`${invite.code}\`\n` +
                `**Salon :** ${invite.channel}\n` +
                `**Créateur :** ${invite.inviter?.tag || 'Inconnu'}\n` +
                `**Utilisations max :** ${invite.maxUses || '∞'}\n` +
                `**Expire :** ${invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Jamais'}`
            )
            .setColor('#5865F2').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
