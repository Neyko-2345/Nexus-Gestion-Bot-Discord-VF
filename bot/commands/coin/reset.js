const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');

const SUPER_OWNER_ID = '594718632966357022';

module.exports = {
    name: "reset",
    aliases: ["resetpanel"],
    description: "Ouvre un panel de reset des données (super-owner uniquement)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "reset @membre",
        "reset all",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        if (message.author.id !== SUPER_OWNER_ID) {
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setDescription(`❌ Cette commande est réservée au propriétaire principal du bot.`)
            ]});
        }

        const guildId = message.guild.id;
        const target  = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const isAll   = args[0] === 'all' || args[0] === 'tous';
        const targetLabel = target ? `${target.user.tag}` : isAll ? 'TOUT LE SERVEUR' : null;
        if (!targetLabel) return message.reply(`Usage : \`${prefix}reset @membre\` ou \`${prefix}reset all\``);

        const options = [
            { label: '💰 Économie complète (hand + bank)', value: 'economy' },
            { label: '📊 XP seulement', value: 'xp' },
            { label: '⛏️ Mine (minerais + wagon)', value: 'mine' },
            { label: '🏢 Entreprise', value: 'entreprise' },
            { label: '⚔️ Team (quitte la team)', value: 'team' },
            { label: '🌐 Toutes les monnaies (bronze/argent/or/céleste)', value: 'currencies' },
            { label: '🔄 RESET TOTAL (comme nouveau joueur)', value: 'full' },
        ];

        const menu = new StringSelectMenuBuilder().setCustomId('reset_select').setPlaceholder('Choisir ce à quoi réinitialiser...').addOptions(options);
        const row  = new ActionRowBuilder().addComponents(menu);

        const embed = new Discord.EmbedBuilder()
            .setTitle('🔄 Panel de Reset — Super Owner')
            .setColor('#ED4245')
            .setDescription(
                `Cible : **${targetLabel}**\n\n` +
                `⚠️ Action **irréversible**. Sélectionnez ce à réinitialiser, puis confirmez via formulaire.`
            );

        const msg = await message.channel.send(v2({ embeds: [embed], components: [row] }));
        const col = msg.createMessageComponentCollector({ time: 60000, max: 1 });

        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            const resetType = i.values[0];

            // Demander confirmation via modal
            const modal = new Discord.ModalBuilder()
                .setTitle('⚠️ Confirmer le Reset')
                .setCustomId('reset_confirm_modal');
            modal.addComponents(new ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('reset_confirmation')
                    .setLabel('Tapez CONFIRMER pour valider')
                    .setStyle(Discord.TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('CONFIRMER')
            ));

            await i.showModal(modal);
            const mi = await i.awaitModalSubmit({ filter: m => m.user.id === message.author.id, time: 60000 }).catch(() => null);

            if (!mi) return msg.edit({ components: [] }).catch(() => {});

            const confirm = mi.fields.getTextInputValue('reset_confirmation').trim();
            if (confirm !== 'CONFIRMER') {
                await msg.edit({ components: [] }).catch(() => {});
                return mi.reply({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245').setDescription(`❌ Confirmation incorrecte — réinitialisation annulée.`)
                ], ephemeral: true });
            }

            const resetUser = (userId) => {
                if (resetType === 'economy' || resetType === 'full') {
                    client.db.set(`coin_hand_${userId}_${guildId}`, 0);
                    client.db.set(`coin_bank_${userId}_${guildId}`, 0);
                }
                if (resetType === 'xp' || resetType === 'full') {
                    client.db.set(`xp_${userId}_${guildId}`, 0);
                }
                if (resetType === 'mine' || resetType === 'full') {
                    client.db.delete(`wagon_${userId}_${guildId}`);
                    client.db.set(`minerais_${userId}_${guildId}`, {});
                    client.db.set(`mine_uses_${userId}_${guildId}`, 0);
                }
                if (resetType === 'entreprise' || resetType === 'full') {
                    client.db.delete(`ent_${userId}_${guildId}`);
                }
                if (resetType === 'team' || resetType === 'full') {
                    const teams = client.db.get(`teams_${guildId}`) || [];
                    const idx = teams.findIndex(t => t.members?.includes(userId) && t.founder !== userId);
                    if (idx !== -1) {
                        teams[idx].members = teams[idx].members.filter(id => id !== userId);
                        if (teams[idx].ranks) delete teams[idx].ranks[userId];
                        client.db.set(`teams_${guildId}`, teams);
                    }
                }
                if (resetType === 'currencies' || resetType === 'full') {
                    ['coin_bronze', 'coin_silver', 'coin_gold', 'coin_celestial'].forEach(c => {
                        client.db.set(`${c}_${userId}_${guildId}`, 0);
                    });
                }
            };

            if (isAll) {
                message.guild.members.cache.forEach(m => { if (!m.user.bot) resetUser(m.id); });
            } else {
                resetUser(target.id);
            }

            await msg.edit({ components: [] }).catch(() => {});
            await mi.reply(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('✅ Réinitialisation effectuée')
                .setColor('#57F287').setTimestamp()
                .setDescription(`Type : **${resetType}** | Cible : **${targetLabel}**`)
            ]}));
        });

        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
