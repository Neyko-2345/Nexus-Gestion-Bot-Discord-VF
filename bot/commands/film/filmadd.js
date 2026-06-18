const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder } = require('discord.js');

const DEFAULT_CATEGORIES = [
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

function getCategories(client, guildId) {
    return client.db.get(`film_cats_${guildId}`) || DEFAULT_CATEGORIES;
}

module.exports = {
    name: "filmadd",
    aliases: ["addfilm", "ajouterfilm"],
    description: "Ajouter un film au catalogue via un formulaire (owner uniquement)",
    category: "film",
    ownerOnly: true,
    usage: ["filmadd"],

    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send({ embeds: [new Discord.EmbedBuilder()
            .setColor('#ED4245')
            .setDescription('❌ Seuls les owners peuvent ajouter des films.')
        ]});

        const guildId = message.guild.id;
        const cats    = getCategories(client, guildId);

        const modal = new Discord.ModalBuilder()
            .setTitle('🎬 Ajouter un Film / une Série')
            .setCustomId('filmadd_modal');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('filmadd_titre')
                    .setLabel('Titre du film / de la série')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Ex: Interstellar')
            ),
            new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('filmadd_genre')
                    .setLabel('Genre(s) — séparez par ", " si plusieurs')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('Ex: action   ou   action, thriller')
            ),
            new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('filmadd_description')
                    .setLabel('Description (optionnel)')
                    .setStyle(Discord.TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setPlaceholder('Courte description du film...')
            ),
            new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('filmadd_image')
                    .setLabel('URL de l\'image / affiche (optionnel)')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(false)
                    .setPlaceholder('https://...')
            ),
            new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('filmadd_lien')
                    .setLabel('Lien de visionnage + n° épisode (obligatoire)')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('https://... (épisode 1 par défaut)')
            )
        );

        try {
            const infoMsg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎬 Ajouter un film — Catégories disponibles')
                .setDescription(
                    cats.map(c => `\`${c.value}\` — ${c.label}`).join('\n') +
                    `\n\n*Séparez plusieurs genres par \`, \` : ex: \`action, thriller\`*\n` +
                    `*\`${prefix}filmconfig categories\` pour gérer les catégories*`
                )
                .setColor('#5865F2')
            ]}));

            const sent = await message.reply(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#5865F2')
                .setDescription('📋 Cliquez sur **Ouvrir le formulaire** pour ajouter un film.')
            ], components: [new ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('filmadd_open')
                    .setLabel('📋 Ouvrir le formulaire')
                    .setStyle(Discord.ButtonStyle.Primary)
            )]}));

            const btn = await sent.awaitMessageComponent({
                filter: i => i.user.id === message.author.id && i.customId === 'filmadd_open',
                time: 60000
            }).catch(() => null);
            if (!btn) {
                await sent.edit({ components: [] }).catch(() => {});
                return infoMsg.delete().catch(() => {});
            }

            await btn.showModal(modal);
            const mi = await btn.awaitModalSubmit({ filter: m => m.user.id === message.author.id, time: 120000 }).catch(() => null);
            if (!mi) {
                await sent.edit({ components: [] }).catch(() => {});
                return infoMsg.delete().catch(() => {});
            }

            const titre       = mi.fields.getTextInputValue('filmadd_titre').trim();
            const genreRaw    = mi.fields.getTextInputValue('filmadd_genre').trim().toLowerCase();
            const description = mi.fields.getTextInputValue('filmadd_description').trim() || 'Aucune description.';
            const image       = mi.fields.getTextInputValue('filmadd_image').trim() || null;
            const lienRaw     = mi.fields.getTextInputValue('filmadd_lien').trim() || null;

            // Support multi-catégories (séparées par ", ")
            const freshCats  = getCategories(client, guildId);
            const genresList = genreRaw.split(',').map(g => g.trim()).filter(Boolean);
            const invalid    = genresList.filter(g => !freshCats.find(c => c.value === g));
            if (invalid.length > 0) {
                await sent.edit({ components: [] }).catch(() => {});
                infoMsg.delete().catch(() => {});
                return mi.reply({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(
                        `❌ Genre(s) invalide(s) : ${invalid.map(g => `\`${g}\``).join(', ')}\n` +
                        `Catégories valides : ${freshCats.map(c => `\`${c.value}\``).join(', ')}`
                    )
                ], ephemeral: true });
            }

            const films    = client.db.get(`films_${guildId}`) || [];
            const existing = films.find(f => f.nom.toLowerCase() === titre.toLowerCase());

            if (existing) {
                const episode = (existing.contenu || []).length + 1;
                const updated = films.map(f => {
                    if (f.nom.toLowerCase() === titre.toLowerCase()) {
                        return { ...f, contenu: [...(f.contenu || []), { episode, lien: lienRaw || '#' }] };
                    }
                    return f;
                });
                client.db.set(`films_${guildId}`, updated);
                await sent.edit({ components: [] }).catch(() => {});
                infoMsg.delete().catch(() => {});
                return mi.reply(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🎬 Épisode ajouté')
                    .setDescription(`Épisode **${episode}** ajouté à **${titre}**.`)
                    .setColor('#57F287')
                ]}));
            }

            // Nouveau film — genres stockés comme array, genre = 1er pour rétro-compat
            client.db.push(`films_${guildId}`, {
                nom:         titre,
                description,
                image:       image || '',
                genre:       genresList[0],
                genres:      genresList,
                contenu:     [{ episode: 1, lien: lienRaw || '#' }]
            });

            await sent.edit({ components: [] }).catch(() => {});
            infoMsg.delete().catch(() => {});

            const genreLabels = genresList.map(g => freshCats.find(c => c.value === g)?.label || g).join(', ');

            const successEmbed = new Discord.EmbedBuilder()
                .setTitle('🎬 Film ajouté !')
                .setDescription(
                    `**${titre}** ajouté au catalogue !\n` +
                    `Genre(s) : **${genreLabels}**\n` +
                    (genresList.length > 1 ? `*Ce film apparaîtra dans ${genresList.length} catégories.*` : '')
                )
                .addFields({ name: '📝 Description', value: description, inline: false })
                .setColor('#57F287');
            if (image) successEmbed.setImage(image);

            await mi.reply({ embeds: [successEmbed] });

            // Log ajout
            const logFilms = client.db.get(`logs.films_${guildId}`);
            if (logFilms) {
                const logChan = message.guild.channels.cache.get(logFilms);
                if (logChan) {
                    const logEmbed = new Discord.EmbedBuilder()
                        .setTitle(`🍿 Nouveau film — ${genreLabels}`)
                        .setDescription(`**${titre}** ajouté par **${message.author.tag}**\n> ${description}`)
                        .setColor('#5865F2');
                    if (image) logEmbed.setImage(image);
                    logChan.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (err) {
            console.error('filmadd error: ' + err);
        }
    }
};
