const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
module.exports = {
    name: 'guildMemberUpdate',
    run: async (client, oldMember, newMember) => {
        const guild = newMember.guild;
        const chanId = client.db.get(`logsall_${guild.id}`);
        if (!chanId) return;
        const chan = guild.channels.cache.get(chanId);
        if (!chan) return;

        // Boosts
        const wasBooster = oldMember.premiumSince;
        const isBooster = newMember.premiumSince;
        if (!wasBooster && isBooster) {
            chan.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle(`🚀 Nouveau Boost !`)
                .setDescription(`${newMember.user} a boosté le serveur ! 💜`)
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                .setColor('#FF73FA').setTimestamp()
            ]})).catch(() => {});
        } else if (wasBooster && !isBooster) {
            chan.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle(`💔 Boost retiré`)
                .setDescription(`${newMember.user} a retiré son boost.`)
                .setColor('#ED4245').setTimestamp()
            ]})).catch(() => {});
        }

        // Rôles
        const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
        if (addedRoles.size > 0) {
            chan.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL() })
                .setTitle(`🎭 Rôle(s) ajouté(s)`)
                .setDescription(`${newMember.user} → ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`)
                .setColor('#57F287').setTimestamp()
            ]})).catch(() => {});
        }
        if (removedRoles.size > 0) {
            chan.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setAuthor({ name: `${newMember.user.tag}`, iconURL: newMember.user.displayAvatarURL() })
                .setTitle(`🎭 Rôle(s) retiré(s)`)
                .setDescription(`${newMember.user} a perdu : ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`)
                .setColor('#ED4245').setTimestamp()
            ]})).catch(() => {});
        }
    }
};
