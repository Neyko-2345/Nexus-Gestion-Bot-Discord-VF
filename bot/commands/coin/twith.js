const Discord = require('discord.js');

module.exports = {
    name: "twith",
    aliases: ["teamwith"],
    description: "Retire de l'argent de la banque de la team (fondateur/co-fondateur)",
    category: "coin",
    usage: ["twith <montant|all>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const teams     = client.db.get(`teams_${guildId}`) || [];
        const idx       = teams.findIndex(t => t.members?.includes(userId));
        if (idx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const team = teams[idx];
        if (!['Fondateur', 'Co-fondateur'].includes(team.ranks?.[userId])) {
            return message.reply(`Seul le Fondateur ou Co-fondateur peut retirer de la banque.`);
        }
        const bank   = team.bank || 0;
        const amount = args[0] === 'all' ? bank : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);
        if (amount > bank) return message.reply(`La banque ne contient que **${bank} ${coinEmoji}**.`);
        teams[idx].bank = bank - amount;
        client.db.set(`teams_${guildId}`, teams);
        client.db.add(`coin_hand_${userId}_${guildId}`, amount);
        message.reply({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setDescription(`✅ **${amount} ${coinEmoji}** retirés de la banque de **${team.name}** vers votre main.`)
        ]});
    }
};
