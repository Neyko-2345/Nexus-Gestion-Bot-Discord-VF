const Discord = require('discord.js');

const DEFAULT_SHOP = [
    { name: 'Wagon',       emoji: '🚂', price: 200,   description: 'Permet de miner des minerais',         type: 'wagon' },
    { name: 'Entreprise',  emoji: '🏢', price: 10000, description: 'Créez votre propre entreprise',        type: 'entreprise' },
];

module.exports = {
    name: "buy",
    aliases: ["acheter"],
    description: "Achète un article du shop",
    category: "coin",
    usage: ["buy <nom_article>"],
    run: async (client, message, args, color, prefix, footer) => {
        if (!args[0]) return message.reply(`Indiquez le nom de l'article. Consultez \`${prefix}shop\`.`);
        const guildId = message.guild.id;
        const userId = message.author.id;
        const name = args.join(' ').toLowerCase();
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const shopItems = client.db.get(`shop_items_${guildId}`) || DEFAULT_SHOP;
        const item = shopItems.find(i => i.name.toLowerCase() === name || i.name.toLowerCase().includes(name));
        if (!item) return message.reply(`Article \`${args.join(' ')}\` introuvable dans le shop.`);

        const hand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        if (hand < item.price) return message.reply(`Pas assez de ${coinEmoji}. (${hand}/${item.price} ${coinEmoji})`);

        client.db.subtract(`coin_hand_${userId}_${guildId}`, item.price);

        if (item.type === 'wagon') {
            const maxUses = client.db.get(`wagon_max_uses_${guildId}`) || 10;
            client.db.set(`wagon_uses_${userId}_${guildId}`, maxUses);

        } else if (item.type === 'entreprise') {
            const existing = client.db.get(`ent_${userId}_${guildId}`);
            if (existing) {
                client.db.add(`coin_hand_${userId}_${guildId}`, item.price);
                return message.reply(`Vous avez déjà une entreprise ! Consultez \`${prefix}entreprise\`.`);
            }
            const entName = args.slice(1).join(' ') || `Entreprise de ${message.author.username}`;
            client.db.set(`ent_${userId}_${guildId}`, {
                name: entName,
                coffre: 0,
                coffreRank: 1,
                hiredEmployees: [],
                createdAt: Date.now(),
                lastCollect: Date.now(),
            });

        } else if (item.type === 'role') {
            if (item.roleId) {
                const role = message.guild.roles.cache.get(item.roleId);
                if (role) await message.member.roles.add(role).catch(() => {});
            }

        } else if (item.type === 'custom' || !item.type) {
            const logCh = client.db.get(`coinlog_transactions_${guildId}`) || client.db.get(`coinlog_all_${guildId}`);
            if (logCh) {
                const ch = message.guild.channels.cache.get(logCh);
                if (ch) ch.send({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#F1C40F').setTimestamp()
                    .setDescription(`🛒 ${message.author} a acheté **${item.name}** pour **${item.price} ${coinEmoji}**. Livraison manuelle requise.`)
                ]}).catch(() => {});
            }
        }

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setDescription(`✅ Vous avez acheté **${item.emoji || '🛒'} ${item.name}** pour **${item.price} ${coinEmoji}** !${item.type === 'entreprise' ? `\nVotre entreprise a été créée ! Consultez \`${prefix}entreprise\`.` : ''}`)
        ]});
    }
};
