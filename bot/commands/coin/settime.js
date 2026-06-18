const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "settime",
    aliases: ["cooldownconfig"],
    description: "Modifie les cooldowns des commandes",
    category: "coin",
    ownerOnly: true,
    usage: ["settime <work|daily|mine|rob|drop|casino|slots|crash|pfc|blackjack|rep> <durée (ex: 30m, 2h, 1d)>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['work', 'daily', 'mine', 'rob', 'drop', 'casino', 'slots', 'crash', 'pfc', 'blackjack', 'rep'];
        const type = args[0];
        const timeStr = args[1];

        if (!type) {
            const lines = types.map(t => {
                const ms = client.db.get(`cooldown_${t}_${guildId}`);
                if (!ms) return `**${t}** — non configuré`;
                const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
                return `**${t}** — ${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s > 0 ? `${s}s` : ''}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⏱️ Cooldowns actuels')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);
        if (!timeStr) return message.reply(`Indiquez une durée. Ex: 30m, 2h, 1d`);

        const parseMs = (str) => {
            const match = str.match(/^(\d+)(s|m|h|d)$/);
            if (!match) return null;
            const [, n, u] = match;
            const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
            return parseInt(n) * units[u];
        };
        const ms = parseMs(timeStr);
        if (!ms) return message.reply(`Format invalide. Ex: 30m, 2h, 1d`);

        client.db.set(`cooldown_${type}_${guildId}`, ms);
        message.reply(`✅ Cooldown **${type}** réglé à **${timeStr}**.`);
    }
};
