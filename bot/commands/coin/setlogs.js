const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setlogs",
    aliases: ["logsconfig"],
    description: "Configure les salons de logs pour le bot coin",
    category: "coin",
    ownerOnly: true,
    usage: ["setlogs <transactions|casino|team|entreprise|drop|rob|all> <#salon|off>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['transactions', 'casino', 'team', 'entreprise', 'drop', 'rob', 'all'];
        const type = args[0];

        if (!type) {
            const lines = types.map(t => {
                const chId = client.db.get(`coinlog_${t}_${guildId}`);
                return `**${t}** — ${chId ? `<#${chId}>` : 'non configuré'}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📝 Logs Coin configurés')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);

        if (args[1] === 'off') {
            if (type === 'all') types.filter(t => t !== 'all').forEach(t => client.db.delete(`coinlog_${t}_${guildId}`));
            else client.db.delete(`coinlog_${type}_${guildId}`);
            return message.reply(`✅ Logs **${type}** désactivés.`);
        }

        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if (!ch) return message.reply(`Mentionnez un salon valide ou utilisez \`off\`.`);

        if (type === 'all') {
            types.filter(t => t !== 'all').forEach(t => client.db.set(`coinlog_${t}_${guildId}`, ch.id));
        } else {
            client.db.set(`coinlog_${type}_${guildId}`, ch.id);
        }
        message.reply(`✅ Logs **${type}** → ${ch}.`);
    }
};
