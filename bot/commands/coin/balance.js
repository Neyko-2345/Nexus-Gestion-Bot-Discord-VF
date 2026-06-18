const Discord = require('discord.js');

module.exports = {
    name: "balance",
    aliases: ["bal", "solde", "money"],
    description: "Affiche votre solde ou celui d'un membre",
    category: "coin",
    usage: ["balance [@membre]"],
    run: async (client, message, args, color, prefix, footer) => {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const userId = target.user.id;
        const guildId = message.guild.id;

        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`)      || 0;
        const bank      = client.db.get(`coin_bank_${userId}_${guildId}`)      || 0;
        const bronze    = client.db.get(`coin_bronze_${userId}_${guildId}`)    || 0;
        const silver    = client.db.get(`coin_silver_${userId}_${guildId}`)    || 0;
        const gold      = client.db.get(`coin_gold_${userId}_${guildId}`)      || 0;
        const celestial = client.db.get(`coin_celestial_${userId}_${guildId}`) || 0;

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

        const embed = new Discord.EmbedBuilder()
            .setTitle(`💰 Portefeuille de ${target.user.username}`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .setColor('#F1C40F').setTimestamp()
            .addFields({ name: `${coinEmoji} ${coinName}`, value: `En main : **${hand}**\nEn banque : **${bank}**\nTotal : **${hand + bank}**`, inline: true })
            .addFields({ name: `Autres monnaies`, value: `${bronzeEmoji} ${bronzeName} : **${bronze}**\n${silverEmoji} ${silverName} : **${silver}**\n${goldEmoji} ${goldName} : **${gold}**\n${celestialEmoji} ${celestialName} : **${celestial}**`, inline: true });
        message.channel.send({ embeds: [embed] });
    }
};
