const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "logsall",
    aliases: ["logsglobal", "allogs"],
    description: "Configure le salon de logs global (tous les événements du bot)",
    category: "logs",
    ownerOnly: true,
    usage: ["logsall on [#salon]", "logsall off", "logsall"],

    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`❌ Commande réservée aux owners.`);

        const guildId = message.guild.id;

        if (!args[0]) {
            const chanId = client.db.get(`logsall_${guildId}`);
            const chan = chanId ? message.guild.channels.cache.get(chanId) : null;
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📋 Logs Global')
                .setDescription(
                    `**Salon actuel :** ${chan ? chan : '`Non configuré`'}\n\n` +
                    `**Événements trackés :**\n` +
                    `📥 Arrivées membres\n📤 Départs membres\n🚀 Boosts serveur\n` +
                    `🗑️ Messages supprimés\n✏️ Messages modifiés\n🎭 Rôles ajoutés/retirés (membres)\n` +
                    `🏷️ Rôles créés/supprimés (serveur)\n📣 Salons créés/supprimés\n` +
                    `🔗 Invitations créées/expirées\n🔧 Modifications du serveur\n🎤 Activité vocale\n\n` +
                    `*\`${prefix}logsall on #salon\` — Activer | \`${prefix}logsall off\` — Désactiver*`
                )
                .setColor(color)
            ]}));
        }

        if (args[0] === 'on') {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) || message.channel;
            client.db.set(`logsall_${guildId}`, channel.id);
            return message.reply(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('✅ Logs Global activés')
                .setDescription(
                    `Tous les événements seront envoyés dans ${channel}.\n\n` +
                    `📥 Arrivées • 📤 Départs • 🚀 Boosts\n` +
                    `🗑️ Messages supprimés • ✏️ Modifiés\n` +
                    `🎭 Rôles membres • 🏷️ Rôles serveur\n` +
                    `📣 Salons • 🔗 Invitations • 🔧 Serveur • 🎤 Vocal`
                )
                .setColor('#57F287')
            ]}));
        }

        if (args[0] === 'off') {
            client.db.delete(`logsall_${guildId}`);
            return message.reply(`✅ Logs global désactivés.`);
        }

        message.reply(`Usage : \`${prefix}logsall on #salon\` | \`${prefix}logsall off\` | \`${prefix}logsall\``);
    }
};
