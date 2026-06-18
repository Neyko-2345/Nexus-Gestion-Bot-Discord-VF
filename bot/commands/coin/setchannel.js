const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setchannel",
    aliases: ["channelconfig"],
    description: "Définit les salons interactifs (leaderboard, hdv, logs...)",
    category: "coin",
    ownerOnly: true,
    usage: ["setchannel <leaderboard|hdv|logs|drop|coin_add|coin_remove> <#salon|off>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['leaderboard', 'hdv', 'logs', 'drop', 'coin_add', 'coin_remove'];
        const type = args[0];

        if (!type) {
            const lines = types.map(t => {
                const chId = client.db.get(`special_channel_${t}_${guildId}`);
                return `**${t}** — ${chId ? `<#${chId}>` : 'non configuré'}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📺 Salons spéciaux')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);

        if (args[1] === 'off') {
            client.db.delete(`special_channel_${type}_${guildId}`);
            return message.reply(`✅ Salon **${type}** désactivé.`);
        }

        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if (!ch) return message.reply(`Mentionnez un salon valide ou utilisez \`off\`.`);

        client.db.set(`special_channel_${type}_${guildId}`, ch.id);
        message.reply(`✅ Salon **${type}** : ${ch}.`);
    }
};
