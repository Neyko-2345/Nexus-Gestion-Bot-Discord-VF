const Discord = require('discord.js');

module.exports = {
    name: "deposit",
    aliases: ["dep", "deposer"],
    description: "Dépose des coins en banque",
    category: "coin",
    usage: ["deposit <montant|all>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;

        if (!args[0]) return message.reply(`Indiquez un montant ou \`all\`.`);
        const amount = args[0] === 'all' ? hand : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);

        client.db.subtract(`coin_hand_${userId}_${guildId}`, amount);
        client.db.add(`coin_bank_${userId}_${guildId}`, amount);

        const newHand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const newBank = client.db.get(`coin_bank_${userId}_${guildId}`) || 0;
        message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setDescription(`✅ Vous avez déposé **${amount} ${coinEmoji}** en banque.\nMain : **${newHand} ${coinEmoji}** | Banque : **${newBank} ${coinEmoji}**`)
        ]});
    }
};
