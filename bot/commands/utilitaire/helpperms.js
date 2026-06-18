const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: "helpperms",
    aliases: ["hp", "hperms"],
    description: "Affiche les commandes triées par niveau de permission (owners uniquement)",
    category: "utilitaire",
    ownerOnly: true,
    usage: ["helpperms"],

    run: async (client, message, args, color, prefix, footer, commandName) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;

        if (!isOwner) return message.channel.send({ embeds: [
            new Discord.EmbedBuilder()
                .setColor('#e74c3c')
                .setDescription(`❌ Cette commande est réservée aux **owners** du bot.`)
        ]});

        const guildId = message.guild.id;

        const LEVELS = [
            { value: 'perm_hp_public', label: '🌍 Permission publique',  key: 'public' },
            { value: 'perm_hp_1',      label: '1️⃣ Permission 1',          key: '1' },
            { value: 'perm_hp_2',      label: '2️⃣ Permission 2',          key: '2' },
            { value: 'perm_hp_3',      label: '3️⃣ Permission 3',          key: '3' },
            { value: 'perm_hp_4',      label: '4️⃣ Permission 4',          key: '4' },
            { value: 'perm_hp_5',      label: '5️⃣ Permission 5',          key: '5' },
        ];

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selecthelpperms')
                .setPlaceholder('Sélectionner un niveau de permission...')
                .addOptions(LEVELS.map(l => ({
                    label: l.label,
                    description: `Voir les commandes avec ${l.key === 'public' ? 'permission publique' : `permission ${l.key}`}`,
                    value: l.value,
                })))
        );

        // Build summary
        const summary = LEVELS.map(l => {
            const cmds = [];
            client.commands.forEach(c => {
                if (client.db.get(`perm_${c.name}.${guildId}`) === l.key) cmds.push(c.name);
            });
            return `**${l.label}** — ${cmds.length} commande(s)`;
        }).join('\n');

        const embed = new Discord.EmbedBuilder()
            .setTitle('🔐 NΞXUS — Commandes par Permission (Owners)')
            .setDescription(
                `Sélectionnez un niveau de permission pour voir les commandes assignées.\n\n${summary}\n\n` +
                `*Configurer : \`${prefix}perm <commande> <1-5|public>\`*`
            )
            .setColor(color);

        const msg = await message.channel.send(v2({ embeds: [embed], components: [row] }));
        client.db.set(`helpperms_author_${guildId}_${msg.id}`, message.author.id);
    }
};
