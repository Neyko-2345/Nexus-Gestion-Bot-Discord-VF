const Discord = require('discord.js');

module.exports = {
    name: "tdep",
    aliases: ["teamdep"],
    description: "Dépose de l'argent dans la banque de la team",
    category: "coin",
    usage: ["tdep <montant|all>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];
        const idx       = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const hand   = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const amount = args[0] === 'all' ? hand : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);
        client.db.subtract(`coin_hand_${userId}_${guildId}`, amount);
        teams[idx].bank = (teams[idx].bank || 0) + amount;
        client.db.set(`teams_${guildId}`, teams);
        message.reply({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setDescription(`✅ Vous avez déposé **${amount} ${coinEmoji}** dans la banque de la team **${teams[idx].name}**.\nBanque de la team : **${teams[idx].bank} ${coinEmoji}**`)
        ]});
    }
};
