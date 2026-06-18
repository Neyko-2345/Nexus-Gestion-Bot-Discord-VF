const { Bot } = require('../../structures/client');
const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberUpdate',
    run: async (client, oldMember, newMember) => {
        const guild = newMember.guild;

        // Boost logs
        const boostChan = client.db.get(`boostlogs_${guild.id}`);
        if (boostChan) {
            const wasBooster = oldMember.premiumSince;
            const isBooster = newMember.premiumSince;
            if (!wasBooster && isBooster) {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`🚀 Nouveau Boost!`)
                    .setDescription(`${newMember.user} vient de booster le serveur ! Merci ! 💜`)
                    .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
                    .setColor('#FF73FA').setTimestamp();
                guild.channels.cache.get(boostChan)?.send({ embeds: [embed] });
            }
            if (wasBooster && !isBooster) {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`💔 Boost retiré`)
                    .setDescription(`${newMember.user} a retiré son boost du serveur.`)
                    .setColor('#ED4245').setTimestamp();
                guild.channels.cache.get(boostChan)?.send({ embeds: [embed] });
            }
        }

        // Role logs
        const roleChan = client.db.get(`rolelogs_${guild.id}`);
        if (roleChan) {
            const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
            const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

            if (addedRoles.size > 0) {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`🎭 Rôle(s) ajouté(s)`)
                    .setDescription(`${newMember.user} a reçu : ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`)
                    .setColor('#57F287').setTimestamp();
                guild.channels.cache.get(roleChan)?.send({ embeds: [embed] });
            }
            if (removedRoles.size > 0) {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`🎭 Rôle(s) retiré(s)`)
                    .setDescription(`${newMember.user} a perdu : ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`)
                    .setColor('#ED4245').setTimestamp();
                guild.channels.cache.get(roleChan)?.send({ embeds: [embed] });
            }
        }

        // Rank logs
        const rankLogsChan = client.db.get(`ranklogs_${guild.id}`);
        if (rankLogsChan) {
            const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
            const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
            const ranks = client.db.get(`ranks_${guild.id}`) || [];
            const rankRoleIds = ranks.flatMap(r => r.roles || []);

            const addedRank = addedRoles.find(r => rankRoleIds.includes(r.id));
            const removedRank = removedRoles.find(r => rankRoleIds.includes(r.id));

            if (addedRank) {
                const rank = ranks.find(r => r.roles?.includes(addedRank.id));
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`⬆️ Rank attribué`)
                    .setDescription(`${newMember.user} a reçu le rank **${rank?.name || addedRank.name}**`)
                    .setColor('#FEE75C').setTimestamp();
                guild.channels.cache.get(rankLogsChan)?.send({ embeds: [embed] });
            }
            if (removedRank) {
                const rank = ranks.find(r => r.roles?.includes(removedRank.id));
                const embed = new Discord.EmbedBuilder()
                    .setTitle(`⬇️ Rank retiré`)
                    .setDescription(`${newMember.user} a perdu le rank **${rank?.name || removedRank.name}**`)
                    .setColor('#ED4245').setTimestamp();
                guild.channels.cache.get(rankLogsChan)?.send({ embeds: [embed] });
            }
        }
    }
};
