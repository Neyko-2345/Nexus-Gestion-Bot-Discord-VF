const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setprice",
    aliases: ["priceconfig"],
    description: "Modifie les prix des objets pré-installés",
    category: "coin",
    ownerOnly: true,
    usage: ["setprice <team|lock_bronze|lock_silver|lock_gold|entreprise|wagon|army_recrue|army_soldat|army_elite|point_team> <prix>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const type      = args[0];
        const price     = parseInt(args[1]);

        const priceKeys = {
            'team':         `team_create_price_${guildId}`,
            'lock_bronze':  `lock_price_bronze_${guildId}`,
            'lock_silver':  `lock_price_silver_${guildId}`,
            'lock_gold':    `lock_price_gold_${guildId}`,
            'entreprise':   `ent_price_${guildId}`,
            'wagon':        `wagon_price_${guildId}`,
            'army_recrue':  null,
            'army_soldat':  null,
            'army_elite':   null,
            'point_team':   `team_point_price_${guildId}`,
        };

        if (!type) {
            const lines = Object.entries(priceKeys).map(([k, dbKey]) => {
                if (!dbKey) return `**${k}** — voir \`${prefix}entconfig\` / \`${prefix}coinconfig\``;
                const val = client.db.get(dbKey);
                return `**${k}** — ${val !== null && val !== undefined ? `${val} ${coinEmoji}` : 'non configuré'}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('💵 Prix configurés')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!(type in priceKeys)) return message.reply(`Type inconnu. Disponibles : ${Object.keys(priceKeys).join(', ')}`);
        if (isNaN(price) || price < 0) return message.reply(`Prix invalide.`);

        if (type.startsWith('army_')) {
            const armyTypes = { army_recrue: 'Recrue', army_soldat: 'Soldat', army_elite: 'Élite' };
            const armyRanks = client.db.get(`army_ranks_${guildId}`) || [
                { name: 'Recrue', cost: 50,  power: 1  },
                { name: 'Soldat', cost: 150, power: 3  },
                { name: 'Élite',  cost: 500, power: 10 },
            ];
            const name = armyTypes[type];
            const idx  = armyRanks.findIndex(r => r.name === name);
            if (idx !== -1) armyRanks[idx].cost = price;
            client.db.set(`army_ranks_${guildId}`, armyRanks);
            return message.reply(`✅ Prix de **${name}** réglé à **${price} ${coinEmoji}**.`);
        }

        client.db.set(priceKeys[type], price);
        message.reply(`✅ Prix de **${type}** réglé à **${price} ${coinEmoji}**.`);
    }
};
