const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "pfc",
    aliases: ["rps", "pierrefeuilleciseaux"],
    description: "Pierre Feuille Ciseaux — mise des coins",
    category: "coin",
    usage: ["pfc <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const amount    = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Indiquez un montant valide.`);
        if (amount > hand) return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);

        const choices = ['🪨 Pierre', '📄 Feuille', '✂️ Ciseaux'];
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pfc_pierre').setLabel('🪨 Pierre').setStyle(Discord.ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('pfc_feuille').setLabel('📄 Feuille').setStyle(Discord.ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('pfc_ciseaux').setLabel('✂️ Ciseaux').setStyle(Discord.ButtonStyle.Secondary),
        );

        const msg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('🎮 Pierre Feuille Ciseaux')
            .setDescription(`Mise : **${amount} ${coinEmoji}**\nChoisissez votre coup !`)
            .setColor('#F1C40F')
        ], components: [row] }));

        const col = msg.createMessageComponentCollector({ time: 30000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce jeu ne vous appartient pas.', ephemeral: true });

            const choiceMap = { pfc_pierre: 0, pfc_feuille: 1, pfc_ciseaux: 2 };
            const playerIdx = choiceMap[i.customId];
            const botIdx    = Math.floor(Math.random() * 3);
            const playerName = choices[playerIdx];
            const botName    = choices[botIdx];

            let result;
            if (playerIdx === botIdx) { result = 'égalité'; }
            else if ((playerIdx === 0 && botIdx === 2) || (playerIdx === 1 && botIdx === 0) || (playerIdx === 2 && botIdx === 1)) { result = 'gagné'; }
            else { result = 'perdu'; }

            let desc, embedColor;
            const newHand = () => client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            if (result === 'gagné') {
                client.db.add(`coin_hand_${userId}_${guildId}`, amount);
                desc = `Vous : ${playerName} vs Bot : ${botName}\n\n🏆 **GAGNÉ ! +${amount} ${coinEmoji}**\nEn main : **${newHand()} ${coinEmoji}**`;
                embedColor = '#57F287';
            } else if (result === 'perdu') {
                client.db.subtract(`coin_hand_${userId}_${guildId}`, amount);
                desc = `Vous : ${playerName} vs Bot : ${botName}\n\n❌ **PERDU ! -${amount} ${coinEmoji}**\nEn main : **${newHand()} ${coinEmoji}**`;
                embedColor = '#ED4245';
            } else {
                desc = `Vous : ${playerName} vs Bot : ${botName}\n\n🤝 **ÉGALITÉ ! Mise remboursée.**`;
                embedColor = '#FEE75C';
            }

            await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎮 Pierre Feuille Ciseaux — Résultat')
                .setDescription(desc).setColor(embedColor).setTimestamp()
            ], components: [] }));
        });
        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
