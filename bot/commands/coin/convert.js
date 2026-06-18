const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "convert",
    aliases: ["convertir"],
    description: "Convertit vos monnaies entre elles",
    category: "coin",
    usage: ["convert"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId = message.author.id;
        const guildId = message.guild.id;

        const bronzeRate    = client.db.get(`convert_bronze_to_coin_${guildId}`)     || 10;
        const silverRate    = client.db.get(`convert_silver_to_bronze_${guildId}`)   || 10;
        const goldRate      = client.db.get(`convert_gold_to_silver_${guildId}`)     || 10;
        const celestialRate = client.db.get(`convert_celestial_to_gold_${guildId}`)  || 10;

        const coinEmoji      = client.db.get(`coin_emoji_${guildId}`)      || '<:coin:1510618513876717709>';
        const bronzeEmoji    = client.db.get(`bronze_emoji_${guildId}`)    || '<:emoji_280:1515365609335029942>';
        const silverEmoji    = client.db.get(`silver_emoji_${guildId}`)    || '<:emoji_281:1515365638846021793>';
        const goldEmoji      = client.db.get(`gold_emoji_${guildId}`)      || '<:emoji_282:1515365659247251576>';
        const celestialEmoji = client.db.get(`celestial_emoji_${guildId}`) || '<:emoji_283:1515365679698673857>';

        const coinName      = client.db.get(`coin_name_${guildId}`)      || 'Coin';
        const bronzeName    = client.db.get(`bronze_name_${guildId}`)    || 'Bronze';
        const silverName    = client.db.get(`silver_name_${guildId}`)    || 'Argent';
        const goldName      = client.db.get(`gold_name_${guildId}`)      || 'Or';
        const celestialName = client.db.get(`celestial_name_${guildId}`) || 'Pièce Céleste';

        const getUserMoney = () => ({
            coin:      client.db.get(`coin_hand_${userId}_${guildId}`)      || 0,
            bronze:    client.db.get(`coin_bronze_${userId}_${guildId}`)    || 0,
            silver:    client.db.get(`coin_silver_${userId}_${guildId}`)    || 0,
            gold:      client.db.get(`coin_gold_${userId}_${guildId}`)      || 0,
            celestial: client.db.get(`coin_celestial_${userId}_${guildId}`) || 0,
        });

        const buildEmbed = () => {
            const m = getUserMoney();
            return new Discord.EmbedBuilder()
                .setTitle('💱 Conversion de monnaies')
                .setDescription(
                    `**Taux de change :**\n` +
                    `${coinEmoji} ${bronzeRate} ${coinName} = 1 ${bronzeName}\n` +
                    `${bronzeEmoji} ${silverRate} ${bronzeName} = 1 ${silverName}\n` +
                    `${silverEmoji} ${goldRate} ${silverName} = 1 ${goldName}\n` +
                    `${goldEmoji} ${celestialRate} ${goldName} = 1 ${celestialName}\n\n` +
                    `**Vos avoirs :**\n` +
                    `${coinEmoji} ${coinName} : **${m.coin}**\n` +
                    `${bronzeEmoji} ${bronzeName} : **${m.bronze}**\n` +
                    `${silverEmoji} ${silverName} : **${m.silver}**\n` +
                    `${goldEmoji} ${goldName} : **${m.gold}**\n` +
                    `${celestialEmoji} ${celestialName} : **${m.celestial}**\n\n` +
                    `*Cliquez un bouton puis entrez le montant à convertir*`
                )
                .setColor('#F1C40F').setTimestamp();
        };

        const buildRows = (m) => {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('conv_up_bronze')    .setLabel(`${coinName} → ${bronzeName}`)    .setStyle(Discord.ButtonStyle.Primary).setDisabled(m.coin      < bronzeRate),
                new ButtonBuilder().setCustomId('conv_up_silver')    .setLabel(`${bronzeName} → ${silverName}`)  .setStyle(Discord.ButtonStyle.Primary).setDisabled(m.bronze    < silverRate),
                new ButtonBuilder().setCustomId('conv_up_gold')      .setLabel(`${silverName} → ${goldName}`)    .setStyle(Discord.ButtonStyle.Primary).setDisabled(m.silver    < goldRate),
                new ButtonBuilder().setCustomId('conv_up_celestial') .setLabel(`${goldName} → ${celestialName}`) .setStyle(Discord.ButtonStyle.Primary).setDisabled(m.gold      < celestialRate),
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('conv_down_bronze')    .setLabel(`${bronzeName} → ${coinName}`)    .setStyle(Discord.ButtonStyle.Secondary).setDisabled(m.bronze    < 1),
                new ButtonBuilder().setCustomId('conv_down_silver')    .setLabel(`${silverName} → ${bronzeName}`)  .setStyle(Discord.ButtonStyle.Secondary).setDisabled(m.silver    < 1),
                new ButtonBuilder().setCustomId('conv_down_gold')      .setLabel(`${goldName} → ${silverName}`)    .setStyle(Discord.ButtonStyle.Secondary).setDisabled(m.gold      < 1),
                new ButtonBuilder().setCustomId('conv_down_celestial') .setLabel(`${celestialName} → ${goldName}`) .setStyle(Discord.ButtonStyle.Secondary).setDisabled(m.celestial < 1),
            );
            return [row1, row2];
        };

        const msg = await message.channel.send(v2({ embeds: [buildEmbed()], components: buildRows(getUserMoney()) }));
        const col = msg.createMessageComponentCollector({ time: 120000 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });

            // Construire la modal selon le bouton cliqué
            const convMap = {
                conv_up_bronze:      { from: coinName,      to: bronzeName,    fromKey: 'coin_hand',      toKey: 'coin_bronze',    rate: bronzeRate,    isUpgrade: true  },
                conv_up_silver:      { from: bronzeName,    to: silverName,    fromKey: 'coin_bronze',    toKey: 'coin_silver',    rate: silverRate,    isUpgrade: true  },
                conv_up_gold:        { from: silverName,    to: goldName,      fromKey: 'coin_silver',    toKey: 'coin_gold',      rate: goldRate,      isUpgrade: true  },
                conv_up_celestial:   { from: goldName,      to: celestialName, fromKey: 'coin_gold',      toKey: 'coin_celestial', rate: celestialRate, isUpgrade: true  },
                conv_down_bronze:    { from: bronzeName,    to: coinName,      fromKey: 'coin_bronze',    toKey: 'coin_hand',      rate: bronzeRate,    isUpgrade: false },
                conv_down_silver:    { from: silverName,    to: bronzeName,    fromKey: 'coin_silver',    toKey: 'coin_bronze',    rate: silverRate,    isUpgrade: false },
                conv_down_gold:      { from: goldName,      to: silverName,    fromKey: 'coin_gold',      toKey: 'coin_silver',    rate: goldRate,      isUpgrade: false },
                conv_down_celestial: { from: celestialName, to: goldName,      fromKey: 'coin_celestial', toKey: 'coin_gold',      rate: celestialRate, isUpgrade: false },
            };

            const conv = convMap[i.customId];
            if (!conv) return;

            const modal = new Discord.ModalBuilder()
                .setTitle(`Convertir — ${conv.from} → ${conv.to}`)
                .setCustomId(`conv_modal_${i.customId}`);
            const amountInput = new Discord.TextInputBuilder()
                .setCustomId('conv_amount')
                .setLabel(`Combien de ${conv.from} à convertir ?`)
                .setStyle(Discord.TextInputStyle.Short)
                .setPlaceholder(`Ex: ${conv.rate}`)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));

            await i.showModal(modal);

            const mi = await i.awaitModalSubmit({ filter: m => m.user.id === userId, time: 60000 }).catch(() => null);
            if (!mi) return;

            const input = parseInt(mi.fields.getTextInputValue('conv_amount'));
            if (isNaN(input) || input <= 0) {
                return mi.reply({ content: '❌ Montant invalide.', ephemeral: true });
            }

            const currentBalance = client.db.get(`${conv.fromKey}_${userId}_${guildId}`) || 0;

            let actualSpend, gained;
            if (conv.isUpgrade) {
                // Upgrade: spend X source → floor(X / rate) destination
                gained = Math.floor(input / conv.rate);
                actualSpend = gained * conv.rate;
                if (gained === 0) return mi.reply({ content: `❌ Montant insuffisant. Il faut au moins **${conv.rate} ${conv.from}** pour obtenir 1 ${conv.to}.`, ephemeral: true });
                if (currentBalance < actualSpend) return mi.reply({ content: `❌ Vous n'avez pas assez de **${conv.from}**. Vous avez **${currentBalance}**, il vous faut **${actualSpend}**.`, ephemeral: true });
            } else {
                // Downgrade: spend X source → X * rate destination
                actualSpend = input;
                gained = input * conv.rate;
                if (currentBalance < actualSpend) return mi.reply({ content: `❌ Vous n'avez que **${currentBalance} ${conv.from}**.`, ephemeral: true });
            }

            client.db.subtract(`${conv.fromKey}_${userId}_${guildId}`, actualSpend);
            client.db.add(`${conv.toKey}_${userId}_${guildId}`, gained);

            await mi.reply({ content: `✅ Conversion effectuée : **-${actualSpend} ${conv.from}** → **+${gained} ${conv.to}**`, ephemeral: true });
            await msg.edit(v2({ embeds: [buildEmbed()], components: buildRows(getUserMoney()) })).catch(() => {});
        });

        col.on('end', () => msg.edit({ components: [] }).catch(() => {}));
    }
};
