const Discord = require('discord.js');

module.exports = {
    name: "pay",
    aliases: ["give", "payer"],
    description: "Envoie des coins à un autre membre (depuis la main)",
    category: "coin",
    usage: ["pay <@membre> <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const target = message.mentions.members.first();
        if (!target || target.user.bot) return message.reply(`Mentionnez un membre valide.`);
        if (target.id === message.author.id) return message.reply(`Vous ne pouvez pas vous payer vous-même.`);

        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const amount    = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);

        const hand = client.db.get(`coin_hand_${message.author.id}_${guildId}`) || 0;
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);

        client.db.subtract(`coin_hand_${message.author.id}_${guildId}`, amount);
        client.db.add(`coin_hand_${target.id}_${guildId}`, amount);

        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setDescription(`✅ ${message.author} a envoyé **${amount} ${coinEmoji}** à ${target}.`)
        ]});
    }
};
