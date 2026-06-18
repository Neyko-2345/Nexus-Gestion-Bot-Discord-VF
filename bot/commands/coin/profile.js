const Discord = require('discord.js');

module.exports = {
    name: "profile",
    aliases: ["profil", "xp", "level"],
    description: "Affiche le profil coin d'un membre",
    category: "coin",
    usage: ["profile [@membre]"],
    run: async (client, message, args, color, prefix, footer) => {
        const target = message.mentions.members.first() || message.member;
        const userId  = target.id;
        const guildId = message.guild.id;

        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`)      || 0;
        const bank      = client.db.get(`coin_bank_${userId}_${guildId}`)      || 0;
        const xp        = client.db.get(`xp_${userId}_${guildId}`)             || 0;
        const bronze    = client.db.get(`coin_bronze_${userId}_${guildId}`)    || 0;
        const silver    = client.db.get(`coin_silver_${userId}_${guildId}`)    || 0;
        const gold      = client.db.get(`coin_gold_${userId}_${guildId}`)      || 0;
        const celestial = client.db.get(`coin_celestial_${userId}_${guildId}`) || 0;
        const capacity  = client.db.get(`illegal_capacity_${userId}_${guildId}`) || null;
        const drugs     = client.db.get(`illegal_drugs_${userId}_${guildId}`)    || 0;

        const xpLevels = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 };
        let level = 1;
        for (const [lvl, required] of Object.entries(xpLevels)) {
            if (xp >= required) level = parseInt(lvl);
        }
        const nextLvl = level + 1;
        const nextXp  = xpLevels[nextLvl] || null;

        const coinEmoji      = client.db.get(`coin_emoji_${guildId}`)      || '<:coin:1510618513876717709>';
        const bronzeEmoji    = client.db.get(`bronze_emoji_${guildId}`)    || '<:emoji_280:1515365609335029942>';
        const silverEmoji    = client.db.get(`silver_emoji_${guildId}`)    || '<:emoji_281:1515365638846021793>';
        const goldEmoji      = client.db.get(`gold_emoji_${guildId}`)      || '<:emoji_282:1515365659247251576>';
        const celestialEmoji = client.db.get(`celestial_emoji_${guildId}`) || '<:emoji_283:1515365679698673857>';

        const coinName      = client.db.get(`coin_name_${guildId}`)      || 'Coins';
        const bronzeName    = client.db.get(`bronze_name_${guildId}`)    || 'Bronze';
        const silverName    = client.db.get(`silver_name_${guildId}`)    || 'Argent';
        const goldName      = client.db.get(`gold_name_${guildId}`)      || 'Or';
        const celestialName = client.db.get(`celestial_name_${guildId}`) || 'Pièce Céleste';

        const capLabel = capacity === 'cultivateur' ? '🌱 Cultivateur' : capacity === 'blanchisseur' ? '🧹 Blanchisseur' : 'Aucune';

        const embed = new Discord.EmbedBuilder()
            .setTitle(`👤 Profil de ${target.user.username}`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setColor('#F1C40F').setTimestamp()
            .addFields({ name: `${coinEmoji} ${coinName}`, value: `En main : **${hand}** | En banque : **${bank}**\nTotal : **${hand + bank}**`, inline: false })
            .addFields({ name: 'Autres monnaies', value: `${bronzeEmoji} ${bronzeName} : **${bronze}** | ${silverEmoji} ${silverName} : **${silver}**\n${goldEmoji} ${goldName} : **${gold}** | ${celestialEmoji} ${celestialName} : **${celestial}**`, inline: false })
            .addFields({ name: '🌟 Niveau / XP', value: `Niveau **${level}** — ${xp} XP${nextXp ? ` (prochain niveau à ${nextXp} XP)` : ' (niveau max)'}`, inline: false });

        if (capacity) {
            embed.addFields({ name: '🌿 Illégal', value: `Capacité : **${capLabel}** | Stock : **${drugs}** drogue(s)`, inline: false });
        }

        message.channel.send({ embeds: [embed] });
    }
};
