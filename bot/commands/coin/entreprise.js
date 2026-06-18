const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require('discord.js');

const COFFRE_LEVELS = [
    { rank: 1, capacity: 5000,   price: 0,     image: 'https://i.postimg.cc/rwFHZ99J/niveau1.png' },
    { rank: 2, capacity: 7500,   price: 1000,  image: 'https://i.postimg.cc/25gX6NfN/niveau3.png' },
    { rank: 3, capacity: 10000,  price: 2500,  image: 'https://i.postimg.cc/cCS9R7Hm/niveau10.png' },
    { rank: 4, capacity: 25000,  price: 5000,  image: 'https://i.postimg.cc/DfrY2Njs/niveau11.png' },
    { rank: 5, capacity: 50000,  price: 10000, image: 'https://i.postimg.cc/PrdVNM0G/niveau12.png' },
    { rank: 6, capacity: 200000, price: 20000, image: 'https://i.postimg.cc/Yq8nFWwS/niveau15.png' },
];

const DEFAULT_EMPLOYEES = [
    { name: 'Stagiaire', salary: 100,  gain: 50,   duration: 3 },
    { name: 'Employé',   salary: 500,  gain: 100,  duration: 3 },
    { name: 'Manager',   salary: 1000, gain: 200,  duration: 3 },
    { name: 'Directeur', salary: 1500, gain: 700,  duration: 3 },
    { name: 'PDG',       salary: 5000, gain: 2000, duration: 3 },
];

module.exports = {
    name: "entreprise",
    aliases: ["company", "ent"],
    description: "Affiche votre entreprise, son coffre et ses employés",
    category: "coin",
    usage: ["entreprise"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const getEnt        = () => client.db.get(`ent_${userId}_${guildId}`);
        const getCoffreConf = () => client.db.get(`ent_coffre_config_${guildId}`) || COFFRE_LEVELS;

        let ent = getEnt();
        if (!ent) return message.reply(`Vous n'avez pas d'entreprise. Achetez-en une dans \`${prefix}shop\`.`);

        // ── Calcul des gains + DM si plein ──
        const applyGains = () => {
            let entData = getEnt();
            if (!entData) return null;

            const coffreConf   = getCoffreConf();
            const now          = Date.now();
            const lastCollect  = entData.lastCollect || entData.createdAt || now;
            const hoursElapsed = Math.floor((now - lastCollect) / 3600000);
            const curRank      = entData.coffreRank || 1;
            const curCoffre    = coffreConf.find(c => c.rank === curRank) || coffreConf[0];
            const maxCap       = curCoffre.capacity;

            const employees    = client.db.get(`ent_employees_${guildId}`) || DEFAULT_EMPLOYEES;
            const activeEmps   = (entData.hiredEmployees || []).filter(e =>
                e.hiredAt && (now - e.hiredAt) < (e.duration || 3) * 86400000
            );

            let gained = 0, totalSalary = 0;
            for (const emp of activeEmps) {
                gained      += (emp.gain   || 0) * hoursElapsed;
                totalSalary += (emp.salary || 0);
            }

            if (gained > 0) {
                const prevCoffre = entData.coffre || 0;
                const newCoffre  = Math.min(prevCoffre + gained, maxCap);
                entData.coffre      = newCoffre;
                entData.lastCollect = now;
                client.db.set(`ent_${userId}_${guildId}`, entData);

                if (prevCoffre < maxCap && newCoffre >= maxCap) {
                    const notifEnabled = client.db.get(`ent_notif_${userId}_${guildId}`) !== false;
                    if (!notifEnabled) return;
                    const coinChannels = client.db.get(`coin_channels_${guildId}`) || [];
                    const chanMention  = coinChannels.length > 0 ? `<#${coinChannels[0]}>` : 'votre salon coin';
                    message.author.send(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('🏦 Coffre d\'entreprise plein !')
                        .setColor('#F1C40F').setTimestamp()
                        .setDescription(
                            `Le coffre de **${entData.name || 'votre entreprise'}** est plein (**${maxCap.toLocaleString()} ${coinEmoji}**).\n\n` +
                            `**Que faire ?**\n• Retirez les coins : faites \`${prefix}entreprise\` → **🏦 Coffre** → **💸 Retirer** dans ${chanMention}\n` +
                            `• Ou améliorez votre coffre : même chemin → **⬆️ Améliorer coffre**`
                        )
                    ]})).catch(() => {});
                }
            }

            return { entData: getEnt(), activeEmps, totalSalary, maxCap, curRank, curCoffre };
        };

        // ── Embed principal ──
        const buildMainEmbed = () => {
            const res          = applyGains();
            const entData      = res?.entData || getEnt();
            const coffreConf   = getCoffreConf();
            const curRank      = entData.coffreRank || 1;
            const curCoffre    = coffreConf.find(c => c.rank === curRank) || coffreConf[0];
            const maxCap       = curCoffre.capacity;
            const now          = Date.now();
            const activeEmps   = (entData.hiredEmployees || []).filter(e =>
                e.hiredAt && (now - e.hiredAt) < (e.duration || 3) * 86400000
            );
            const totalSalary  = activeEmps.reduce((a, e) => a + (e.salary || 0), 0);
            const totalGain    = activeEmps.reduce((a, e) => a + (e.gain   || 0), 0);
            const coffre       = entData.coffre || 0;

            const empLines = activeEmps.length > 0
                ? activeEmps.map(e => {
                    const daysLeft = Math.ceil((e.duration * 86400000 - (now - e.hiredAt)) / 86400000);
                    return `• **${e.name}** — +${e.gain}/h | Salaire: ${e.salary}/j | Expire: ${daysLeft}j`;
                }).join('\n')
                : `Aucun employé actif. Recrutez avec \`${prefix}recruter\`.`;

            return new Discord.EmbedBuilder()
                .setTitle(`🏢 ${entData.name || 'Mon Entreprise'}`)
                .setColor('#F1C40F').setTimestamp()
                .setThumbnail('https://images-ext-1.discordapp.net/external/ywA3gdNwM223KsvLtf5elleWL93ADtRGTt-d4fvRff4/https/play-lh.googleusercontent.com/XMpaHMNeySpMO8MAGmkMd0GB0E27hjsai5uKAushFMf8SYcJ_xucp5WUQ2x-ACOUZJ-i')
                .addFields({ name: '💰 Coffre', value: `${coffre.toLocaleString()} / ${maxCap.toLocaleString()} ${coinEmoji} (Rank ${curRank}/6)`, inline: false })
                .addFields({ name: '📊 Dépenses', value: `-${totalSalary}/j`, inline: true })
                .addFields({ name: '⏱️ Gains', value: `+${totalGain}/h`, inline: true })
                .addFields({ name: `👥 Employés (${activeEmps.length})`, value: empLines, inline: false });
        };

        // ── Embed coffre ──
        const buildCoffreEmbed = () => {
            const entData    = getEnt();
            const coffreConf = getCoffreConf();
            const curRank    = entData.coffreRank || 1;
            const curData    = coffreConf.find(c => c.rank === curRank) || coffreConf[0];
            const maxCap     = curData.capacity;
            const coffre     = entData.coffre || 0;
            const nextData   = coffreConf.find(c => c.rank === curRank + 1);

            const bar  = Math.round((coffre / maxCap) * 10);
            const barStr = `${'▓'.repeat(bar)}${'░'.repeat(10 - bar)} ${Math.round((coffre / maxCap) * 100)}%`;

            // Fallback image: cherche dans COFFRE_LEVELS si la config custom n'a pas d'image
            const imageUrl = curData.image
                || (COFFRE_LEVELS.find(c => c.rank === curRank) || {}).image
                || null;

            const embed = new Discord.EmbedBuilder()
                .setTitle(`🏦 Coffre — ${entData.name || 'Entreprise'}`)
                .setColor('#F1C40F').setTimestamp()
                .setDescription(
                    `**Niveau ${curRank}/6**\n` +
                    `${coffre.toLocaleString()} / ${maxCap.toLocaleString()} ${coinEmoji}\n\n` +
                    `${barStr}\n\n` +
                    (nextData
                        ? `⬆️ Prochain niveau (Rank ${nextData.rank}) : **${nextData.capacity.toLocaleString()} ${coinEmoji}** — Coût : **${nextData.price.toLocaleString()} ${coinEmoji}**`
                        : `✅ Coffre au **niveau maximum** !`)
                );
            if (imageUrl) embed.setImage(imageUrl);
            return embed;
        };

        // ── Embed amélioration coffre ──
        const buildUpgradeEmbed = () => {
            const entData    = getEnt();
            const coffreConf = getCoffreConf();
            const curRank    = entData.coffreRank || 1;

            const lines = coffreConf.map(c => {
                const owned = curRank >= c.rank;
                const e     = owned ? '✅' : '❌';
                return `${e} **Rank ${c.rank}** — ${c.capacity.toLocaleString()} ${coinEmoji}${c.price > 0 ? ` *(${c.price.toLocaleString()} ${coinEmoji})*` : ' *(gratuit)*'}`;
            }).join('\n');

            return new Discord.EmbedBuilder()
                .setTitle('⬆️ Améliorer le coffre')
                .setColor('#F1C40F')
                .setDescription(
                    `**Vos coins en main :** ${(client.db.get(`coin_hand_${userId}_${guildId}`) || 0).toLocaleString()} ${coinEmoji}\n\n` +
                    lines + `\n\n` +
                    `*Vous devez posséder le rang précédent pour acheter le suivant.*\n` +
                    `*Sélectionnez un rang ci-dessous pour l'acheter.*`
                )
                .setImage('https://i.postimg.cc/s22RSr8h/0DF46F07-DDC6-4E91-A8CF-2E10A3CB00C2.png');
        };

        const buildUpgradeSelectRow = () => {
            const entData    = getEnt();
            const coffreConf = getCoffreConf();
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ent_coffre_select')
                    .setPlaceholder('Choisir un niveau de coffre...')
                    .addOptions(coffreConf.map(c => ({
                        label: `Coffre Rank ${c.rank}`,
                        value: `coffre_${c.rank}`,
                    })))
            );
        };

        // ── Rows ──
        const mainRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ent_guide').setLabel('📖 Guide').setStyle(Discord.ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ent_coffre').setLabel('🏦 Coffre').setStyle(Discord.ButtonStyle.Primary),
        );

        const coffreRow = () => {
            const entData  = getEnt();
            const curRank  = entData?.coffreRank || 1;
            const coffreConf = getCoffreConf();
            const hasNext  = !!coffreConf.find(c => c.rank === curRank + 1);
            const btns = [
                new ButtonBuilder().setCustomId('ent_withdraw').setLabel('💸 Retirer').setStyle(Discord.ButtonStyle.Success),
            ];
            if (hasNext) btns.push(new ButtonBuilder().setCustomId('ent_upgrade').setLabel('⬆️ Améliorer coffre').setStyle(Discord.ButtonStyle.Primary));
            btns.push(new ButtonBuilder().setCustomId('ent_back').setLabel('↩ Retour').setStyle(Discord.ButtonStyle.Secondary));
            return new ActionRowBuilder().addComponents(btns);
        };

        const upgradeBackRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ent_coffre').setLabel('↩ Retour au coffre').setStyle(Discord.ButtonStyle.Secondary),
        );

        // ── Envoi initial ──
        const msg = await message.channel.send(v2({ embeds: [buildMainEmbed()], components: [mainRow] }));
        const col = msg.createMessageComponentCollector({ time: 180000 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });

            // ── Guide ──
            if (i.customId === 'ent_guide') {
                const coffreConf = getCoffreConf();
                return i.reply(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📖 Guide Entreprise')
                    .setColor('#F1C40F')
                    .setDescription(
                        `**Bienvenue dans le système Entreprise !**\n\n` +
                        `Une entreprise génère automatiquement des ${coinEmoji} pendant votre absence.\n\n` +
                        `**🔄 Comment ça marche :**\n` +
                        `• Achetez des employés avec \`${prefix}recruter\`\n` +
                        `• Chaque employé génère des ${coinEmoji}/heure dans votre coffre\n` +
                        `• Les gains s'accumulent jusqu'à la capacité max du coffre\n` +
                        `• Retirez l'argent : **🏦 Coffre** → **💸 Retirer**\n` +
                        `• Les employés durent **3 jours** avant d'être licenciés automatiquement\n\n` +
                        `**📦 Niveaux de coffre :**\n` +
                        coffreConf.map(c => `• Rank ${c.rank} — **${c.capacity.toLocaleString()} ${coinEmoji}** max${c.price > 0 ? ` (coût: ${c.price.toLocaleString()} ${coinEmoji})` : ' (gratuit)'}`).join('\n') +
                        `\n\n**📋 Commandes utiles :**\n` +
                        `\`${prefix}recruter\` — Engager un employé\n` +
                        `\`${prefix}licencier\` — Licencier un employé\n` +
                        `\`${prefix}entreprisedelete\` — Supprimer votre entreprise\n` +
                        `\`${prefix}empedit\` *(owner)* — Modifier les stats des employés\n\n` +
                        `**🔔 Notifications DM :**\n` +
                        `\`${prefix}entnotif\` — Activer/désactiver les DM coffre plein\n` +
                        `Statut : ${client.db.get(`ent_notif_${userId}_${guildId}`) !== false ? '✅ Activées' : '❌ Désactivées'}`
                    )
                ], ephemeral: true }));
            }

            // ── Afficher le coffre ──
            if (i.customId === 'ent_coffre') {
                return i.update(v2({ embeds: [buildCoffreEmbed()], components: [coffreRow()] }));
            }

            // ── Retour menu principal ──
            if (i.customId === 'ent_back') {
                return i.update(v2({ embeds: [buildMainEmbed()], components: [mainRow] }));
            }

            // ── Retirer du coffre ──
            if (i.customId === 'ent_withdraw') {
                const entData = getEnt();
                const coffre  = entData.coffre || 0;
                if (coffre <= 0) return i.reply({ content: `❌ Votre coffre est vide.`, ephemeral: true });

                const modal = {
                    title: 'Retirer du coffre',
                    custom_id: `ent_modal_withdraw_${userId}`,
                    components: [{ type: 1, components: [{
                        type: 4, custom_id: 'amount',
                        label: `Montant à retirer (max ${coffre.toLocaleString()})`,
                        style: 1, min_length: 1, max_length: 12, required: true,
                        placeholder: `Ex: ${coffre}`
                    }] }]
                };
                try {
                    await i.showModal(modal);
                    const mi = await i.awaitModalSubmit({ filter: m => m.user.id === userId, time: 60000 }).catch(() => null);
                    if (!mi) return;

                    const amount = parseInt(mi.fields.getTextInputValue('amount'));
                    const freshEnt = getEnt();
                    const freshCoffre = freshEnt.coffre || 0;

                    if (isNaN(amount) || amount <= 0) return mi.reply({ content: '❌ Montant invalide.', ephemeral: true });
                    if (amount > freshCoffre) return mi.reply({ content: `❌ Votre coffre contient seulement **${freshCoffre.toLocaleString()} ${coinEmoji}**.`, ephemeral: true });

                    freshEnt.coffre = freshCoffre - amount;
                    client.db.set(`ent_${userId}_${guildId}`, freshEnt);
                    client.db.add(`coin_hand_${userId}_${guildId}`, amount);

                    await mi.reply(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('💸 Retrait effectué !')
                        .setColor('#57F287').setTimestamp()
                        .setDescription(`**+${amount.toLocaleString()} ${coinEmoji}** retirés du coffre → votre main.\nCoffre restant : **${freshEnt.coffre.toLocaleString()} ${coinEmoji}**`)
                    ]}));

                    await msg.edit(v2({ embeds: [buildCoffreEmbed()], components: [coffreRow()] })).catch(() => {});
                } catch {}
                return;
            }

            // ── Afficher l'interface d'amélioration ──
            if (i.customId === 'ent_upgrade') {
                return i.update(v2({
                    embeds: [buildUpgradeEmbed()],
                    components: [buildUpgradeSelectRow(), upgradeBackRow]
                }));
            }

            // ── Achat d'un coffre ──
            if (i.customId === 'ent_coffre_select') {
                const selectedRank = parseInt(i.values[0].split('_')[1]);
                const entData      = getEnt();
                const coffreConf   = getCoffreConf();
                const curRank      = entData.coffreRank || 1;
                const selectedData = coffreConf.find(c => c.rank === selectedRank);

                if (!selectedData) return i.reply({ content: '❌ Niveau introuvable.', ephemeral: true });

                // Déjà possédé
                if (curRank >= selectedRank) {
                    return i.reply({ content: `✅ Vous possédez déjà le **Coffre Rank ${selectedRank}**.`, ephemeral: true });
                }

                // Doit posséder le rang précédent
                if (curRank < selectedRank - 1) {
                    return i.reply({ content: `❌ Vous devez posséder le **Coffre Rank ${selectedRank - 1}** avant d'acheter le Rank ${selectedRank}.`, ephemeral: true });
                }

                // Vérifier les coins
                const hand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                if (hand < selectedData.price) {
                    return i.reply({ content: `❌ Il vous faut **${selectedData.price.toLocaleString()} ${coinEmoji}** en main. Vous avez **${hand.toLocaleString()} ${coinEmoji}**.`, ephemeral: true });
                }

                // Acheter
                client.db.subtract(`coin_hand_${userId}_${guildId}`, selectedData.price);
                entData.coffreRank = selectedRank;
                client.db.set(`ent_${userId}_${guildId}`, entData);

                // Rafraîchir la liste + envoyer confirmation
                await i.reply(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle(`✅ Coffre Rank ${selectedRank} acheté !`)
                    .setColor('#57F287').setTimestamp()
                    .setImage(selectedData.image)
                    .setDescription(
                        `Nouvelle capacité : **${selectedData.capacity.toLocaleString()} ${coinEmoji}**\n` +
                        `-${selectedData.price.toLocaleString()} ${coinEmoji} de votre main.`
                    )
                ], ephemeral: true }));

                // Mettre à jour l'embed de la liste
                await msg.edit(v2({
                    embeds: [buildUpgradeEmbed()],
                    components: [buildUpgradeSelectRow(), upgradeBackRow]
                })).catch(() => {});
            }
        });

        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
