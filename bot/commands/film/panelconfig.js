const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

/**
 * &panelconfig <title> | <description> | <footer> | <footer_icon> | <image> | <thumbnail> | <color>
 *
 * Pour chaque champ :
 *   no  → vider ce champ (supprime la valeur)
 *   yes → garder la valeur actuelle (ne change rien)
 *   autre chose → définir comme nouvelle valeur
 *
 * Exemple : &panelconfig no | yes | Mon footer | no | https://img.com/bg.png | no | #FF0000
 */
module.exports = {
    name: "panelconfig",
    aliases: ["pconfig", "configpanel"],
    description: "Configure le panel film via une seule commande (owner uniquement)",
    category: "film",
    ownerOnly: true,
    usage: ["panelconfig <title> | <description> | <footer> | <footer_icon> | <image> | <thumbnail> | <color>"],

    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId  = message.guild.id;
        const panelCfg = client.db.get(`film_panel_config_${guildId}`) || {};

        // Pas d'arguments → affiche la config actuelle
        if (!args.length) {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 Configuration Panel Film')
                .setColor(panelCfg.color || '#5865F2')
                .setDescription(
                    `**Titre :** ${panelCfg.title       || '*(défaut)*'}\n` +
                    `**Description :** ${panelCfg.description ? '*(définie)*' : '*(défaut)*'}\n` +
                    `**Footer :** ${panelCfg.footer      || '*(défaut)*'}\n` +
                    `**Footer icon :** ${panelCfg.footer_icon ? `[url](${panelCfg.footer_icon})` : '*(aucun)*'}\n` +
                    `**Image :** ${panelCfg.image        ? `[url](${panelCfg.image})`        : '*(aucune)*'}\n` +
                    `**Thumbnail :** ${panelCfg.thumbnail ? `[url](${panelCfg.thumbnail})`   : '*(aucune)*'}\n` +
                    `**Couleur :** ${panelCfg.color       || '*(défaut #5865F2)*'}\n\n` +
                    `**Syntaxe :** \`${prefix}panelconfig <title> | <description> | <footer> | <footer_icon> | <image> | <thumbnail> | <color>\`\n` +
                    `• \`no\` = vider ce champ\n` +
                    `• \`yes\` = garder la valeur actuelle\n` +
                    `• autre texte = nouvelle valeur\n\n` +
                    `**Exemple :**\n\`${prefix}panelconfig 🍿 Films | yes | .gg/n2xus | no | no | no | #5865F2\``
                )
            ]}));
        }

        // Parser les champs séparés par |
        const fullText = message.content.slice(message.content.indexOf(args[0]));
        const parts    = fullText.split('|').map(p => p.trim());

        const FIELDS       = ['title', 'description', 'footer', 'footer_icon', 'image', 'thumbnail', 'color'];
        const SUPPRESSABLE = ['title', 'image', 'thumbnail', 'footer', 'footer_icon'];
        const changes = [];

        for (let idx = 0; idx < FIELDS.length; idx++) {
            const field = FIELDS[idx];
            const val   = parts[idx];
            if (val === undefined || val === '') continue; // non fourni → skip

            if (val.toLowerCase() === 'no') {
                if (SUPPRESSABLE.includes(field)) {
                    // Champ supprimable : stocker false = entièrement absent de l'embed
                    panelCfg[field] = false;
                    changes.push(`🚫 **${field}** → supprimé (n'apparaîtra plus dans l'embed)`);
                } else {
                    // description / color : "no" = retour au défaut
                    delete panelCfg[field];
                    changes.push(`❌ **${field}** → remis par défaut`);
                }
            } else if (val.toLowerCase() === 'yes') {
                if (panelCfg[field] === false) {
                    // Réactiver un champ supprimé
                    delete panelCfg[field];
                    changes.push(`✅ **${field}** → réactivé (valeur par défaut)`);
                } else {
                    changes.push(`✅ **${field}** → conservé`);
                }
            } else {
                // Validation spécifique
                if (field === 'color' && !/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    return message.reply(`❌ Couleur invalide pour \`color\` : format \`#RRGGBB\` requis (ex: \`#5865F2\`).`);
                }
                if (['image', 'thumbnail', 'footer_icon'].includes(field) && !val.startsWith('http')) {
                    return message.reply(`❌ URL invalide pour \`${field}\` : doit commencer par \`http\`.`);
                }
                panelCfg[field] = val;
                const preview = val.length > 50 ? val.substring(0, 50) + '…' : val;
                changes.push(`✏️ **${field}** → \`${preview}\``);
            }
        }

        if (changes.length === 0) {
            return message.reply(`Aucune modification effectuée. Vérifiez la syntaxe avec \`${prefix}panelconfig\`.`);
        }

        client.db.set(`film_panel_config_${guildId}`, panelCfg);

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('✅ Panel mis à jour')
            .setDescription(changes.join('\n'))
            .setColor(panelCfg.color || '#57F287').setTimestamp()
        ]}));
    }
};
