const Discord = require('discord.js');

const { v2 } = require('../../utils/v2');
module.exports = {
    name: 'interactionCreate',
    run: async (client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== 'selecthelpperms') return;

        const color = client.db.get(`color_${interaction.guildId}`) || client.color;
        const prefix = client.db.get(`prefix_${interaction.guildId}`) || client.prefix;
        const footer = client.footer;

        const authorId = client.db.get(`helpperms_author_${interaction.guildId}_${interaction.message.id}`);
        if (authorId && authorId !== interaction.user.id) {
            return interaction.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
        }

        const key = interaction.values[0].replace('perm_hp_', '');
        const label = key === 'public' ? '🌍 Permission publique' : `Permission ${key}`;

        const cmds = [];
        client.commands.forEach(c => {
            if (client.db.get(`perm_${c.name}.${interaction.guildId}`) === key) {
                cmds.push({ name: c.name, description: c.description || '' });
            }
        });

        const ITEMS_PER_PAGE = 10;
        const lines = cmds.length > 0
            ? cmds.map(c => `\`${prefix}${c.name}\`\n${c.description || 'Aucune description.'}`)
            : ['Aucune commande assignée à ce niveau.'];

        const chunks = [];
        let current = [];
        lines.forEach(l => {
            current.push(l);
            if (current.length >= ITEMS_PER_PAGE) { chunks.push(current); current = []; }
        });
        if (current.length > 0) chunks.push(current);
        if (chunks.length === 0) chunks.push(['Aucune commande.']);

        const pages = chunks.map((ch, i) => new Discord.EmbedBuilder()
            .setTitle(`${label}${chunks.length > 1 ? ` (${i + 1}/${chunks.length})` : ''}`)
            .setDescription(`*${cmds.length} commande(s) assignée(s)*\n\n${ch.join('\n\n')}`)
            .setColor(color)
        );

        interaction.update(v2({ embeds: [pages[0]], components: [] }));
    }
};
