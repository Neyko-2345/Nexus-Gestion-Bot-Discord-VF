const Discord = require('discord.js');
module.exports = {
    name: 'guildUpdate',
    run: async (client, oldGuild, newGuild) => {
        const chanId = client.db.get(`logsall_${newGuild.id}`);
        if (!chanId) return;
        const chan = newGuild.channels.cache.get(chanId);
        if (!chan) return;

        const changes = [];
        if (oldGuild.name !== newGuild.name) changes.push(`**Nom :** \`${oldGuild.name}\` → \`${newGuild.name}\``);
        if (oldGuild.icon !== newGuild.icon) changes.push(`**Icône :** modifiée`);
        if (oldGuild.banner !== newGuild.banner) changes.push(`**Bannière :** modifiée`);
        if (oldGuild.ownerId !== newGuild.ownerId) changes.push(`**Owner :** <@${oldGuild.ownerId}> → <@${newGuild.ownerId}>`);
        if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`**Niveau de vérif :** ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);
        if (oldGuild.systemChannelId !== newGuild.systemChannelId) changes.push(`**Salon système :** modifié`);
        if (changes.length === 0) return;

        const embed = new Discord.EmbedBuilder()
            .setTitle(`🔧 Serveur modifié`)
            .setDescription(changes.join('\n'))
            .setThumbnail(newGuild.iconURL({ dynamic: true }))
            .setColor('#FEE75C').setTimestamp();
        chan.send({ embeds: [embed] }).catch(() => {});
    }
};
