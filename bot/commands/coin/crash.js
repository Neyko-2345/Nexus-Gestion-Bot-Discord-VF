const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "crash",
    aliases: ["crashgame"],
    description: "Jeu Crash — retire avant que ça crash pour multiplier ta mise !",
    category: "coin",
    usage: ["crash <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const maxBet    = client.db.get(`max_crash_${guildId}`) || Infinity;

        const amount = args[0] === 'all' ? hand : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Indiquez un montant valide.`);
        if (amount > hand)   return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);
        if (amount > maxBet) return message.reply(`La mise maximale au Crash est de **${maxBet} ${coinEmoji}**.`);

        const r = Math.random();
        const crashAt   = +(Math.max(1.01, 0.99 / r)).toFixed(2);
        let multiplier  = 1.00;
        let crashed     = false;
        let cashedOut   = false;

        const buildEmbed = () => new Discord.EmbedBuilder()
            .setTitle(`💥 CRASH — En cours`)
            .setDescription(
                `**Multiplicateur actuel : x${multiplier.toFixed(2)}**\n\n` +
                `Mise : **${amount} ${coinEmoji}**\n` +
                `Potentiel : **${Math.floor(amount * multiplier)} ${coinEmoji}**\n\n` +
                `Appuyez sur **Cash Out** avant que ça crash !`
            )
            .setColor('#FEE75C');

        const buildRow = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('crash_cashout').setLabel(`💰 Cash Out (x${multiplier.toFixed(2)})`).setStyle(Discord.ButtonStyle.Success)
        );

        const msg = await message.channel.send(v2({ embeds: [buildEmbed()], components: [buildRow()] }));
        const col = msg.createMessageComponentCollector({ time: 30000 });

        const interval = setInterval(async () => {
            if (cashedOut) { clearInterval(interval); return; }
            multiplier = +(multiplier + 0.1 + Math.random() * 0.15).toFixed(2);
            if (multiplier >= crashAt) {
                clearInterval(interval);
                crashed = true;
                col.stop();
                client.db.subtract(`coin_hand_${userId}_${guildId}`, Math.min(amount, client.db.get(`coin_hand_${userId}_${guildId}`) || 0));
                const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                msg.edit(v2({ embeds: [new Discord.EmbedBuilder()
                    .setTitle(`💥 CRASH à x${crashAt} !`)
                    .setDescription(`Le jeu a crashé à **x${crashAt}** !\n\nVous avez perdu **${amount} ${coinEmoji}**.\nEn main : **${newTotal} ${coinEmoji}**`)
                    .setColor('#ED4245').setTimestamp()
                ], components: [] })).catch(() => {});
            } else {
                msg.edit(v2({ embeds: [buildEmbed()], components: [buildRow()] })).catch(() => {});
            }
        }, 1500);

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce jeu ne vous appartient pas.', ephemeral: true });
            if (crashed || cashedOut) return;
            cashedOut = true;
            clearInterval(interval);
            col.stop();
            const gain     = Math.floor(amount * multiplier);
            const net      = gain - amount;
            client.db.add(`coin_hand_${userId}_${guildId}`, net);
            const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle(`✅ Cash Out à x${multiplier.toFixed(2)} !`)
                .setDescription(
                    `Vous avez cashé à **x${multiplier.toFixed(2)}** !\n` +
                    `+**${net} ${coinEmoji}** → En main : **${newTotal} ${coinEmoji}**\n` +
                    `*(Le jeu aurait crashé à x${crashAt})*`
                )
                .setColor('#57F287').setTimestamp()
            ], components: [] }));
        });
        col.on('end', () => { clearInterval(interval); if (!crashed && !cashedOut) msg.edit({ components: [] }).catch(() => {}); });
    }
};
