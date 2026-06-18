const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const CATEGORIES = [
    { value: 'comedie',          label: 'Comédie'        },
    { value: 'histoire',         label: 'Histoire'        },
    { value: 'science-fiction',  label: 'Science-Fiction' },
    { value: 'romance',          label: 'Romance'         },
    { value: 'thriller',         label: 'Thriller'        },
    { value: 'cinema',           label: 'Cinéma'          },
    { value: 'drame',            label: 'Drame'           },
    { value: 'horreur',          label: 'Horreur'         },
    { value: 'guerre',           label: 'Guerre'          },
    { value: 'action',           label: 'Action'          },
    { value: 'anime',            label: 'Animé'           },
    { value: 'super-heros',      label: 'Super-Héros'     },
    { value: 'animation',        label: 'Animation'       },
    { value: 'fantaisie',        label: 'Fantaisie'       },
];

const DEFAULT_SUGGEST_CHANNEL = '1508451206446579874';

const VALID_STYLES = ['primary', 'secondary', 'success', 'danger', 'bleu', 'gris', 'vert', 'rouge'];

module.exports = {
    name: "filmconfig",
    aliases: ["filmconf", "fc"],
    description: "Configure le Bot Film (owner uniquement)",
    category: "film",
    ownerOnly: true,
    usage: [
        "filmconfig salon add/remove #salon",
        "filmconfig logs suggestion/films/avis #salon",
        "filmconfig suggestions set/remove/info [#salon]",
        "filmconfig buttons <rechercher|suggerer|catalogue> <style> <label> [emoji]",
        "filmconfig add <nom> | <desc> | <image> | <lien> | <ep> | <categorie>",
        "filmconfig remove <nom>",
        "filmconfig list [categorie]",
        "filmconfig panelconfig title/description/image/thumbnail/footer/footer_icon/color <valeur>",
        "filmconfig panelconfig variables",
        "filmconfig panelconfig reset",
    ],

    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`❌ Commande réservée aux owners.`);

        const guildId = message.guild.id;
        const sub     = args[0]?.toLowerCase();

        // ─────────────────── Affichage global ───────────────────
        if (!sub) {
            const filmChans   = client.db.get(`film_channels_${guildId}`) || [];
            const logSug      = client.db.get(`logs.suggestions_${guildId}`);
            const logFilms    = client.db.get(`logs.films_${guildId}`);
            const logAvis     = client.db.get(`logs.avis_${guildId}`);
            const suggestChan = client.db.get(`film_suggest_channel_${guildId}`) || DEFAULT_SUGGEST_CHANNEL;
            const films       = client.db.get(`films_${guildId}`) || [];
            const panelCfg    = client.db.get(`film_panel_config_${guildId}`) || {};
            const btnCfg      = client.db.get(`film_btn_config_${guildId}`)   || {};

            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 Configuration Bot Film')
                .setDescription(
                    `**Salons film :** ${filmChans.map(id => `<#${id}>`).join(', ') || '`Non configuré`'}\n` +
                    `**Logs suggestions :** ${logSug ? `<#${logSug}>` : '`Non configuré`'}\n` +
                    `**Logs films ajoutés :** ${logFilms ? `<#${logFilms}>` : '`Non configuré`'}\n` +
                    `**Logs avis :** ${logAvis ? `<#${logAvis}>` : '`Non configuré`'}\n` +
                    `**Salon suggestions membres :** <#${suggestChan}>\n` +
                    `**Films en base :** ${films.length}\n` +
                    `**Panel titre :** ${panelCfg.title || '*(défaut)*'}\n` +
                    `**Panel couleur :** ${panelCfg.color || '*(défaut)*'}\n` +
                    `**Boutons configurés :** ${Object.keys(btnCfg).length > 0 ? 'Oui' : 'Non (défaut)'}\n\n` +
                    `*\`${prefix}filmconfig help\` pour voir toutes les commandes*`
                )
                .setColor('#5865F2')
            ]}));
        }

        // ─────────────────── Help ───────────────────
        if (sub === 'help') {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 filmconfig — Commandes disponibles')
                .setColor('#5865F2')
                .setDescription(
                    `\`${prefix}filmconfig salon add #salon\` — Ajouter un salon film\n` +
                    `\`${prefix}filmconfig salon remove #salon\` — Retirer un salon film\n` +
                    `\`${prefix}filmconfig logs suggestion #salon\` — Salon logs suggestions owner\n` +
                    `\`${prefix}filmconfig logs films #salon\` — Salon logs films ajoutés\n` +
                    `\`${prefix}filmconfig logs avis #salon\` — Salon logs avis\n` +
                    `\`${prefix}filmconfig suggestions set #salon\` — Salon suggestions membres (défaut: <#${DEFAULT_SUGGEST_CHANNEL}>)\n` +
                    `\`${prefix}filmconfig suggestions remove\` — Remettre le salon par défaut\n` +
                    `\`${prefix}filmconfig suggestions info\` — Voir le salon actuel\n` +
                    `\`${prefix}filmconfig buttons <rechercher|suggerer|catalogue> <style> <label> [emoji]\` — Config des boutons\n` +
                    `  Styles: \`primary\`(bleu) \`secondary\`(gris) \`success\`(vert) \`danger\`(rouge)\n` +
                    `\`${prefix}filmconfig buttons reset\` — Remettre les boutons par défaut\n` +
                    `\`${prefix}filmconfig add <nom> | <desc> | <image> | <lien> | <ep> | <categorie>\` — Ajouter un film\n` +
                    `\`${prefix}filmconfig remove <nom>\` — Supprimer un film\n` +
                    `\`${prefix}filmconfig list [categorie]\` — Lister les films\n` +
                    `\`${prefix}filmconfig panelconfig title/description/image/thumbnail/footer/footer_icon/color <val>\`\n` +
                    `\`${prefix}filmconfig panelconfig reset\` — Panel par défaut\n` +
                    `\`${prefix}filmconfig categories add <valeur> <label>\` — Ajouter une catégorie\n` +
                    `\`${prefix}filmconfig categories remove <valeur>\` — Supprimer une catégorie\n` +
                    `\`${prefix}filmconfig categories reset\` — Remettre les catégories par défaut\n` +
                    `\`${prefix}filmconfig categories list\` — Voir toutes les catégories\n` +
                    `\`${prefix}filmconfig filmembed color <#hex>\` — Couleur embed résultat\n` +
                    `\`${prefix}filmconfig filmembed title <template>\` — Titre (vars: {titre} {genre} ...)\n` +
                    `\`${prefix}filmconfig filmembed description <template>\` — Description embed\n` +
                    `\`${prefix}filmconfig filmembed variables\` — Variables dispo\n` +
                    `\`${prefix}filmconfig filmembed reset|info\` — Reset / voir config\n` +
                    `\`${prefix}filmconfig logsrecherches set #salon\` — Logs des recherches\n` +
                    `\`${prefix}filmconfig logsrecherches remove|info\` — Gérer logs recherches\n` +
                    `\`${prefix}panelconfig\` — Config panel avancée (no/yes/valeur)\n\n` +
                    `**Catégories par défaut :**\n` + CATEGORIES.map(c => `\`${c.value}\``).join(', ')
                )
            ]}));
        }

        // ─────────────────── Suggestions (salon membres) ───────────────────
        if (sub === 'suggestions') {
            const action = args[1]?.toLowerCase();

            if (action === 'set') {
                const chan = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
                if (!chan) return message.reply(`❌ Mentionnez ou fournissez l'ID du salon.`);
                client.db.set(`film_suggest_channel_${guildId}`, chan.id);
                return message.reply(`✅ Salon de suggestions membres → ${chan}`);
            }
            if (action === 'remove') {
                client.db.delete(`film_suggest_channel_${guildId}`);
                return message.reply(`✅ Salon de suggestions remis par défaut (<#${DEFAULT_SUGGEST_CHANNEL}>).`);
            }
            if (action === 'info') {
                const current = client.db.get(`film_suggest_channel_${guildId}`) || DEFAULT_SUGGEST_CHANNEL;
                return message.reply(`📌 Salon de suggestions actuel : <#${current}>${current === DEFAULT_SUGGEST_CHANNEL ? ' *(salon par défaut)*' : ''}`);
            }
            return message.reply(`Usage : \`${prefix}filmconfig suggestions set #salon\` | \`remove\` | \`info\``);
        }

        // ─────────────────── Buttons (config boutons panel) ───────────────────
        if (sub === 'buttons') {
            const btnTarget = args[1]?.toLowerCase();

            if (btnTarget === 'reset') {
                client.db.delete(`film_btn_config_${guildId}`);
                return message.reply(`✅ Boutons du panel remis aux valeurs par défaut.`);
            }

            if (btnTarget === 'info') {
                const btnCfg = client.db.get(`film_btn_config_${guildId}`) || {};
                const info   = ['rechercher', 'suggerer', 'catalogue'].map(k => {
                    const c = btnCfg[k] || {};
                    return `**${k}** — label: \`${c.label||'défaut'}\` | style: \`${c.style||'défaut'}\` | emoji: \`${c.emoji||'aucun'}\``;
                }).join('\n');
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🔘 Config des boutons panel').setDescription(info).setColor('#5865F2')
                ]}));
            }

            const BTN_IDS = {
                rechercher: 'panel_film_search',
                suggerer:   'panel_film_suggest',
                catalogue:  'panel_film_catalogue',
            };
            if (!BTN_IDS[btnTarget]) return message.reply(`Bouton inconnu. Valides : \`rechercher\`, \`suggerer\`, \`catalogue\``);

            // &filmconfig buttons <cible> <style> <label> [emoji]
            const btnStyle = args[2];
            const btnLabel = args[3] ? args.slice(3).join(' ').split('|')[0].trim() : null;
            const btnEmoji = args[3] ? (args.slice(3).join(' ').split('|')[1]?.trim() || null) : null;

            if (!btnStyle) return message.reply(`Usage : \`${prefix}filmconfig buttons ${btnTarget} <style> <label> [emoji via |]\`\nEx: \`${prefix}filmconfig buttons rechercher secondary 🔎 Chercher | 🔎\``);
            if (!VALID_STYLES.includes(btnStyle.toLowerCase())) return message.reply(`Style invalide. Valides : ${VALID_STYLES.map(s=>`\`${s}\``).join(', ')}`);

            const btnCfg = client.db.get(`film_btn_config_${guildId}`) || {};
            btnCfg[btnTarget] = {
                style: btnStyle.toLowerCase(),
                label: btnLabel || btnCfg[btnTarget]?.label,
                emoji: btnEmoji || btnCfg[btnTarget]?.emoji || null,
            };
            client.db.set(`film_btn_config_${guildId}`, btnCfg);
            return message.reply(`✅ Bouton **${btnTarget}** mis à jour : style=\`${btnStyle}\` label=\`${btnLabel || '(inchangé)'}\` emoji=\`${btnEmoji || 'aucun'}\``);
        }

        // ─────────────────── panelconfig ───────────────────
        if (sub === 'panelconfig') {
            const field = args[1]?.toLowerCase();
            const value = args.slice(2).join(' ');
            const PANEL_FIELDS      = ['title', 'description', 'image', 'thumbnail', 'footer', 'footer_icon', 'color'];
            const SUPPRESSABLE      = ['title', 'image', 'thumbnail', 'footer', 'footer_icon'];

            const fieldStatus = (panelCfg, f) => {
                if (panelCfg[f] === false)     return '*(supprimé — inactif)*';
                if (!panelCfg[f])              return '*(défaut)*';
                if (['image','thumbnail','footer_icon'].includes(f)) return `[url](${panelCfg[f]})`;
                return panelCfg[f];
            };

            if (!field) {
                const panelCfg = client.db.get(`film_panel_config_${guildId}`) || {};
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🎬 Configuration du Panel Film')
                    .setColor(panelCfg.color || '#5865F2')
                    .setDescription(
                        `**Titre :** ${fieldStatus(panelCfg,'title')}\n` +
                        `**Description :** ${panelCfg.description ? '*(définie)*' : '*(défaut)*'}\n` +
                        `**Image :** ${fieldStatus(panelCfg,'image')}\n` +
                        `**Thumbnail :** ${fieldStatus(panelCfg,'thumbnail')}\n` +
                        `**Footer :** ${fieldStatus(panelCfg,'footer')}\n` +
                        `**Footer icon :** ${fieldStatus(panelCfg,'footer_icon')}\n` +
                        `**Couleur :** ${panelCfg.color || '*(défaut #5865F2)*'}\n\n` +
                        `Utilisez \`${prefix}filmconfig panelconfig <champ> <valeur>\`\n` +
                        `• \`no\` → supprime entièrement le champ de l'embed\n` +
                        `• \`yes\` → réactive le champ avec la valeur par défaut\n` +
                        `• autre valeur → définit une valeur personnalisée\n` +
                        `Champs : ${PANEL_FIELDS.map(f=>`\`${f}\``).join(', ')}, \`reset\``
                    )
                ]}));
            }
            if (field === 'variables') {
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📌 Variables — Panelconfig')
                    .setColor('#5865F2')
                    .setDescription(
                        '**Variables utilisables dans le `title` et la `description` du panel :**\n\n' +
                        '`{total}` — Nombre total de films/séries dans le catalogue\n' +
                        '`{guild}` — Nom du serveur\n\n' +
                        '**Exemples :**\n' +
                        `\`${prefix}filmconfig panelconfig title 🍿 {guild} — Films & Séries\`\n` +
                        `\`${prefix}filmconfig panelconfig description Bienvenue ! **{total}** titres disponibles sur **{guild}**.\`\n\n` +
                        `*\`${prefix}filmconfig panelconfig\` pour voir la config actuelle*`
                    )
                ]}));
            }
            if (field === 'reset') {
                client.db.delete(`film_panel_config_${guildId}`);
                return message.reply(`✅ Panel remis aux paramètres par défaut.`);
            }
            if (!PANEL_FIELDS.includes(field)) return message.reply(`Champ inconnu. Valides : ${PANEL_FIELDS.map(f=>`\`${f}\``).join(', ')}, \`variables\`, \`reset\``);

            const panelCfg = client.db.get(`film_panel_config_${guildId}`) || {};

            if (!value) return message.reply(`Usage : \`${prefix}filmconfig panelconfig ${field} <valeur|no|yes>\``);

            if (value.toLowerCase() === 'no') {
                if (!SUPPRESSABLE.includes(field)) {
                    // description et color : "no" = effacement simple (retour défaut)
                    delete panelCfg[field];
                    client.db.set(`film_panel_config_${guildId}`, panelCfg);
                    return message.reply(`✅ \`${field}\` remis à la valeur par défaut.`);
                }
                panelCfg[field] = false;
                client.db.set(`film_panel_config_${guildId}`, panelCfg);
                return message.reply(`✅ \`${field}\` **supprimé** — ce champ n'apparaîtra plus dans l'embed.\nFaites \`${prefix}filmconfig panelconfig ${field} yes\` pour le réactiver.`);
            }

            if (value.toLowerCase() === 'yes') {
                delete panelCfg[field];
                client.db.set(`film_panel_config_${guildId}`, panelCfg);
                return message.reply(`✅ \`${field}\` **réactivé** — la valeur par défaut sera utilisée.`);
            }

            if (field === 'color' && !/^#[0-9A-Fa-f]{6}$/.test(value)) return message.reply(`❌ Format couleur : \`#RRGGBB\` ex: \`#5865F2\``);
            if (['image','thumbnail','footer_icon'].includes(field) && !value.startsWith('http')) return message.reply(`❌ URL invalide — doit commencer par \`http\`.`);

            panelCfg[field] = value;
            client.db.set(`film_panel_config_${guildId}`, panelCfg);
            return message.reply(`✅ \`${field}\` → \`${value.length > 60 ? value.substring(0,60)+'…' : value}\``);
        }

        // ─────────────────── salon ───────────────────
        if (sub === 'salon') {
            const action  = args[1]?.toLowerCase();
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]) || message.channel;
            const filmChans = client.db.get(`film_channels_${guildId}`) || [];
            if (action === 'add') {
                if (filmChans.includes(channel.id)) return message.reply(`${channel} est déjà un salon film.`);
                client.db.push(`film_channels_${guildId}`, channel.id);
                return message.reply(`✅ ${channel} ajouté comme salon film.`);
            }
            if (action === 'remove') {
                client.db.set(`film_channels_${guildId}`, filmChans.filter(id => id !== channel.id));
                return message.reply(`✅ ${channel} retiré des salons film.`);
            }
            return message.reply(`Usage : \`${prefix}filmconfig salon add/remove #salon\``);
        }

        // ─────────────────── logs ───────────────────
        if (sub === 'logs') {
            const type    = args[1]?.toLowerCase();
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]) || message.channel;
            if (type === 'suggestion' || type === 'suggestions') { client.db.set(`logs.suggestions_${guildId}`, channel.id); return message.reply(`✅ Logs suggestions → ${channel}`); }
            if (type === 'films' || type === 'film')              { client.db.set(`logs.films_${guildId}`,       channel.id); return message.reply(`✅ Logs films → ${channel}`); }
            if (type === 'avis')                                  { client.db.set(`logs.avis_${guildId}`,        channel.id); return message.reply(`✅ Logs avis → ${channel}`); }
            return message.reply(`Usage : \`${prefix}filmconfig logs suggestion/films/avis #salon\``);
        }

        // ─────────────────── add ───────────────────
        if (sub === 'add') {
            const fullArgs = message.content.split(/filmconfig add /i)[1];
            if (!fullArgs) return message.reply(
                `❌ Usage : \`${prefix}filmconfig add <nom> | <description> | <image_url> | <lien> | <épisode> | <categorie>\`\n` +
                `**Catégories :** ${CATEGORIES.map(c => `\`${c.value}\``).join(', ')}`
            );
            const parts = fullArgs.split('|').map(p => p.trim());
            if (parts.length < 6) return message.reply(`❌ Il faut 6 valeurs séparées par \` | \` :\n\`nom | description | image_url | lien | épisode | categorie\``);
            const [nom, description, image, lien, episodeStr, categorie] = parts;
            const episode = parseInt(episodeStr);
            const currentCatsAdd = client.db.get(`film_cats_${guildId}`) || [...CATEGORIES];
            if (!currentCatsAdd.find(c => c.value === categorie.toLowerCase())) return message.reply(`❌ Catégorie invalide. Valides : ${currentCatsAdd.map(c=>`\`${c.value}\``).join(', ')}`);
            const films    = client.db.get(`films_${guildId}`) || [];
            const existing = films.find(f => f.nom.toLowerCase() === nom.toLowerCase());
            if (existing) {
                client.db.set(`films_${guildId}`, films.map(f =>
                    f.nom.toLowerCase() === nom.toLowerCase()
                        ? { ...f, contenu: [...(f.contenu || []), { episode, lien }] }
                        : f
                ));
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🎬 Épisode ajouté').setDescription(`Episode **${episode}** ajouté à **${nom}**`).setColor('#57F287')
                ]}));
            }
            client.db.push(`films_${guildId}`, { nom, description, image, genre: categorie.toLowerCase(), contenu: [{ episode: isNaN(episode) ? 1 : episode, lien }] });
            message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 Film ajouté !')
                .setDescription(`**${nom}** ajouté au catalogue`)
                .addFields({ name: '🧩 Genre', value: CATEGORIES.find(c => c.value === categorie.toLowerCase())?.label || categorie, inline: true })
                .addFields({ name: '📝 Description', value: description, inline: true })
                .setImage(image).setColor('#57F287')
            ]}));
            const logFilms = client.db.get(`logs.films_${guildId}`);
            if (logFilms) {
                const logChan = message.guild.channels.cache.get(logFilms);
                if (logChan) logChan.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle(`🍿 Film ajouté dans \`${CATEGORIES.find(c=>c.value===categorie.toLowerCase())?.label||categorie}\``)
                    .setDescription(`Par **${message.author.username}**\n> Titre : \`${nom}\`\n> Description : ${description}`)
                    .setImage(image).setColor('#5865F2')
                ]})).catch(() => {});
            }
            return;
        }

        // ─────────────────── remove ───────────────────
        if (sub === 'remove') {
            const titre = args.slice(1).join(' ');
            if (!titre) return message.reply(`❌ Usage : \`${prefix}filmconfig remove <nom>\``);
            const films    = client.db.get(`films_${guildId}`) || [];
            const newFilms = films.filter(f => f.nom.toLowerCase() !== titre.toLowerCase());
            if (newFilms.length === films.length) return message.reply(`❌ Film \`${titre}\` introuvable.`);
            client.db.set(`films_${guildId}`, newFilms);
            return message.reply(`✅ Film \`${titre}\` supprimé.`);
        }

        // ─────────────────── list ───────────────────
        if (sub === 'list') {
            const films     = client.db.get(`films_${guildId}`) || [];
            const catFilter = args[1]?.toLowerCase();
            // Support multi-genre : film.genres (array) ou film.genre (string legacy)
            const getGenres = f => (f.genres && Array.isArray(f.genres)) ? f.genres : (f.genre ? [f.genre] : []);
            const filtered  = catFilter ? films.filter(f => getGenres(f).includes(catFilter)) : films;
            if (filtered.length === 0) return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 Catalogue vide').setDescription(`Aucun film${catFilter ? ` dans \`${catFilter}\`` : ''}.`).setColor('#ED4245')
            ]}));
            const ITEMS_PER_PAGE = 15;
            const chunks = [];
            for (let i = 0; i < filtered.length; i += ITEMS_PER_PAGE) chunks.push(filtered.slice(i, i + ITEMS_PER_PAGE));
            const buildEmbed = (chunk, idx) => new Discord.EmbedBuilder()
                .setTitle(`🎬 Catalogue — ${filtered.length} film(s)${catFilter ? ` [${catFilter}]` : ''}${chunks.length > 1 ? ` (${idx+1}/${chunks.length})` : ''}`)
                .setDescription(chunk.map((f, i) => `**${idx * ITEMS_PER_PAGE + i + 1}.** ${f.nom} \`[${f.genre}]\``).join('\n'))
                .setColor('#5865F2');
            if (chunks.length === 1) return message.channel.send({ embeds: [buildEmbed(chunks[0], 0)] });
            let page = 0;
            const buildRow = (p) => new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('filmlist_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
                new ButtonBuilder().setCustomId('filmlist_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= chunks.length - 1)
            );
            const msg = await message.channel.send(v2({ embeds: [buildEmbed(chunks[0], 0)], components: [buildRow(0)] }));
            const col = msg.createMessageComponentCollector({ time: 120000 });
            col.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
                if (i.customId === 'filmlist_prev') page = Math.max(0, page - 1);
                if (i.customId === 'filmlist_next') page = Math.min(chunks.length - 1, page + 1);
                await i.update(v2({ embeds: [buildEmbed(chunks[page], page)], components: [buildRow(page)] }));
            });
            col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
            return;
        }

        // ─────────────────── categories ───────────────────
        if (sub === 'categories') {
            const action = args[1]?.toLowerCase();
            const currentCats = client.db.get(`film_cats_${guildId}`) || [...CATEGORIES];

            if (action === 'add') {
                const value = args[2]?.toLowerCase();
                const label = args.slice(3).join(' ');
                if (!value || !label) return message.reply(`Usage : \`${prefix}filmconfig categories add <valeur> <label>\`\nEx: \`${prefix}filmconfig categories add documentaire Documentaire\``);
                if (currentCats.find(c => c.value === value)) return message.reply(`❌ La catégorie \`${value}\` existe déjà.`);
                currentCats.push({ value, label });
                client.db.set(`film_cats_${guildId}`, currentCats);
                return message.reply(`✅ Catégorie **${label}** (\`${value}\`) ajoutée. (${currentCats.length} catégories au total)`);
            }

            if (action === 'remove') {
                const value = args[2]?.toLowerCase();
                if (!value) return message.reply(`Usage : \`${prefix}filmconfig categories remove <valeur>\``);
                const newCats = currentCats.filter(c => c.value !== value);
                if (newCats.length === currentCats.length) return message.reply(`❌ Catégorie \`${value}\` introuvable.`);
                client.db.set(`film_cats_${guildId}`, newCats);
                return message.reply(`✅ Catégorie \`${value}\` supprimée. (${newCats.length} catégories restantes)`);
            }

            if (action === 'reset') {
                client.db.delete(`film_cats_${guildId}`);
                return message.reply(`✅ Catégories remises aux ${CATEGORIES.length} catégories par défaut.`);
            }

            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle(`📋 Catégories — ${currentCats.length} configurée(s)`)
                .setDescription(currentCats.map((c, i) => `**${i + 1}.** \`${c.value}\` — ${c.label}`).join('\n'))
                .setColor('#5865F2')
                
            ]}));
        }

        // ─────────────────── filmembed ───────────────────
        if (sub === 'filmembed') {
            const action = args[1]?.toLowerCase();
            const val    = args.slice(2).join(' ');
            const cfg    = client.db.get(`film_embed_config_${guildId}`) || {};

            if (action === 'variables') {
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📌 Variables — Embed Film')
                    .setColor('#5865F2')
                    .setDescription(
                        '**Variables utilisables dans le titre et la description de l\'embed film :**\n\n' +
                        '`{titre}` — Titre du film\n' +
                        '`{genre}` — Genre(s) du film\n' +
                        '`{description}` — Description du film\n' +
                        '`{nbEpisodes}` — Nombre d\'épisodes/liens disponibles\n\n' +
                        '**Exemples :**\n' +
                        `\`${prefix}filmconfig filmembed title 🍿 {titre} — {genre}\`\n` +
                        `\`${prefix}filmconfig filmembed description Genre : {genre} | {nbEpisodes} épisode(s)\`\n\n` +
                        `*\`${prefix}filmconfig filmembed info\` pour voir la config actuelle*`
                    )
                ]}));
            }

            if (action === 'reset') {
                client.db.delete(`film_embed_config_${guildId}`);
                return message.reply(`✅ Embed film remis aux valeurs par défaut.`);
            }

            if (action === 'info') {
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🎬 Config Embed Film')
                    .setColor(cfg.color || '#5865F2')
                    .setDescription(
                        `**Couleur :** ${cfg.color || '*(défaut #5865F2)*'}\n` +
                        `**Titre :** ${cfg.title || '*(défaut : 🍿 {titre})*'}\n` +
                        `**Description :** ${cfg.description ? '*(configurée)*' : '*(défaut : champs genre/description/épisodes)*'}\n\n` +
                        `\`${prefix}filmconfig filmembed variables\` — Voir les variables dispo`
                    )
                ]}));
            }

            if (action === 'color') {
                if (!val || !/^#[0-9A-Fa-f]{6}$/.test(val)) return message.reply(`❌ Format : \`#RRGGBB\` ex: \`#5865F2\``);
                cfg.color = val;
                client.db.set(`film_embed_config_${guildId}`, cfg);
                return message.reply(`✅ Couleur de l'embed film → **${val}**`);
            }

            if (action === 'title') {
                if (!val) return message.reply(`Usage : \`${prefix}filmconfig filmembed title <template>\`\nVariables : \`{titre}\` \`{genre}\` \`{description}\` \`{nbEpisodes}\``);
                cfg.title = val;
                client.db.set(`film_embed_config_${guildId}`, cfg);
                return message.reply(`✅ Titre de l'embed film → **${val}**`);
            }

            if (action === 'description') {
                if (!val) return message.reply(`Usage : \`${prefix}filmconfig filmembed description <template>\`\nVariables : \`{titre}\` \`{genre}\` \`{description}\` \`{nbEpisodes}\``);
                cfg.description = val;
                client.db.set(`film_embed_config_${guildId}`, cfg);
                return message.reply(`✅ Description de l'embed film configurée.`);
            }

            return message.reply(`Usage : \`${prefix}filmconfig filmembed color|title|description|variables|reset|info\``);
        }

        // ─────────────────── logsrecherches ───────────────────
        if (sub === 'logsrecherches' || sub === 'logsearch' || sub === 'logssearch') {
            const action  = args[1]?.toLowerCase();
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);

            if (action === 'set') {
                if (!channel) return message.reply(`❌ Mentionnez un salon ou donnez son ID.`);
                client.db.set(`logs.recherches_${guildId}`, channel.id);
                return message.reply(`✅ Salon de logs des recherches → ${channel}`);
            }
            if (action === 'remove') {
                client.db.delete(`logs.recherches_${guildId}`);
                return message.reply(`✅ Salon de logs des recherches supprimé.`);
            }
            if (action === 'info') {
                const current = client.db.get(`logs.recherches_${guildId}`);
                return message.reply(current ? `📌 Salon logs recherches : <#${current}>` : `📌 Aucun salon logs recherches configuré.`);
            }
            return message.reply(`Usage : \`${prefix}filmconfig logsrecherches set #salon\` | \`remove\` | \`info\``);
        }

        message.reply(`Sous-commande inconnue. Utilisez \`${prefix}filmconfig help\``);
    }
};
