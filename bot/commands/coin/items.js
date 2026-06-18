const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "items",
    aliases: ["shopconfig", "itemsconfig"],
    description: "Gère les items du shop du serveur",
    category: "coin",
    ownerOnly: true,
    usage: [
        "items list",
        "items add <nom> <prix> <description>",
        "items remove <id>",
        "items addc <nom> <prix> <description> (convertshop — pièces célestes)",
        "items removec <id>",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const sub       = args[0];
        const { v4: uuidv4 } = require('uuid');

        if (!sub || sub === 'list') {
            const shopItems  = client.db.get(`shop_items_${guildId}`)      || [];
            const cshopItems = client.db.get(`convertshop_items_${guildId}`) || [];
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🛒 Items configurés')
                .setColor(color)
                .addFields({ name: `Shop Normal (${shopItems.length})`, value: shopItems.length > 0
                        ? shopItems.map(i => `\`${i.id}\` **${i.name}** — ${i.price} ${coinEmoji}`).join('\n')
                        : 'Vide', inline: false })
                .addFields({ name: `ConvertShop ✨ (${cshopItems.length})`, value: cshopItems.length > 0
                        ? cshopItems.map(i => `\`${i.id}\` **${i.name}** — ${i.price} ✨`).join('\n')
                        : 'Vide', inline: false })
            ]}));
        }

        if (sub === 'add') {
            const [, nom, prix, ...descParts] = args;
            if (!nom || !prix) return message.reply(`Usage : \`${prefix}items add <nom> <prix> [description]\``);
            const shopItems = client.db.get(`shop_items_${guildId}`) || [];
            shopItems.push({ id: uuidv4().substring(0, 6), name: nom, price: parseInt(prix), description: descParts.join(' ') || '' });
            client.db.set(`shop_items_${guildId}`, shopItems);
            return message.reply(`✅ Item **${nom}** ajouté au shop.`);
        }

        if (sub === 'remove') {
            if (!args[1]) return message.reply(`Indiquez l'ID de l'item.`);
            client.db.set(`shop_items_${guildId}`, (client.db.get(`shop_items_${guildId}`) || []).filter(i => i.id !== args[1]));
            return message.reply(`✅ Item supprimé.`);
        }

        if (sub === 'addc') {
            // Usage : items addc <emoji> <nom> <prix>
            const emoji = args[1], nom = args[2], prix = args[3];
            if (!emoji || !nom || !prix) return message.reply(`Usage : \`${prefix}items addc <emoji> <nom> <prix_céleste>\``);
            const cshopItems = client.db.get(`convertshop_items_${guildId}`) || [];
            cshopItems.push({ id: uuidv4().substring(0, 6), emoji, name: nom, price: parseInt(prix) });
            client.db.set(`convertshop_items_${guildId}`, cshopItems);
            return message.reply(`✅ Item ${emoji} **${nom}** ajouté au ConvertShop (${prix} célestes).`);
        }

        if (sub === 'removec') {
            if (!args[1]) return message.reply(`Indiquez l'ID de l'item.`);
            client.db.set(`convertshop_items_${guildId}`, (client.db.get(`convertshop_items_${guildId}`) || []).filter(i => i.id !== args[1]));
            return message.reply(`✅ Item ConvertShop supprimé.`);
        }

        message.reply(`Sous-commande inconnue. Disponibles : list, add, remove, addc, removec`);
    }
};
