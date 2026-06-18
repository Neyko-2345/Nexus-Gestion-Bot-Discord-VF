const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const STYLE_MAP = {
    primary: Discord.ButtonStyle.Primary,
    secondary: Discord.ButtonStyle.Secondary,
    success: Discord.ButtonStyle.Success,
    danger: Discord.ButtonStyle.Danger,
    bleu: Discord.ButtonStyle.Primary,
    gris: Discord.ButtonStyle.Secondary,
    vert: Discord.ButtonStyle.Success,
    rouge: Discord.ButtonStyle.Danger,
};

module.exports = {
    name: "panel",
    aliases: ["filmpanel", "panelfilm"],
    description: "Affiche le panel Films & Séries",
    category: "film",
    ownerOnly: true,
    usage: ["panel"],

    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;

        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#ED4245')
            .setDescription('❌ Seuls les owners peuvent afficher le panel films.')
        ]});

        const filmChannels = client.db.get(`film_channels_${guildId}`) || [];
        if (filmChannels.length > 0 && !filmChannels.includes(message.channel.id)) {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎬 Salon incorrect')
                .setDescription(`La commande \`${prefix}panel\` ne peut s'utiliser que dans le salon Film configuré.`)
            ]}));
        }

        const films    = client.db.get(`films_${guildId}`);
        const total    = films ? films.length : 0;
        const panelCfg = client.db.get(`film_panel_config_${guildId}`) || {};

        // false = champ volontairement supprimé (via "no"), undefined/absent = valeur par défaut
        const applyPanelVars = (str) => str
            .replace(/\{total\}/g, total)
            .replace(/\{guild\}/g, message.guild.name);

        const panelTitle = panelCfg.title === false
            ? null
            : applyPanelVars(panelCfg.title || '🍿 Panel Films & Séries');

        const panelDescription = applyPanelVars(panelCfg.description || (
            `Bienvenue dans le panel Films & Séries !\n` +
            `**{total}** film(s)/série(s) disponibles dans le catalogue.\n\n` +
            `🔎 **Rechercher** — Trouvez un film par titre\n` +
            `💡 **Suggérer** — Proposez un film à ajouter\n` +
            `📋 **Catalogue** — Parcourez par catégorie`
        ));

        const panelColor = panelCfg.color || '#5865F2';

        // Récupère la config des boutons depuis la db
        const btnCfg = client.db.get(`film_btn_config_${guildId}`) || {};

        const makeBtn = (id, defLabel, defStyle) => {
            const cfg     = btnCfg[id] || {};
            const label   = cfg.label || defLabel;
            const style   = STYLE_MAP[(cfg.style || '').toLowerCase()] || defStyle;
            const emoji   = cfg.emoji || null;
            const btn = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style);
            if (emoji) try { btn.setEmoji(emoji); } catch {}
            return btn;
        };

        const embed = new Discord.EmbedBuilder()
            .setDescription(panelDescription)
            .setColor(panelColor);

        if (panelTitle) embed.setTitle(panelTitle);

        // thumbnail / image : false = supprimé (falsy → aucun appel)
        if (panelCfg.thumbnail) embed.setThumbnail(panelCfg.thumbnail);
        if (panelCfg.image)     embed.setImage(panelCfg.image);

        const row = new ActionRowBuilder().addComponents(
            makeBtn('panel_film_search',   '🔎 Rechercher', Discord.ButtonStyle.Secondary),
            makeBtn('panel_film_suggest',  '💡 Suggérer',   Discord.ButtonStyle.Secondary),
            makeBtn('panel_film_catalogue','📋 Catalogue',  Discord.ButtonStyle.Primary),
        );

        message.channel.send(v2({ embeds: [embed], components: [row] }));
    }
};
