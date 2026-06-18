const Discord = require('discord.js');

module.exports = {
    name: "remove",
    aliases: ["removecoin", "takecoin"],
    description: "Retire des ressources à un joueur",
    category: "coin",
    ownerOnly: true,
    usage: ["remove <coins|bank|xp|bronze|silver|gold|celestial|rep> @membre <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const type = args[0];
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
        const amount = parseInt(args[2] || args[1]);
        if (!target || isNaN(amount)) return message.reply(`Usage : \`${prefix}remove <type> @membre <montant>\``);
        const userId = target.id;

        const dbKeys = {
            coins: `coin_hand_${userId}_${guildId}`,
            bank: `coin_bank_${userId}_${guildId}`,
            xp: `xp_${userId}_${guildId}`,
            bronze: `coin_bronze_${userId}_${guildId}`,
            silver: `coin_silver_${userId}_${guildId}`,
            gold: `coin_gold_${userId}_${guildId}`,
            celestial: `coin_celestial_${userId}_${guildId}`,
            rep: `rep_${userId}_${guildId}`,
        };
        if (!(type in dbKeys)) return message.reply(`Type inconnu. Disponibles : ${Object.keys(dbKeys).join(', ')}`);
        client.db.subtract(dbKeys[type], amount);
        if ((client.db.get(dbKeys[type]) || 0) < 0) client.db.set(dbKeys[type], 0);
        message.reply(`✅ -${amount} **${type}** retiré à ${target}.`);
    }
};
