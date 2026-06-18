const Discord = require('discord.js');

const DEFAULT_MINERAIS = [
    { name: 'Charbon',          emoji: '▪️',                                     value: 20,  chance: 5 },
    { name: 'Azuryn',           emoji: '<:dsclookup:1514405513901903913>',        value: 50,  chance: 5 },
    { name: 'Amethyst',         emoji: '<:dsclookup:1514405529596858432>',        value: 100, chance: 3 },
    { name: 'Pierre de lune rose', emoji: '<:dsclookup:1514405478254510122>',      value: 150, chance: 2 },
    { name: 'Béryl rouge',      emoji: '<:dsclookup:1514405563495092304>',        value: 500, chance: 1 },
];

module.exports = {
    name: "minerais",
    aliases: ["inventory", "inv"],
    description: "Affiche votre inventaire de minerais",
    category: "coin",
    usage: ["minerais [@membre]"],
    run: async (client, message, args, color, prefix, footer) => {
        const target = message.mentions.members.first() || message.member;
        const userId = target.id;
        const guildId = message.guild.id;

        const minerais = client.db.get(`minerais_${guildId}`) || DEFAULT_MINERAIS;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const lines = [];
        let totalValue = 0;
        for (const m of minerais) {
            const qty = client.db.get(`mine_inv_${userId}_${guildId}_${m.name}`) || 0;
            if (qty > 0) {
                lines.push(`${m.emoji} **${m.name}** × ${qty} — valeur : **${qty * m.value} ${coinEmoji}**`);
                totalValue += qty * m.value;
            }
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle(`⛏️ Inventaire minerais — ${target.user.username}`)
            .setDescription(
                lines.length > 0
                    ? lines.join('\n') + `\n\n💰 **Valeur totale : ${totalValue} ${coinEmoji}**\n*Vendez avec \`${prefix}sellminerais\`*`
                    : `Aucun minerai. Utilisez \`${prefix}mine\` pour miner !`
            )
            .setColor('#F1C40F').setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
