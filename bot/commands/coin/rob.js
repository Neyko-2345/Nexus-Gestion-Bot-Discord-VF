const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "rob",
    aliases: ["voler", "steal"],
    description: "Tente de voler l'argent en main d'un membre",
    category: "coin",
    usage: ["rob <@membre>"],
    run: async (client, message, args, color, prefix, footer) => {
        const target = message.mentions.members.first();
        if (!target || target.user.bot) return message.reply(`Mentionnez un membre valide.`);
        if (target.id === message.author.id) return message.reply(`Vous ne pouvez pas vous voler vous-même.`);

        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const cooldown  = client.db.get(`cooldown_rob_${guildId}`) || 86400000;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const lastRob = client.db.get(`rob_last_${userId}_${guildId}`) || 0;
        const now = Date.now();
        if (now - lastRob < cooldown) {
            const rem = cooldown - (now - lastRob);
            const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
            return message.reply(`⏳ Cooldown ! Réessayez dans **${m}m ${s}s**.`);
        }

        const targetHand = client.db.get(`coin_hand_${target.id}_${guildId}`) || 0;
        if (targetHand <= 0) return message.reply(`${target} n'a rien en main !`);

        client.db.set(`rob_last_${userId}_${guildId}`, now);

        const successRate = (client.db.get(`rob_success_rate_${guildId}`) ?? 65) / 100;
        const fineMin     = client.db.get(`rob_fine_min_${guildId}`) || 20;
        const fineMax     = client.db.get(`rob_fine_max_${guildId}`) || 70;

        const success = Math.random() < successRate;
        if (success) {
            const stolen = Math.floor(targetHand * (Math.random() * 0.3 + 0.1));
            client.db.subtract(`coin_hand_${target.id}_${guildId}`, stolen);
            client.db.add(`coin_hand_${userId}_${guildId}`, stolen);
            target.user.send(`🚨 **${message.author.tag}** vous a volé **${stolen} ${coinEmoji}** sur le serveur **${message.guild.name}** !`).catch(() => {});
            message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#F1C40F').setTimestamp()
                .setTitle('🦹 Vol réussi !')
                .setDescription(`${message.author} a volé **${stolen} ${coinEmoji}** à ${target} !`)
            ]}));
        } else {
            const fine = Math.floor(Math.random() * (fineMax - fineMin + 1)) + fineMin;
            const hand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            client.db.subtract(`coin_hand_${userId}_${guildId}`, Math.min(fine, hand));
            message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245').setTimestamp()
                .setTitle('🚔 Vol raté !')
                .setDescription(`${message.author} s'est fait attraper et a perdu **${Math.min(fine, hand)} ${coinEmoji}** d'amende !`)
            ]}));
        }
    }
};
