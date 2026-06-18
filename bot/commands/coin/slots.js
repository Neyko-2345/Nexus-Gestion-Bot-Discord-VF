const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const SYMBOLS = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'];

module.exports = {
    name: "slots",
    aliases: ["machine"],
    description: "Joue à la machine à sous",
    category: "coin",
    usage: ["slots <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Indiquez un montant valide.`);
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);

        const s = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const r = [s(), s(), s()];

        let mult = 0, result = '';
        if (r[0] === r[1] && r[1] === r[2]) {
            if (r[0] === '7️⃣')      { mult = 10; result = '🎉 **JACKPOT ! x10 !**'; }
            else if (r[0] === '💎') { mult = 5;  result = '💎 **Triple Diamant ! x5 !**'; }
            else                    { mult = 3;  result = `✨ **Triple ${r[0]} ! x3 !**`; }
        } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
            mult = 1.5; result = '👍 **Double ! x1.5 !**';
        } else {
            mult = 0; result = '❌ **Rien… Dommage !**';
        }

        client.db.subtract(`coin_hand_${userId}_${guildId}`, amount);
        const gain = Math.floor(amount * mult);
        if (gain > 0) client.db.add(`coin_hand_${userId}_${guildId}`, gain);
        const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor(gain >= amount ? '#57F287' : '#ED4245')
            .setTitle(`🎰 Machine à Sous`)
            .setDescription(
                `[ ${r[0]} | ${r[1]} | ${r[2]} ]\n\n${result}\n` +
                `Misé : **${amount} ${coinEmoji}** → Gagné : **${gain} ${coinEmoji}**\n` +
                `En main : **${newTotal} ${coinEmoji}**`
            ).setTimestamp()
        ]}));
    }
};
