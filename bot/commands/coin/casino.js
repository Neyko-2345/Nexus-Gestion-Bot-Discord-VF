const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "casino",
    aliases: ["gamble", "miser"],
    description: "Mise des coins au casino (50/50)",
    category: "coin",
    usage: ["casino <montant|all>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const maxBet    = client.db.get(`max_casino_${guildId}`) || null;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        if (!args[0]) return message.reply(`Indiquez un montant ou \`all\`.`);
        let amount = args[0] === 'all' ? hand : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Montant invalide.`);
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);
        if (maxBet && amount > maxBet) return message.reply(`Mise maximale : **${maxBet} ${coinEmoji}**.`);

        const win = Math.random() < 0.5;
        if (win) {
            client.db.add(`coin_hand_${userId}_${guildId}`, amount);
            const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#57F287').setTimestamp()
                .setTitle('🎰 GAGNÉ !')
                .setDescription(`Vous avez misé **${amount} ${coinEmoji}** et vous avez **GAGNÉ** !\n+**${amount} ${coinEmoji}** → Total en main : **${newTotal} ${coinEmoji}**`)
            ]}));
        } else {
            client.db.subtract(`coin_hand_${userId}_${guildId}`, amount);
            const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245').setTimestamp()
                .setTitle('🎰 PERDU !')
                .setDescription(`Vous avez misé **${amount} ${coinEmoji}** et vous avez **PERDU** !\n-**${amount} ${coinEmoji}** → Total en main : **${newTotal} ${coinEmoji}**`)
            ]}));
        }
    }
};
