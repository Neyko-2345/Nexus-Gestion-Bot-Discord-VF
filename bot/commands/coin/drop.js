const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "drop",
    aliases: ["colis"],
    description: "Lance un colis de coins dans le salon (owner seulement)",
    category: "coin",
    ownerOnly: true,
    usage: ["drop <montant> [monnaie: coin|bronze|silver|gold|celestial] [#salon]"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Indiquez un montant valide.`);

        const validMonnaies = ['coin', 'bronze', 'silver', 'gold', 'celestial'];
        let monnaie = 'coin';
        let targetChannel = message.channel;

        // Détecter monnaie et salon optionnel
        for (let i = 1; i < args.length; i++) {
            if (validMonnaies.includes(args[i])) { monnaie = args[i]; continue; }
            const mentionedChannel = message.mentions.channels.first();
            if (mentionedChannel) { targetChannel = mentionedChannel; continue; }
            const chanById = message.guild.channels.cache.get(args[i]);
            if (chanById) { targetChannel = chanById; continue; }
        }

        const guildId = message.guild.id;
        const emojiMap = {
            coin:      client.db.get(`coin_emoji_${guildId}`)      || '<:coin:1510618513876717709>',
            bronze:    client.db.get(`bronze_emoji_${guildId}`)    || '<:emoji_280:1515365609335029942>',
            silver:    client.db.get(`silver_emoji_${guildId}`)    || '<:emoji_281:1515365638846021793>',
            gold:      client.db.get(`gold_emoji_${guildId}`)      || '<:emoji_282:1515365659247251576>',
            celestial: client.db.get(`celestial_emoji_${guildId}`) || '<:emoji_283:1515365679698673857>',
        };
        const nameMap = {
            coin:      client.db.get(`coin_name_${guildId}`)      || 'Coin',
            bronze:    client.db.get(`bronze_name_${guildId}`)    || 'Bronze',
            silver:    client.db.get(`silver_name_${guildId}`)    || 'Argent',
            gold:      client.db.get(`gold_name_${guildId}`)      || 'Or',
            celestial: client.db.get(`celestial_name_${guildId}`) || 'Pièce Céleste',
        };

        const dropId = `drop_${Date.now()}`;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(dropId).setLabel('📦 Ouvrir le colis !').setStyle(Discord.ButtonStyle.Success)
        );

        const embed = new Discord.EmbedBuilder()
            .setTitle('📦 Colis lancé !')
            .setDescription(`${message.author} a lancé un colis contenant **${amount} ${emojiMap[monnaie]} ${nameMap[monnaie]}** !\n\n**Le premier qui clique reçoit tout !**`)
            .setColor('#F1C40F').setTimestamp();

        const msg = await targetChannel.send(v2({ embeds: [embed], components: [row] }));

        if (targetChannel.id !== message.channel.id) {
            message.reply(`✅ Colis envoyé dans ${targetChannel} !`);
        }

        client.db.set(`drop_${dropId}_${guildId}`, { amount, monnaie, claimed: false });

        const col = msg.createMessageComponentCollector({ max: 1, time: 60000 });
        col.on('collect', async i => {
            const dropData = client.db.get(`drop_${dropId}_${guildId}`);
            if (!dropData || dropData.claimed) return i.reply({ content: 'Ce colis a déjà été réclamé !', ephemeral: true });

            client.db.set(`drop_${dropId}_${guildId}`, { ...dropData, claimed: true });

            const dbKey = monnaie === 'coin' ? `coin_hand_${i.user.id}_${guildId}` : `coin_${monnaie}_${i.user.id}_${guildId}`;
            client.db.add(dbKey, amount);

            await i.update(v2({
                embeds: [new Discord.EmbedBuilder()
                    .setTitle('📦 Colis réclamé !')
                    .setDescription(`${i.user} a ouvert le colis et reçu **${amount} ${emojiMap[monnaie]} ${nameMap[monnaie]}** !`)
                    .setColor('#57F287').setTimestamp()
                ],
                components: []
            }));
        });
        col.on('end', collected => {
            if (collected.size === 0) {
                msg.edit(v2({ components: [], embeds: [new Discord.EmbedBuilder()
                    .setTitle('📦 Colis expiré')
                    .setDescription(`Personne n'a réclamé le colis de **${amount} ${emojiMap[monnaie]}** !`)
                    .setColor('#ED4245')
                ]})).catch(() => {});
            }
        });
    }
};
