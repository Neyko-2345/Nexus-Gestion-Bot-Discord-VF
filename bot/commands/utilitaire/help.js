const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');

const CARTE_SUBCATS = [
    { key: 'carte_main', label: '<:icontb:1516711894122237962> Cartes', names: ['booster', 'inventaire', 'collection'] },
];

const COIN_SUBCATS = [
    { key: 'coin_eco',        label: '💰 Économie',       names: ['balance','deposit','withdraw','pay','daily','work','profile','top','convert','drop','rob','rep'] },
    { key: 'coin_casino',     label: '🎰 Casino / Jeux',  names: ['casino','slots','blackjack','pfc','crash'] },
    { key: 'coin_mine',       label: '⛏️ Mine',            names: ['mine','minerais','sellminerais'] },
    { key: 'coin_shop',       label: '🛒 Shop',            names: ['shop','buy','convertshop'] },
    { key: 'coin_alliance',   label: '⚔️ Alliance/Teams', names: ['tcreate','tdelete','tinfos','tinvite','tkick','tleave','tpromote','tdemote','tdep','twith','tbuy','tshop','tarmy','tarmysend','tattack','ttop','tedit','trep','tguide'] },
    { key: 'coin_entreprise', label: '🏢 Entreprise',      names: ['entreprise','licencier','recruter','entreprisedelete','empedit','entnotif'] },
    { key: 'coin_illegal',    label: '🌿 Illégal',         names: ['mobil','recolt'] },
];

module.exports = {
    name: "help",
    aliases: ["h"],
    description: "Affiche les commandes du Bot Coin (salon coin uniquement)",
    category: "utilitaire",
    ownerOnly: false,
    usage: ["help", "help [commande]"],

    run: async (client, message, args, color, prefix, footer, commandName) => {
        const guildId = message.guild.id;
        const coinChannels = client.db.get(`coin_channels_${guildId}`) || [];

        if (coinChannels.length > 0 && !coinChannels.includes(message.channel.id)) {
            return message.channel.send({ embeds: [
                new Discord.EmbedBuilder()
                    .setColor('#e74c3c')
                    .setDescription(`❌ Cette commande n'est disponible que dans le salon **Coin** configuré par les owners.\n\nConfigurer le salon : \`${prefix}coinconfig salon add #salon\``)
            ]});
        }

        if (args[0]) {
            const cmd = client.commands.get(args[0].toLowerCase()) || client.commands.find(c => c.aliases?.includes(args[0].toLowerCase()));
            if (!cmd) return message.reply(`Commande \`${args[0]}\` introuvable.`);
            return message.reply(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle(`📖 ${cmd.name}`)
                .setDescription(cmd.description || 'Aucune description.')
                .addFields({ name: 'Utilisation', value: cmd.usage?.map(u => `\`${prefix}${u}\``).join('\n') || `\`${prefix}${cmd.name}\`` })
                .addFields({ name: 'Aliases', value: cmd.aliases?.length ? cmd.aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'Aucun', inline: true })
                .setColor(color)
            ]}));
        }

        const ALL_SUBCATS = [...CARTE_SUBCATS, ...COIN_SUBCATS];

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_coin_sub_select')
                .setPlaceholder('Choisir une catégorie...')
                .addOptions(ALL_SUBCATS.map(s => ({ label: s.label.replace(/<:[^>]+>/g, '').trim() || s.label, value: s.key })))
        );

        const embed = new Discord.EmbedBuilder()
            .setTitle('💰 Bot Coin — Aide')
            .setDescription(
                `Sélectionnez une catégorie dans le menu ci-dessous.\n\n` +
                ALL_SUBCATS.map(s => `**${s.label}**`).join('\n') +
                `\n\n*\`${prefix}help [commande]\` pour les détails d'une commande*`
            )
            .setColor('#F1C40F');

        const msg = await message.channel.send(v2({ embeds: [embed], components: [row] }));
        client.db.set(`help_author_${guildId}_${msg.id}`, message.author.id);
    }
};
