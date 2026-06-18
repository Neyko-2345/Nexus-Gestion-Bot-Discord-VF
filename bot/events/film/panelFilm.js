const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require('discord.js');

const DEFAULT_CATS = [
    { value: 'comedie',          label: 'Comédie'         },
    { value: 'histoire',         label: 'Histoire'         },
    { value: 'science-fiction',  label: 'Science-Fiction'  },
    { value: 'romance',          label: 'Romance'          },
    { value: 'thriller',         label: 'Thriller'         },
    { value: 'cinema',           label: 'Cinéma'           },
    { value: 'drame',            label: 'Drame'            },
    { value: 'horreur',          label: 'Horreur'          },
    { value: 'guerre',           label: 'Guerre'           },
    { value: 'action',           label: 'Action'           },
    { value: 'anime',            label: 'Animé'            },
    { value: 'super-heros',      label: 'Super-Héros'      },
    { value: 'animation',        label: 'Animation'        },
    { value: 'fantaisie',        label: 'Fantaisie'        },
];

const DEFAULT_SUGGEST_CHANNEL = '1508451206446579874';

// Retourne les catégories configurées pour la guilde (ou les défauts)
function getCategories(client, guildId) {
    return client.db.get(`film_cats_${guildId}`) || DEFAULT_CATS;
}

// Normalise genre en tableau (rétro-compat : genre peut être string ou array)
function getFilmGenres(film) {
    if (film.genres && Array.isArray(film.genres)) return film.genres;
    if (film.genre) return [film.genre];
    return [];
}

// Applique les variables {titre}, {genre}, {description}, {nbEpisodes} dans un template
function applyTemplate(template, vars) {
    return template
        .replace(/\{titre\}/g, vars.titre || '')
        .replace(/\{genre\}/g, vars.genre || '')
        .replace(/\{description\}/g, vars.description || '')
        .replace(/\{nbEpisodes\}/g, String(vars.nbEpisodes || 0));
}

function isOwner(interaction) {
    const client = interaction.client;
    return client.staff.includes(interaction.user.id)
        || (client.config?.buyers || []).includes(interaction.user.id)
        || client.db.get(`owner_${interaction.user.id}`) === true;
}

function buildFilmEmbed(film, footer, client, guildId) {
    const cfg      = (client && guildId) ? (client.db.get(`film_embed_config_${guildId}`) || {}) : {};
    const genres   = getFilmGenres(film);
    const cats     = (client && guildId) ? getCategories(client, guildId) : DEFAULT_CATS;
    const genreStr = genres.map(g => cats.find(c => c.value === g)?.label || g).join(', ') || 'Non renseigné';
    const nbEps    = (film.contenu || []).length;

    const templateVars = {
        titre:       film.nom,
        genre:       genreStr,
        description: film.description || 'Aucune description',
        nbEpisodes:  nbEps,
    };

    const title   = cfg.title       ? applyTemplate(cfg.title, templateVars) : `🍿 ${film.nom}`;
    const color   = cfg.color       || '#5865F2';

    const episodes = film.contenu && film.contenu.length > 0
        ? film.contenu.map(c => `[Épisode **${c.episode}**](${c.lien})`).join('\n')
        : '*Aucun épisode disponible*';

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setColor(color);

    if (cfg.description) {
        embed.setDescription(applyTemplate(cfg.description, templateVars));
        embed.addFields({ name: '⚖️ Épisodes / Liens', value: episodes });
    } else {
        embed
            .addFields({ name: '🎙️ Genre(s)', value: genreStr, inline: true })
            .addFields({ name: '🧸 Description', value: film.description || '*Aucune description*', inline: true })
            .addFields({ name: '⚖️ Épisodes / Liens', value: episodes });
    }

    if (film.image) embed.setImage(film.image);
    return embed;
}

module.exports = {
    name: 'interactionCreate',
    run: async (client, interaction) => {
        const footer  = client.footer;
        const guildId = interaction.guildId;

        // ─────────────────────────────────────────────
        // BOUTON : 🔎 Rechercher
        // ─────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'panel_film_search') {
            const modal = new Discord.ModalBuilder()
                .setTitle('🔎 Rechercher un film')
                .setCustomId('modal_film_search');
            modal.addComponents(new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setLabel('🍿 Titre du film / série')
                    .setCustomId('film_search_input')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setPlaceholder('Ex: Interstellar')
                    .setRequired(true)
            ));
            return interaction.showModal(modal);
        }

        // ─────────────────────────────────────────────
        // BOUTON : 💡 Suggérer
        // ─────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'panel_film_suggest') {
            const modal = new Discord.ModalBuilder()
                .setTitle('💡 Suggérer un film / série')
                .setCustomId('modal_film_suggest');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new Discord.TextInputBuilder()
                        .setLabel('🍿 Titre du film / série')
                        .setCustomId('suggest_titre')
                        .setStyle(Discord.TextInputStyle.Short)
                        .setPlaceholder('Ex: Avatar 3')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new Discord.TextInputBuilder()
                        .setLabel('✏️ Genre')
                        .setCustomId('suggest_genre')
                        .setStyle(Discord.TextInputStyle.Short)
                        .setPlaceholder('Ex: Science-Fiction')
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new Discord.TextInputBuilder()
                        .setLabel('📝 Description (optionnelle)')
                        .setCustomId('suggest_desc')
                        .setStyle(Discord.TextInputStyle.Paragraph)
                        .setPlaceholder('Décrivez brièvement le film...')
                        .setRequired(false)
                )
            );
            return interaction.showModal(modal);
        }

        // ─────────────────────────────────────────────
        // BOUTON : 📋 Catalogue
        // ─────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'panel_film_catalogue') {
            const films = client.db.get(`films_${guildId}`) || [];
            const cats  = getCategories(client, guildId);

            // Limite Discord : max 25 options dans un select menu
            const catsToShow = cats.slice(0, 25);

            const select = new StringSelectMenuBuilder()
                .setCustomId('catalogue_cat_select')
                .setPlaceholder('Choisir une catégorie...')
                .addOptions(catsToShow.map(c => {
                    const count = films.filter(f => getFilmGenres(f).includes(c.value)).length;
                    return { label: `${c.label} (${count})`, value: c.value };
                }));

            return interaction.reply(v2({
                embeds: [new Discord.EmbedBuilder()
                    .setTitle('📋 Catalogue — Choisir une catégorie')
                    .setDescription(`**${films.length}** film(s)/série(s) disponible(s)`)
                    .setColor('#5865F2')],
                components: [new ActionRowBuilder().addComponents(select)],
                ephemeral: true
            }));
        }

        // ─────────────────────────────────────────────
        // BOUTONS : ✅ Accepter / ❌ Refuser suggestion
        // ─────────────────────────────────────────────
        if (interaction.isButton() && (interaction.customId === 'film_suggest_accept' || interaction.customId === 'film_suggest_refuse')) {
            if (!isOwner(interaction)) {
                return interaction.reply({ content: '❌ Seuls les owners peuvent accepter/refuser des suggestions.', ephemeral: true });
            }

            const msgId       = interaction.message.id;
            const suggestKey  = `film_suggest_${msgId}_${guildId}`;
            const suggestData = client.db.get(suggestKey);

            if (!suggestData) {
                return interaction.reply({ content: '❌ Données introuvables (déjà traitée ?).', ephemeral: true });
            }
            if (suggestData.status !== 'pending') {
                return interaction.reply({ content: `Cette suggestion a déjà été **${suggestData.status === 'accepted' ? 'acceptée ✅' : 'refusée ❌'}**.`, ephemeral: true });
            }

            const isAccept = interaction.customId === 'film_suggest_accept';
            client.db.set(suggestKey, { ...suggestData, status: isAccept ? 'accepted' : 'refused', reviewedBy: interaction.user.id });

            const statusStr    = isAccept ? '✅ Acceptée' : '❌ Refusée';
            const updatedEmbed = new Discord.EmbedBuilder()
                .setAuthor({ name: `${suggestData.username}`, iconURL: suggestData.avatar || undefined })
                .setTitle(`💡 Suggestion — ${statusStr}`)
                .setColor(isAccept ? '#57F287' : '#ED4245')
                .setDescription(
                    `🍿 **Titre :** ${suggestData.titre}\n` +
                    `✏️ **Genre :** ${suggestData.genre}\n` +
                    (suggestData.desc ? `📝 **Description :** ${suggestData.desc}\n` : '') +
                    `\n${statusStr} par ${interaction.user}`
                )
                .setTimestamp();

            await interaction.update(v2({ embeds: [updatedEmbed], components: [] }));

            if (isAccept) {
                const filmChannels = client.db.get(`film_channels_${guildId}`) || [];
                const filmChanId   = filmChannels[0];
                if (filmChanId) {
                    const filmChan = interaction.guild.channels.cache.get(filmChanId);
                    if (filmChan) {
                        filmChan.send(v2({ embeds: [new Discord.EmbedBuilder()
                            .setTitle(`🍿 ${suggestData.titre}`)
                            .setDescription(
                                `✅ **Suggestion acceptée !**\n\n` +
                                `✏️ **Genre :** ${suggestData.genre}\n` +
                                (suggestData.desc ? `📝 **Description :** ${suggestData.desc}\n` : '') +
                                `\n*Suggéré par <@${suggestData.userId}> — accepté par ${interaction.user}*`
                            )
                            .setColor('#57F287').setTimestamp()
                        ]})).catch(() => {});
                    }
                }
            }
            return;
        }

        // ─────────────────────────────────────────────
        // MODAL SUBMIT : 🔎 Recherche
        // ─────────────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'modal_film_search') {
            const titre  = interaction.fields.getTextInputValue('film_search_input');
            const films  = client.db.get(`films_${guildId}`);
            if (!films || films.length === 0) {
                return interaction.reply({ content: "Aucun film dans la base de données.", ephemeral: true });
            }
            const regex   = new RegExp(titre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const resultat = films.find(f => regex.test(f.nom));
            if (!resultat) {
                return interaction.reply(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🍿 Aucun résultat')
                    .setDescription(`Aucun film trouvé pour **\`${titre}\`**`)
                    .setColor('#ED4245')
                ], ephemeral: true }));
            }

            const embed = buildFilmEmbed(resultat, footer, client, guildId);
            const row   = resultat.contenu?.[0]?.lien
                ? new ActionRowBuilder().addComponents(new ButtonBuilder().setLabel('🍿 Regarder').setStyle(Discord.ButtonStyle.Link).setURL(resultat.contenu[0].lien))
                : null;

            await interaction.reply(v2({ embeds: [embed], components: row ? [row] : [], ephemeral: true }));

            // Log de la recherche (si configuré)
            const logRecherches = client.db.get(`logs.recherches_${guildId}`);
            if (logRecherches) {
                const logChan = interaction.guild?.channels?.cache?.get(logRecherches);
                if (logChan) {
                    const genres = getFilmGenres(resultat);
                    const cats   = getCategories(client, guildId);
                    const genre  = genres.map(g => cats.find(c => c.value === g)?.label || g).join(', ') || 'Non renseigné';
                    logChan.send(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('🔎 Recherche — Résultat trouvé')
                        .setDescription(
                            `**Film :** ${resultat.nom}\n` +
                            `**Genre(s) :** ${genre}\n` +
                            `**Recherché par :** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
                            `**Terme de recherche :** \`${titre}\``
                        )
                        .setColor('#5865F2').setTimestamp()
                    ]})).catch(() => {});
                }
            }
            return;
        }

        // ─────────────────────────────────────────────
        // MODAL SUBMIT : 💡 Suggestion
        // ─────────────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'modal_film_suggest') {
            const titre = interaction.fields.getTextInputValue('suggest_titre');
            const genre = interaction.fields.getTextInputValue('suggest_genre');
            const desc  = interaction.fields.getTextInputValue('suggest_desc') || null;

            const suggestChannelId = client.db.get(`film_suggest_channel_${guildId}`) || DEFAULT_SUGGEST_CHANNEL;
            const logsChan = interaction.guild.channels.cache.get(suggestChannelId);

            if (!logsChan) {
                return interaction.reply({ content: `❌ Salon de suggestions introuvable (ID: \`${suggestChannelId}\`). Contactez un owner.`, ephemeral: true });
            }

            const suggestEmbed = new Discord.EmbedBuilder()
                .setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle('💡 Nouvelle suggestion de film')
                .setColor('#5865F2')
                .setDescription(
                    `🍿 **Titre :** ${titre}\n` +
                    `✏️ **Genre :** ${genre}\n` +
                    (desc ? `📝 **Description :** ${desc}` : '')
                )
                .setTimestamp();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('film_suggest_accept').setLabel('✅ Accepter').setStyle(Discord.ButtonStyle.Success),
                new ButtonBuilder().setCustomId('film_suggest_refuse').setLabel('❌ Refuser').setStyle(Discord.ButtonStyle.Danger),
            );

            const sentMsg = await logsChan.send(v2({ embeds: [suggestEmbed], components: [actionRow] }));

            client.db.set(`film_suggest_${sentMsg.id}_${guildId}`, {
                titre, genre, desc,
                userId:   interaction.user.id,
                username: interaction.user.tag,
                avatar:   interaction.user.displayAvatarURL({ dynamic: true }),
                status:   'pending',
            });

            return interaction.reply({ content: `✅ Suggestion envoyée ! Les owners vont l'examiner.`, ephemeral: true });
        }

        // ─────────────────────────────────────────────
        // SELECT MENU : Catalogue par catégorie
        // ─────────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'catalogue_cat_select') {
            const catValue   = interaction.values[0];
            const cats       = getCategories(client, guildId);
            const cat        = cats.find(c => c.value === catValue);
            const films      = client.db.get(`films_${guildId}`) || [];

            // Supporte multi-genre : inclut les films dont la catégorie est dans genres[]
            const filmsInCat = films.filter(f => getFilmGenres(f).includes(catValue));

            if (filmsInCat.length === 0) {
                return interaction.update(v2({
                    embeds: [new Discord.EmbedBuilder()
                        .setTitle(cat?.label || catValue)
                        .setDescription('Aucun film dans cette catégorie.')
                        .setColor('#ED4245')],
                    components: []
                }));
            }

            const ITEMS = 10;
            const pages = [];
            for (let i = 0; i < filmsInCat.length; i += ITEMS) pages.push(filmsInCat.slice(i, i + ITEMS));

            const buildPage = (p) => new Discord.EmbedBuilder()
                .setTitle(`${cat?.label || catValue} — ${filmsInCat.length} film(s)${pages.length > 1 ? ` (page ${p + 1}/${pages.length})` : ''}`)
                .setDescription(pages[p].map((f, i) => {
                    const genres = getFilmGenres(f);
                    const allCats = cats;
                    const genreStr = genres.length > 1
                        ? genres.map(g => allCats.find(c => c.value === g)?.label || g).join(', ')
                        : '';
                    return `**${p * ITEMS + i + 1}.** ${f.nom}${genreStr ? ` *(${genreStr})*` : ''}\n*${f.description || 'Aucune description'}*`;
                }).join('\n\n'))
                .setColor('#5865F2');

            if (pages.length === 1) {
                return interaction.update(v2({ embeds: [buildPage(0)], components: [] }));
            }

            let page = 0;
            const buildNavRow = (p) => new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('cat_prev').setLabel('◀').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p === 0),
                new ButtonBuilder().setCustomId('cat_next').setLabel('▶').setStyle(Discord.ButtonStyle.Secondary).setDisabled(p >= pages.length - 1)
            );

            await interaction.update(v2({ embeds: [buildPage(0)], components: [buildNavRow(0)] }));

            // Stop existing collector on this message to prevent double-execution
            const msgId = interaction.message.id;
            if (!interaction.client._filmCatalogueCollectors) interaction.client._filmCatalogueCollectors = new Map();
            if (interaction.client._filmCatalogueCollectors.has(msgId)) interaction.client._filmCatalogueCollectors.get(msgId).stop('replaced');

            const col = interaction.message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });
            interaction.client._filmCatalogueCollectors.set(msgId, col);

            col.on('collect', async i => {
                if (i.user.id !== interaction.user.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
                if (i.customId === 'cat_prev') page = Math.max(0, page - 1);
                if (i.customId === 'cat_next') page = Math.min(pages.length - 1, page + 1);
                await i.update(v2({ embeds: [buildPage(page)], components: [buildNavRow(page)] }));
            });
            col.on('end', (_, reason) => {
                interaction.client._filmCatalogueCollectors?.delete(msgId);
                if (reason !== 'replaced') interaction.message.edit({ components: [] }).catch(() => {});
            });
        }
    }
};
