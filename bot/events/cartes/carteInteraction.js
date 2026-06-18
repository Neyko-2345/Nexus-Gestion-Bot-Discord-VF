const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
    MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder, ButtonBuilder,
    ButtonStyle, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const { tirerBooster } = require('../../utils/boosterAlgo');
const fs   = require('fs');
const path = require('path');

const PRICES_PATH    = path.join(__dirname, '../../data/boosterPrices.json');
const DEFAULT_PRICES = { classique: 1000, premium: 10000, legendaire: 50000 };

function getPrices() {
    try { return JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8')); }
    catch { return { ...DEFAULT_PRICES }; }
}

const BOOSTER_NAMES  = { c: 'Booster Classique', p: 'Booster Premium', l: 'Booster Légendaire' };
const BOOSTER_TYPES  = { c: 'classique', p: 'premium', l: 'legendaire' };

function getUniqueCards(collection) {
    const map = new Map();
    for (const card of collection) {
        const key = `${card.nom}|${card.image}|${card.valeur}`;
        if (map.has(key)) map.get(key).count++;
        else map.set(key, { ...card, count: 1 });
    }
    return [...map.values()];
}

// ── Booster opening pages ─────────────────────────────────────────────────────

function buildBoosterPageContainer(sess, uid) {
    const { type, cards, page } = sess;
    const typeLabel = { classique: 'Booster Classique', premium: 'Booster Premium', legendaire: 'Booster Légendaire' }[type];
    const container = new ContainerBuilder().setAccentColor(0xF1C40F);

    if (page === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## <:emoji_294:1516712949694332928> ${typeLabel}`)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                'Voici ton booster ! Défile les pages et découvre tes cartes en utilisant les boutons. ' +
                'Ce booster contient 10 cartes. Chaque carte ouverte est directement sauvegardée dans ta collection.'
            )
        );
        const mg = new MediaGalleryBuilder();
        mg.addItems(new MediaGalleryItemBuilder().setURL('https://i.postimg.cc/s2hyKCzQ/IMG-5097.png'));
        container.addMediaGalleryComponents(mg);
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`bs_next_${uid}`).setLabel('Suivant ➡️').setStyle(ButtonStyle.Primary)
            )
        );
    } else if (page <= 10) {
        const card = cards[page - 1];
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## <:icontb:1516711894122237962> Carte ${page} / 10`)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**${card.nom}**\nValeur : \`${card.valeur}\` <:coin:1510618513876717709>`
            )
        );
        const mg = new MediaGalleryBuilder();
        mg.addItems(new MediaGalleryItemBuilder().setURL(card.image));
        container.addMediaGalleryComponents(mg);
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
        const nextLabel = page === 10 ? '📋 Résumé' : 'Suivant ➡️';
        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`bs_prev_${uid}`).setLabel('⬅️ Précédent').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`bs_next_${uid}`).setLabel(nextLabel).setStyle(ButtonStyle.Primary),
            )
        );
    } else {
        const lastCard = cards[9];
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ✅ Résumé | ${typeLabel}`)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        const lines = cards.map(c => `• **${c.nom}** — \`${c.valeur}\` <:coin:1510618513876717709>`).join('\n');
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines));
        const mg = new MediaGalleryBuilder();
        mg.addItems(new MediaGalleryItemBuilder().setURL(lastCard.image));
        container.addMediaGalleryComponents(mg);
        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('-# Toutes les cartes sont dans ta collection.')
        );
    }

    return container;
}

// ── Collection ───────────────────────────────────────────────────────────────

function buildColContainer(collection, page, userId, username) {
    const unique     = getUniqueCards(collection);
    const total      = collection.length;
    const totalValue = collection.reduce((s, c) => s + c.valeur, 0);
    const safePage   = Math.max(0, Math.min(page, unique.length - 1));
    const card       = unique[safePage];

    const container = new ContainerBuilder().setAccentColor(0xF1C40F);
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 📦 Collection de ${username}`)
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**Total de cartes** : \`${total}\` <:icontb:1516711894122237962>\n` +
            `**Valeur totale** : \`${totalValue}\` <:coin:1510618513876717709>`
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    const countStr = card.count > 1 ? ` — x${card.count}` : '';
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**${card.nom}**${countStr}\n**Valeur** : \`${card.valeur}\` <:coin:1510618513876717709>`
        )
    );
    const mg = new MediaGalleryBuilder();
    mg.addItems(new MediaGalleryItemBuilder().setURL(card.image));
    container.addMediaGalleryComponents(mg);

    const prevBtn = new ButtonBuilder().setCustomId(`col_prev_${userId}`).setLabel('⬅️ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(safePage === 0);
    const nextBtn = new ButtonBuilder().setCustomId(`col_next_${userId}`).setLabel('Suivant ➡️').setStyle(ButtonStyle.Secondary).setDisabled(safePage >= unique.length - 1);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(prevBtn, nextBtn));

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));

    const sellAllBtn = new ButtonBuilder().setCustomId(`col_sell_all_${userId}`).setLabel('🗑️ Tout vendre').setStyle(ButtonStyle.Danger);
    const sell1Btn   = new ButtonBuilder().setCustomId(`col_sell_1_${userId}`).setLabel('💰 Vendre 1').setStyle(ButtonStyle.Success);
    container.addActionRowComponents(new ActionRowBuilder().addComponents(sellAllBtn, sell1Btn));

    return container;
}

// Helper: rebuild + edit the main collection message
async function refreshCollectionMessage(client, userId, interaction) {
    const info = client.db.get(`col_main_msg_${userId}`);
    if (!info) return;
    const collection = client.db.get(`collection_${userId}`) || [];
    const page       = client.db.get(`col_page_${userId}`) || 0;

    try {
        const channel = await interaction.client.channels.fetch(info.channelId);
        const msg     = await channel.messages.fetch(info.messageId);

        if (collection.length === 0) {
            const c = new ContainerBuilder().setAccentColor(0xF1C40F);
            c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Collection vendue ! Fais `&booster` pour reremplir ta collection.'));
            await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
        } else {
            const unique   = getUniqueCards(collection);
            const safePage = Math.max(0, Math.min(page, unique.length - 1));
            client.db.set(`col_page_${userId}`, safePage);
            const c = buildColContainer(collection, safePage, userId, info.username || 'Inconnu');
            await msg.edit({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
    } catch {}
}

// ── Main handler ──────────────────────────────────────────────────────────────

module.exports = {
    name: 'interactionCreate',

    run: async (client, interaction) => {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        const id  = interaction.customId || '';
        const uid = interaction.user.id;
        const gid = interaction.guildId;

        try {

            // ═══════════════════════════════════════════
            // 1. BOOSTER SHOP: buy buttons
            // ═══════════════════════════════════════════
            if (['bp_buy_c', 'bp_buy_p', 'bp_buy_l'].includes(id)) {
                const key     = id.slice(-1);
                const prices  = getPrices();
                const price   = prices[BOOSTER_TYPES[key]];
                const name    = BOOSTER_NAMES[key];
                const type    = BOOSTER_TYPES[key];
                const coinKey = `coin_hand_${uid}_${gid}`;
                const coins   = client.db.get(coinKey) || 0;

                if (coins < price) {
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ Tu n'as pas assez de coins ! Il te faut \`${price}\` coins, tu en as \`${coins}\`.`));
                    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }

                client.db.subtract(coinKey, price);

                const boosters = client.db.get(`boosters_${uid}`) || { classique: 0, premium: 0, legendaire: 0 };
                boosters[type] = (boosters[type] || 0) + 1;
                client.db.set(`boosters_${uid}`, boosters);

                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## <:emoji_294:1516712949694332928> Shop Boosters`));
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
                c.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ **Achat confirmé !** Tu possèdes maintenant \`${boosters[type]}\` ${name}.\n` +
                        `Fais \`&inventaire\` pour ouvrir ton booster, puis \`&collection\` pour voir ta collection.`
                    )
                );
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
                c.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('bp_buy_c').setLabel('Acheter Classique').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('bp_buy_p').setLabel('Acheter Premium').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('bp_buy_l').setLabel('Acheter Légendaire').setStyle(ButtonStyle.Danger),
                    )
                );
                return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
            }

            // ═══════════════════════════════════════════
            // 2. INVENTAIRE: open booster button
            // ═══════════════════════════════════════════
            if (id.startsWith('inv_open_') && id.endsWith(`_${uid}`)) {
                const key  = id.split('_')[2];
                const type = BOOSTER_TYPES[key];

                const boosters = client.db.get(`boosters_${uid}`) || { classique: 0, premium: 0, legendaire: 0 };
                if ((boosters[type] || 0) <= 0) {
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`❌ Tu n'as plus de ${BOOSTER_NAMES[key]}.`));
                    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }

                boosters[type]--;
                client.db.set(`boosters_${uid}`, boosters);

                const cards = tirerBooster(type);

                const collection = client.db.get(`collection_${uid}`) || [];
                collection.push(...cards);
                client.db.set(`collection_${uid}`, collection);

                const sess = { type, cards, page: 0 };
                client.db.set(`booster_sess_${uid}`, sess);

                const c = buildBoosterPageContainer(sess, uid);
                return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
            }

            // ═══════════════════════════════════════════
            // 3. BOOSTER SESSION: navigation
            // ═══════════════════════════════════════════
            if ((id === `bs_prev_${uid}` || id === `bs_next_${uid}`)) {
                const sess = client.db.get(`booster_sess_${uid}`);
                if (!sess) return interaction.deferUpdate();

                if (id.startsWith('bs_next_')) sess.page = Math.min(11, sess.page + 1);
                else sess.page = Math.max(0, sess.page - 1);

                client.db.set(`booster_sess_${uid}`, sess);
                const c = buildBoosterPageContainer(sess, uid);
                return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
            }

            // ═══════════════════════════════════════════
            // 4. COLLECTION: navigation
            // ═══════════════════════════════════════════
            if (id === `col_prev_${uid}` || id === `col_next_${uid}`) {
                const info = client.db.get(`col_main_msg_${uid}`);
                if (!info) return interaction.deferUpdate();

                const collection = client.db.get(`collection_${uid}`) || [];
                if (collection.length === 0) return interaction.deferUpdate();

                const unique    = getUniqueCards(collection);
                let page        = client.db.get(`col_page_${uid}`) || 0;

                if (id.startsWith('col_next_')) page = Math.min(unique.length - 1, page + 1);
                else page = Math.max(0, page - 1);

                client.db.set(`col_page_${uid}`, page);
                const c = buildColContainer(collection, page, uid, info.username || 'Inconnu');
                return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
            }

            // ═══════════════════════════════════════════
            // 5. COLLECTION: Tout vendre — show confirmation
            // ═══════════════════════════════════════════
            if (id === `col_sell_all_${uid}`) {
                const collection = client.db.get(`collection_${uid}`) || [];
                if (collection.length === 0) return interaction.deferUpdate();
                const totalValue = collection.reduce((s, c) => s + c.valeur, 0);

                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🗑️ Confirmation — Tout vendre'));
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
                c.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Es-tu sûr de vouloir vendre **toute ta collection** ?\n` +
                        `Tu récupèreras \`${totalValue}\` <:coin:1510618513876717709>.`
                    )
                );
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
                c.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`col_conf_yes_${uid}`).setLabel('✅ Confirmer').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId(`col_conf_no_${uid}`).setLabel('❌ Annuler').setStyle(ButtonStyle.Secondary),
                    )
                );
                return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            }

            // ═══════════════════════════════════════════
            // 6. COLLECTION: Confirmation sell all — YES
            // ═══════════════════════════════════════════
            if (id === `col_conf_yes_${uid}`) {
                const collection = client.db.get(`collection_${uid}`) || [];
                const totalValue = collection.reduce((s, c) => s + c.valeur, 0);
                const coinKey    = `coin_hand_${uid}_${gid}`;

                client.db.add(coinKey, totalValue);
                client.db.set(`collection_${uid}`, []);
                client.db.set(`col_page_${uid}`, 0);

                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ **Collection vendue !** Vous avez obtenu \`${totalValue}\` <:coin:1510618513876717709>.\nFaites \`&booster\` pour reremplir votre collection.`
                    )
                );
                await interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                await refreshCollectionMessage(client, uid, interaction);
                return;
            }

            // ═══════════════════════════════════════════
            // 7. COLLECTION: Confirmation sell all — NO
            // ═══════════════════════════════════════════
            if (id === `col_conf_no_${uid}`) {
                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Vente annulée.'));
                return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
            }

            // ═══════════════════════════════════════════
            // 8. COLLECTION: Vendre 1 — open modal
            // ═══════════════════════════════════════════
            if (id === `col_sell_1_${uid}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`col_msell_${uid}`)
                    .setTitle('💰 Vendre une carte')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('card_name')
                                .setLabel('Nom de la carte à vendre')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    );
                return interaction.showModal(modal);
            }

            // ═══════════════════════════════════════════
            // 9. COLLECTION: sell 1 copy of a known card
            // ═══════════════════════════════════════════
            if (id === `col_1ex_${uid}`) {
                const card       = client.db.get(`col_sell_card_${uid}`);
                if (!card) return interaction.deferUpdate();
                const collection = client.db.get(`collection_${uid}`) || [];
                const coinKey    = `coin_hand_${uid}_${gid}`;

                const idx = collection.findIndex(c => c.nom === card.nom && c.image === card.image && c.valeur === card.valeur);
                if (idx === -1) {
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Carte introuvable.'));
                    return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                }
                collection.splice(idx, 1);
                client.db.set(`collection_${uid}`, collection);
                client.db.add(coinKey, card.valeur);

                const unique   = getUniqueCards(collection);
                let page       = client.db.get(`col_page_${uid}`) || 0;
                if (page >= unique.length && page > 0) { page = unique.length - 1; client.db.set(`col_page_${uid}`, page); }

                const conf = new ContainerBuilder().setAccentColor(0xF1C40F);
                conf.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ La carte **${card.nom}** a été vendue ! Vous avez obtenu \`${card.valeur}\` <:coin:1510618513876717709>.`
                    )
                );
                await interaction.update({ components: [conf], flags: MessageFlags.IsComponentsV2 });
                await refreshCollectionMessage(client, uid, interaction);
                return;
            }

            // ═══════════════════════════════════════════
            // 10. COLLECTION: sell ALL copies of a known card
            // ═══════════════════════════════════════════
            if (id === `col_alex_${uid}`) {
                const card       = client.db.get(`col_sell_card_${uid}`);
                if (!card) return interaction.deferUpdate();
                const collection = client.db.get(`collection_${uid}`) || [];
                const coinKey    = `coin_hand_${uid}_${gid}`;

                const toSell = collection.filter(c => c.nom === card.nom && c.image === card.image && c.valeur === card.valeur);
                const gained = toSell.reduce((s, c) => s + c.valeur, 0);
                const newCol = collection.filter(c => !(c.nom === card.nom && c.image === card.image && c.valeur === card.valeur));
                client.db.set(`collection_${uid}`, newCol);
                client.db.add(coinKey, gained);

                const unique = getUniqueCards(newCol);
                let page     = client.db.get(`col_page_${uid}`) || 0;
                if (page >= unique.length && page > 0) { page = unique.length - 1; client.db.set(`col_page_${uid}`, page); }

                const conf = new ContainerBuilder().setAccentColor(0xF1C40F);
                conf.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ **${toSell.length}x ${card.nom}** vendue(s) ! Vous avez obtenu \`${gained}\` <:coin:1510618513876717709>.`
                    )
                );
                await interaction.update({ components: [conf], flags: MessageFlags.IsComponentsV2 });
                await refreshCollectionMessage(client, uid, interaction);
                return;
            }

            // ═══════════════════════════════════════════
            // 11. COLLECTION: multi-match select modal
            // ═══════════════════════════════════════════
            if (id === `col_msel_${uid}`) {
                const modal = new ModalBuilder()
                    .setCustomId(`col_mmsel_${uid}`)
                    .setTitle('Sélection des cartes à vendre')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('selection')
                                .setLabel('Numéros (ex: 1  ou  1, 2, 3)')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    );
                return interaction.showModal(modal);
            }

            // ═══════════════════════════════════════════
            // 12. MODAL: Vendre 1 — process name search
            // ═══════════════════════════════════════════
            if (id === `col_msell_${uid}`) {
                const inputName  = interaction.fields.getTextInputValue('card_name').trim().toLowerCase();
                const collection = client.db.get(`collection_${uid}`) || [];
                const unique     = getUniqueCards(collection);
                const matches    = unique.filter(c => c.nom.toLowerCase() === inputName);

                if (matches.length === 0) {
                    const searchPartial = unique.filter(c => c.nom.toLowerCase().includes(inputName));
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    if (searchPartial.length > 0) {
                        c.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `❌ Aucune carte trouvée avec ce nom exact.\n\nCartes similaires :\n` +
                                searchPartial.slice(0, 10).map(x => `• **${x.nom}** — \`${x.valeur}\` coins`).join('\n')
                            )
                        );
                    } else {
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Aucune carte trouvée avec ce nom.'));
                    }
                    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }

                if (matches.length === 1) {
                    const card = matches[0];
                    client.db.set(`col_sell_card_${uid}`, { nom: card.nom, image: card.image, valeur: card.valeur });

                    if (card.count === 1) {
                        const collection2 = client.db.get(`collection_${uid}`) || [];
                        const coinKey     = `coin_hand_${uid}_${gid}`;
                        const idx = collection2.findIndex(c => c.nom === card.nom && c.image === card.image && c.valeur === card.valeur);
                        collection2.splice(idx, 1);
                        client.db.set(`collection_${uid}`, collection2);
                        client.db.add(coinKey, card.valeur);

                        const unique2  = getUniqueCards(collection2);
                        let page       = client.db.get(`col_page_${uid}`) || 0;
                        if (page >= unique2.length && page > 0) { page = unique2.length - 1; client.db.set(`col_page_${uid}`, page); }

                        const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                        c.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `✅ La carte **${card.nom}** a été vendue ! Vous avez obtenu \`${card.valeur}\` <:coin:1510618513876717709>.`
                            )
                        );
                        await interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                        await refreshCollectionMessage(client, uid, interaction);
                        return;
                    }

                    // Multiple copies
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💰 Vendre — ${card.nom}`));
                    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
                    c.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `Tu possèdes **${card.count}x ${card.nom}** (valeur : \`${card.valeur}\` coins chacune).`
                        )
                    );
                    c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
                    c.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId(`col_1ex_${uid}`).setLabel('Vendre 1 exemplaire').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId(`col_alex_${uid}`).setLabel(`Vendre tous les exemplaires (x${card.count})`).setStyle(ButtonStyle.Danger),
                        )
                    );
                    return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }

                // Multiple DIFFERENT cards with same name
                client.db.set(`col_sell_candidates_${uid}`, matches.map(c => ({ nom: c.nom, image: c.image, valeur: c.valeur })));
                const list = matches.map((c, i) => `**${i + 1}.** ${c.nom} — \`${c.valeur}\` coins (x${c.count})`).join('\n');
                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 💰 Plusieurs cartes correspondent'));
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent(list));
                c.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large));
                c.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`col_msel_${uid}`).setLabel('Sélectionner').setStyle(ButtonStyle.Primary),
                    )
                );
                return interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
            }

            // ═══════════════════════════════════════════
            // 13. MODAL: multi-select — process selection
            // ═══════════════════════════════════════════
            if (id === `col_mmsel_${uid}`) {
                const raw        = interaction.fields.getTextInputValue('selection').trim();
                const candidates = client.db.get(`col_sell_candidates_${uid}`) || [];
                const numbers    = [...raw.matchAll(/\d+/g)].map(m => parseInt(m[0]));
                const toSell     = numbers.filter(n => n >= 1 && n <= candidates.length).map(n => candidates[n - 1]);

                if (toSell.length === 0) {
                    const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Aucun numéro valide saisi.'));
                    return interaction.update({ components: [c], flags: MessageFlags.IsComponentsV2 });
                }

                const collection = client.db.get(`collection_${uid}`) || [];
                const coinKey    = `coin_hand_${uid}_${gid}`;
                let gained       = 0;
                const newCol     = [...collection];

                for (const card of toSell) {
                    const idx = newCol.findIndex(c => c.nom === card.nom && c.image === card.image && c.valeur === card.valeur);
                    if (idx !== -1) { gained += card.valeur; newCol.splice(idx, 1); }
                }

                client.db.set(`collection_${uid}`, newCol);
                client.db.add(coinKey, gained);

                const unique = getUniqueCards(newCol);
                let page     = client.db.get(`col_page_${uid}`) || 0;
                if (page >= unique.length && page > 0) { page = unique.length - 1; client.db.set(`col_page_${uid}`, page); }

                const conf = new ContainerBuilder().setAccentColor(0xF1C40F);
                conf.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `✅ **${toSell.length}** carte(s) vendue(s) ! Vous avez obtenu \`${gained}\` <:coin:1510618513876717709>.`
                    )
                );
                await interaction.update({ components: [conf], flags: MessageFlags.IsComponentsV2 });
                await refreshCollectionMessage(client, uid, interaction);
                return;
            }

        } catch (err) {
            console.error('[carteInteraction]', err);
            try {
                const c = new ContainerBuilder().setAccentColor(0xF1C40F);
                c.addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Une erreur est survenue. Réessaie.'));
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ components: [c], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
                }
            } catch {}
        }
    },
};
