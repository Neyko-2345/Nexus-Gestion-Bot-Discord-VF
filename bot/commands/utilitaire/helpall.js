const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const ALL_CATEGORIES = [
    { key: 'antiraid',    label: '🛡️ Anti-Raid',                                     cats: ['antiraid'] },
    { key: 'moderation',  label: '🔨 Modération',                                    cats: ['moderation'] },
    { key: 'gestion',     label: '⚙️ Gestion',                                       cats: ['gestion'] },
    { key: 'logs',        label: '📋 Logs',                                           cats: ['logs'] },
    { key: 'utilitaire',  label: '🔧 Utilitaires',                                   cats: ['utilitaire'] },
    { key: 'botcontrol',  label: '🤖 Bot Control',                                   cats: ['bot gestion', 'botcontrol'] },
    { key: 'coin',        label: '💰 Bot Coin',                                       cats: ['coin'] },
    { key: 'cartes',      label: '<:icontb:1516711894122237962> Cartes (Owner)',      cats: ['cartes'] },
    { key: 'film',        label: '🎬 Bot Film',                                       cats: ['film'] },
];

module.exports = {
    name: "helpall",
    aliases: [],
    description: "Affiche toutes les commandes par catégorie (owners uniquement)",
    category: "utilitaire",
    ownerOnly: true,
    usage: ["helpall"],

    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;

        if (!isOwner) return message.channel.send({ embeds: [
            new Discord.EmbedBuilder()
                .setColor('#e74c3c')
                .setDescription(`❌ Cette commande est réservée aux **owners** du bot.`)
        ]});

        const guildId = message.guild.id;

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('helpall_cat_select')
                .setPlaceholder('Sélectionner une catégorie...')
                .addOptions(ALL_CATEGORIES.map(c => {
                    const opt = { label: c.optLabel || c.label.replace(/<:[^>]+>\s*/g, '').trim(), value: c.key };
                    if (c.optEmoji) opt.emoji = c.optEmoji;
                    return opt;
                }))
        );

        const embed = new Discord.EmbedBuilder()
            .setTitle('📖 NΞXUS — Aide complète (Owners)')
            .setDescription(
                `Sélectionnez une catégorie pour voir toutes les commandes avec leur description.\n\n` +
                ALL_CATEGORIES.map(c => `**${c.label}**`).join('\n') +
                `\n\n*\`${prefix}helpall\` — commandes et descriptions complètes*`
            )
            .setColor(color);

        const msg = await message.channel.send(v2({ embeds: [embed], components: [row] }));
        client.db.set(`helpall_author_${guildId}_${msg.id}`, message.author.id);
    }
};
