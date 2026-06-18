const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "daily",
    aliases: ["claim"],
    description: "Réclame ta récompense quotidienne",
    category: "coin",
    usage: ["daily"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const amount = client.db.get(`gain_daily_${guildId}`) || client.db.get(`coin_daily_amount_${guildId}`) || 100;
        const maxAmount = client.db.get(`gain_daily_max_${guildId}`) || 0;
        const finalAmount = maxAmount > 0 ? Math.floor(Math.random() * (maxAmount - amount + 1)) + amount : amount;
        const cooldown = client.db.get(`cooldown_daily_${guildId}`) || 24 * 60 * 60 * 1000;

        const lastDaily = client.db.get(`daily_last_${userId}_${guildId}`) || 0;
        const now = Date.now();
        const diff = now - lastDaily;

        if (diff < cooldown) {
            const remaining = cooldown - diff;
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setDescription(`⏳ Vous avez déjà réclamé votre daily !\nRevenez dans **${h}h ${m}min**.`)
            ]});
        }

        client.db.set(`daily_last_${userId}_${guildId}`, now);
        client.db.add(`coin_hand_${userId}_${guildId}`, finalAmount);

        // XP silencieux (non affiché)
        const xpActive = client.db.get(`xp_active_${guildId}`) !== false;
        const xpGain = xpActive ? (Math.floor(Math.random() * 15) + 10) : 0;
        if (xpGain > 0) client.db.add(`xp_${userId}_${guildId}`, xpGain);

        const total = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setTitle('💰 Daily réclamé !')
            .setDescription(`Vous avez reçu **${finalAmount} ${coinEmoji}** !\nEn main : **${total} ${coinEmoji}**`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        ]}));
    }
};
