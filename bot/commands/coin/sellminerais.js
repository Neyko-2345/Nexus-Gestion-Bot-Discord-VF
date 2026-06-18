const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const DEFAULT_MINERAIS = [
    { name: 'Charbon',          emoji: '▪️',                                     value: 20  },
    { name: 'Azuryn',           emoji: '<:dsclookup:1514405513901903913>',        value: 50  },
    { name: 'Amethyst',         emoji: '<:dsclookup:1514405529596858432>',        value: 100 },
    { name: 'Pierre de lune rose', emoji: '<:dsclookup:1514405478254510122>',      value: 150 },
    { name: 'Béryl rouge',      emoji: '<:dsclookup:1514405563495092304>',        value: 500 },
];

module.exports = {
    name: "sellminerais",
    aliases: ["vendre", "sell"],
    description: "Vend tous vos minerais contre des coins",
    category: "coin",
    usage: ["sellminerais [<nom_minerai>]"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId = message.author.id;
        const guildId = message.guild.id;

        const minerais = client.db.get(`minerais_${guildId}`) || DEFAULT_MINERAIS;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        // Vente d'un minerai spécifique ou de tous
        const filterName = args.join(' ').toLowerCase() || null;
        const toSell = filterName ? minerais.filter(m => m.name.toLowerCase().includes(filterName)) : minerais;

        if (toSell.length === 0) return message.reply(`Minerai \`${args.join(' ')}\` introuvable.`);

        let totalValue = 0;
        const lines = [];
        for (const m of toSell) {
            const qty = client.db.get(`mine_inv_${userId}_${guildId}_${m.name}`) || 0;
            if (qty > 0) {
                const val = qty * m.value;
                lines.push(`${m.emoji} **${m.name}** × ${qty} = **${val} ${coinEmoji}**`);
                totalValue += val;
                client.db.delete(`mine_inv_${userId}_${guildId}_${m.name}`);
            }
        }

        if (totalValue === 0) return message.reply(`Vous n'avez aucun minerai${filterName ? ` (${args.join(' ')})` : ''} à vendre.`);
        client.db.add(`coin_hand_${userId}_${guildId}`, totalValue);

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#57F287').setTimestamp()
            .setTitle('💰 Vente de minerais')
            .setDescription(lines.join('\n') + `\n\n**Total encaissé : ${totalValue} ${coinEmoji}**`)
        ]}));
    }
};
