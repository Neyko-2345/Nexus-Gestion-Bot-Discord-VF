const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const WORK_MESSAGES = [
    "a livré des colis", "a codé toute la nuit", "a travaillé au restaurant",
    "a vendu des légumes au marché", "a conduit un taxi", "a fait du gardiennage",
    "a donné des cours particuliers", "a réparé des voitures", "a fait du streaming",
    "a animé un événement", "a gardé des enfants", "a peint une maison",
    "a joué dans un concert", "a vendu des sneakers", "a travaillé en tant que développeur"
];

module.exports = {
    name: "work",
    aliases: ["travailler"],
    description: "Travaille et gagne des coins",
    category: "coin",
    usage: ["work"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const min = client.db.get(`gain_work_${guildId}`) || client.db.get(`coin_work_min_${guildId}`) || 30;
        const max = client.db.get(`gain_work_max_${guildId}`) || client.db.get(`coin_work_max_${guildId}`) || 80;
        const cooldown = client.db.get(`cooldown_work_${guildId}`) || 4 * 60 * 60 * 1000;

        const lastWork = client.db.get(`work_last_${userId}_${guildId}`) || 0;
        const now = Date.now();
        const diff = now - lastWork;

        if (diff < cooldown) {
            const remaining = cooldown - diff;
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setDescription(`⏳ Vous êtes fatigué !\nRevenez dans **${h}h ${m}min**.`)
            ]});
        }

        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        const action = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];
        client.db.set(`work_last_${userId}_${guildId}`, now);
        client.db.add(`coin_hand_${userId}_${guildId}`, amount);

        // XP gain silencieux (non affiché)
        const xpActive = client.db.get(`xp_active_${guildId}`) !== false;
        const xpGain = xpActive ? (Math.floor(Math.random() * 10) + 5) : 0;
        if (xpGain > 0) client.db.add(`xp_${userId}_${guildId}`, xpGain);

        const total = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setTitle('💼 Travail effectué !')
            .setDescription(`${message.author} ${action} et a gagné **${amount} ${coinEmoji}** !\nEn main : **${total} ${coinEmoji}**`)
        ]}));
    }
};
