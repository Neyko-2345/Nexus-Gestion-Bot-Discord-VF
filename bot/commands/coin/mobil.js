const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');

const MOBIL_IMAGE = 'https://media.discordapp.net/attachments/1249042420163674153/1250157045064138752/unknown.png?ex=6669eafa&is=6668997a&hm=96bb9583b5917950ad70c9294ec713787492481dc93af8547588a40c6c8d842b&=&format=webp&quality=lossless&width=590&height=1180';

function getUserLevel(client, userId, guildId) {
    const xp = client.db.get(`xp_${userId}_${guildId}`) || 0;
    const levels = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 };
    let level = 1;
    for (const [lvl, req] of Object.entries(levels)) {
        if (xp >= req) level = parseInt(lvl);
    }
    return level;
}

module.exports = {
    name: "mobil",
    aliases: ["telephone", "phone"],
    description: "Ouvre votre téléphone illégal (marché noir)",
    category: "coin",
    usage: ["mobil"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId  = message.author.id;
        const guildId = message.guild.id;

        const coinEmoji  = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const cultMinLvl   = client.db.get(`illegal_cult_min_level_${guildId}`) ?? 2;
        const blanchMinLvl = client.db.get(`illegal_blanch_min_level_${guildId}`) ?? 3;

        const buildEmbed = () => {
            const cap    = client.db.get(`illegal_capacity_${userId}_${guildId}`) || null;
            const drugs  = client.db.get(`illegal_drugs_${userId}_${guildId}`)   || 0;
            const price  = client.db.get(`illegal_drug_price_${guildId}`)        || 500;
            const level  = getUserLevel(client, userId, guildId);
            const capLabel = cap === 'cultivateur' ? '🌱 Cultivateur' : cap === 'blanchisseur' ? '🧹 Blanchisseur' : '❌ Aucune';

            return new Discord.EmbedBuilder()
                .setTitle('📱 Téléphone — Marché Noir')
                .setImage(MOBIL_IMAGE)
                .setDescription(
                    `💊 Drogues en stock : **${drugs}**\n` +
                    `📈 Prix actuel : **${price} ${coinEmoji}**\n` +
                    `🌟 Niveau XP : **${level}**\n` +
                    `🏷️ Capacité : **${capLabel}**`
                )
                .setColor('#F1C40F').setTimestamp();
        };

        const buildSelectRow = () => {
            const cap = client.db.get(`illegal_capacity_${userId}_${guildId}`) || null;
            const options = [
                { label: '📈 Bourse',             description: 'Voir le prix actuel des drogues',      value: 'bourse'   },
                { label: '💊 Mes drogues',         description: 'Voir votre stock de drogues',          value: 'drogues'  },
                { label: '📱 Téléphone (Donner)',  description: 'Donner des drogues à quelqu\'un',      value: 'donner'   },
                { label: '📞 Contactes (Vendre)',  description: 'Vendre vos drogues contre des coins',  value: 'vendre'   },
            ];
            if (!cap) {
                options.push({ label: `🌱 Devenir Cultivateur (niv. ${cultMinLvl} requis)`,  description: 'Cultivez et récoltez des drogues',   value: 'cultivateur'  });
                options.push({ label: `🧹 Devenir Blanchisseur (niv. ${blanchMinLvl} requis)`, description: 'Vendez des drogues contre des coins', value: 'blanchisseur' });
            } else {
                options.push({ label: '🚪 Démissionner', description: 'Quitter votre capacité actuelle', value: 'demission' });
            }
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('mobil_select')
                    .setPlaceholder('Choisir une action...')
                    .addOptions(options)
            );
        };

        const buildSellRow = (drugs) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sell_25').setLabel('Vendre 25%').setStyle(Discord.ButtonStyle.Secondary).setDisabled(drugs <= 0),
            new ButtonBuilder().setCustomId('sell_50').setLabel('Vendre 50%').setStyle(Discord.ButtonStyle.Primary).setDisabled(drugs <= 0),
            new ButtonBuilder().setCustomId('sell_all').setLabel('💰 Tout vendre').setStyle(Discord.ButtonStyle.Success).setDisabled(drugs <= 0),
            new ButtonBuilder().setCustomId('sell_cancel').setLabel('✖ Annuler').setStyle(Discord.ButtonStyle.Danger),
        );

        const msg = await message.channel.send(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] }));
        const col = msg.createMessageComponentCollector({ time: 180000 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce téléphone ne vous appartient pas.', ephemeral: true });

            // ── Boutons de vente ──
            if (i.isButton()) {
                if (i.customId === 'sell_cancel') {
                    return i.update(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] }));
                }
                const curDrugs = client.db.get(`illegal_drugs_${userId}_${guildId}`) || 0;
                const curPrice = client.db.get(`illegal_drug_price_${guildId}`) || 500;

                let amount = 0;
                if (i.customId === 'sell_25') amount = Math.max(1, Math.floor(curDrugs * 0.25));
                if (i.customId === 'sell_50') amount = Math.max(1, Math.floor(curDrugs * 0.5));
                if (i.customId === 'sell_all') amount = curDrugs;

                if (amount <= 0 || curDrugs <= 0) {
                    return i.update(v2({ embeds: [new Discord.EmbedBuilder().setColor('#ED4245').setDescription(`❌ Vous n'avez aucune drogue à vendre.`)], components: [buildSelectRow()] }));
                }
                const gain = amount * curPrice;
                client.db.subtract(`illegal_drugs_${userId}_${guildId}`, amount);
                client.db.add(`coin_hand_${userId}_${guildId}`, gain);

                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📞 Vente effectuée !')
                    .setDescription(`Vous avez vendu **${amount}** drogue(s) pour **${gain} ${coinEmoji}** !\n\n${buildEmbed().description}`)
                    .setColor('#57F287').setTimestamp()
                ], components: [buildSelectRow()] }));
            }

            // ── Select menu ──
            const choice   = i.values[0];
            const curPrice = client.db.get(`illegal_drug_price_${guildId}`) || 500;
            const curDrugs = client.db.get(`illegal_drugs_${userId}_${guildId}`) || 0;
            const curCap   = client.db.get(`illegal_capacity_${userId}_${guildId}`) || null;
            const curLevel = getUserLevel(client, userId, guildId);

            if (choice === 'bourse') {
                await i.update(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] }));
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📈 Bourse des Drogues')
                    .setDescription(`Prix actuel de la drogue : **${curPrice} ${coinEmoji}**\n*Le prix change toutes les heures.*`)
                    .setColor('#F1C40F')
                ]})).then(m => setTimeout(() => m.delete().catch(() => {}), 15000));
            }

            if (choice === 'drogues') {
                await i.update(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] }));
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('💊 Stock de drogues')
                    .setDescription(`Vous avez **${curDrugs}** drogue(s) en stock.\nValeur estimée : **${curDrugs * curPrice} ${coinEmoji}**`)
                    .setColor('#F1C40F')
                ]})).then(m => setTimeout(() => m.delete().catch(() => {}), 15000));
            }

            if (choice === 'donner') {
                if (curDrugs <= 0) return i.update(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] }));
                const modal = new Discord.ModalBuilder()
                    .setTitle('📱 Donner des drogues')
                    .setCustomId('mobil_donner');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new Discord.TextInputBuilder()
                            .setCustomId('donner_target').setLabel('Mention ou ID du destinataire')
                            .setStyle(Discord.TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new Discord.TextInputBuilder()
                            .setCustomId('donner_amount').setLabel('Nombre de drogues à donner')
                            .setStyle(Discord.TextInputStyle.Short).setPlaceholder('Ex: 1').setRequired(true)
                    )
                );
                await i.showModal(modal);
                const mi = await i.awaitModalSubmit({ filter: m => m.user.id === userId, time: 60000 }).catch(() => null);
                if (!mi) return;

                const targetInput  = mi.fields.getTextInputValue('donner_target').replace(/[<@!>]/g, '');
                const amount       = parseInt(mi.fields.getTextInputValue('donner_amount'));
                const targetMember = message.guild.members.cache.get(targetInput);
                if (!targetMember) return mi.reply({ content: '❌ Membre introuvable.', ephemeral: true });
                if (isNaN(amount) || amount <= 0) return mi.reply({ content: '❌ Montant invalide.', ephemeral: true });
                const realDrugs = client.db.get(`illegal_drugs_${userId}_${guildId}`) || 0;
                if (realDrugs < amount) return mi.reply({ content: `❌ Vous n'avez que **${realDrugs}** drogue(s).`, ephemeral: true });

                client.db.subtract(`illegal_drugs_${userId}_${guildId}`, amount);
                client.db.add(`illegal_drugs_${targetMember.id}_${guildId}`, amount);
                await mi.reply({ content: `✅ Vous avez donné **${amount}** drogue(s) à ${targetMember}.`, ephemeral: true });
                await msg.edit(v2({ embeds: [buildEmbed()], components: [buildSelectRow()] })).catch(() => {});
                return;
            }

            if (choice === 'vendre') {
                if (curCap !== 'blanchisseur') {
                    return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('📞 Vendre des drogues')
                        .setDescription(`❌ Vous devez être **Blanchisseur** pour vendre des drogues.\nChoisissez cette capacité dans \`${prefix}mobil\`.`)
                        .setColor('#ED4245')
                    ], components: [buildSelectRow()] }));
                }
                if (curDrugs <= 0) {
                    return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('📞 Vendre des drogues')
                        .setDescription(`❌ Vous n'avez aucune drogue à vendre.`)
                        .setColor('#ED4245')
                    ], components: [buildSelectRow()] }));
                }

                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('📞 Vendre des drogues')
                    .setDescription(
                        `💊 Stock : **${curDrugs}** drogues\n` +
                        `💵 Prix unitaire : **${curPrice} ${coinEmoji}**\n\n` +
                        `Choisissez la quantité à vendre :`
                    )
                    .setColor('#F1C40F')
                ], components: [buildSellRow(curDrugs)] }));
            }

            if (choice === 'cultivateur') {
                const minLvl = client.db.get(`illegal_cult_min_level_${guildId}`) ?? 2;
                if (curLevel < minLvl) {
                    return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('🌱 Devenir Cultivateur')
                        .setDescription(`❌ Vous êtes niveau **${curLevel}** mais il vous faut au minimum le **niveau ${minLvl}**.`)
                        .setColor('#ED4245')
                    ], components: [buildSelectRow()] }));
                }
                client.db.set(`illegal_capacity_${userId}_${guildId}`, 'cultivateur');
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🌱 Félicitations !')
                    .setDescription(`Vous êtes maintenant **Cultivateur** !\nUtilisez \`${prefix}recolt\` pour récolter des drogues.`)
                    .setColor('#57F287')
                ], components: [] }));
            }

            if (choice === 'blanchisseur') {
                const minLvl = client.db.get(`illegal_blanch_min_level_${guildId}`) ?? 3;
                if (curLevel < minLvl) {
                    return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                        .setTitle('🧹 Devenir Blanchisseur')
                        .setDescription(`❌ Vous êtes niveau **${curLevel}** mais il vous faut au minimum le **niveau ${minLvl}**.`)
                        .setColor('#ED4245')
                    ], components: [buildSelectRow()] }));
                }
                client.db.set(`illegal_capacity_${userId}_${guildId}`, 'blanchisseur');
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🧹 Félicitations !')
                    .setDescription(`Vous êtes maintenant **Blanchisseur** !\nVous pouvez vendre des drogues via \`${prefix}mobil\` → Contactes.`)
                    .setColor('#57F287')
                ], components: [] }));
            }

            if (choice === 'demission') {
                client.db.delete(`illegal_capacity_${userId}_${guildId}`);
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle('🚪 Démission')
                    .setDescription(`Vous avez quitté votre capacité **${curCap}**.\nVous pouvez en choisir une nouvelle via \`${prefix}mobil\`.`)
                    .setColor('#F1C40F')
                ], components: [] }));
            }
        });

        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
