const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "top",
    aliases: ["leaderboard", "classement"],
    description: "Affiche le top 10 des membres les plus riches (toutes monnaies confondues)",
    category: "coin",
    usage: ["top"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const bronzeRate    = client.db.get(`convert_bronze_to_coin_${guildId}`)    || 10;
        const silverRate    = client.db.get(`convert_silver_to_bronze_${guildId}`)  || 10;
        const goldRate      = client.db.get(`convert_gold_to_silver_${guildId}`)    || 10;
        const celestialRate = client.db.get(`convert_celestial_to_gold_${guildId}`) || 10;

        const members = await message.guild.members.fetch();
        const scores  = [];

        for (const [id] of members) {
            const hand      = client.db.get(`coin_hand_${id}_${guildId}`)      || 0;
            const bank      = client.db.get(`coin_bank_${id}_${guildId}`)      || 0;
            const bronze    = client.db.get(`coin_bronze_${id}_${guildId}`)    || 0;
            const silver    = client.db.get(`coin_silver_${id}_${guildId}`)    || 0;
            const gold      = client.db.get(`coin_gold_${id}_${guildId}`)      || 0;
            const celestial = client.db.get(`coin_celestial_${id}_${guildId}`) || 0;
            const total = hand + bank
                + bronze * bronzeRate
                + silver * silverRate * bronzeRate
                + gold * goldRate * silverRate * bronzeRate
                + celestial * celestialRate * goldRate * silverRate * bronzeRate;
            if (total > 0) scores.push({ id, total });
        }

        scores.sort((a, b) => b.total - a.total);
        const top = scores.slice(0, 10);

        const lines = top.map((s, i) => {
            const mem = members.get(s.id);
            return `**${i + 1}.** ${mem ? mem.user.username : `<@${s.id}>`} — **${s.total.toLocaleString()} ${coinEmoji}** (valeur totale)`;
        });

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('🏆 Top 10 — Plus riches du serveur')
            .setDescription(lines.length > 0 ? lines.join('\n') : 'Aucune donnée disponible.')
            .setColor('#FEE75C').setTimestamp()
        ]}));
    }
};
