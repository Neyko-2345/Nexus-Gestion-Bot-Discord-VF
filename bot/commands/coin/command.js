const Discord = require('discord.js');

module.exports = {
    name: "command",
    aliases: ["cmd"],
    description: "Bloque ou autorise une commande dans un salon/catégorie",
    category: "coin",
    ownerOnly: true,
    usage: ["command <block|allow> <nom_commande> <#salon|categoryID>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const action = args[0];
        const cmdName = args[1];
        const targetId = args[2];

        if (!action || !cmdName || !targetId) {
            return message.reply(`Usage : \`${prefix}command <block|allow> <nom_commande> <#salon|categoryID>\``);
        }

        if (!['block', 'allow'].includes(action)) return message.reply(`Action invalide. Utilisez \`block\` ou \`allow\`.`);

        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(targetId);
        const chanId = ch?.id || targetId;

        if (action === 'block') {
            client.db.set(`cmd_blocked_${cmdName}_${chanId}`, true);
            return message.reply(`🔒 Commande \`${cmdName}\` **bloquée** dans <#${chanId}>.`);
        }

        if (action === 'allow') {
            client.db.delete(`cmd_blocked_${cmdName}_${chanId}`);
            return message.reply(`🔓 Commande \`${cmdName}\` **autorisée** dans <#${chanId}>.`);
        }
    }
};
