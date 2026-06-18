const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { bot } = require('../../structures/client');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

module.exports = {
    name: "coinreset",
    aliases: ["resetcoin"],
    description: "Remet à zéro les données d'un ou tous les membres (owner seulement)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "coinreset coins [@membre|all]",
        "coinreset xp [@membre|all]",
        "coinreset cartes [@membre|all]",
        "coinreset all [@membre|all]",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const type = args[0];
        const target = args[1] === 'all' ? 'all' : (message.mentions.members.first() || message.guild.members.cache.get(args[1]));

        if (!type || !target) return message.reply(`Usage : \`${prefix}coinreset <coins|xp|cartes|all> <@membre|all>\``);

        const validTypes = ['coins', 'xp', 'cartes', 'all'];
        if (!validTypes.includes(type)) return message.reply(`❌ Type invalide. Choix : \`${validTypes.join(', ')}\``);

        const guildId = message.guild.id;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('cr_confirm').setLabel('✅ Confirmer').setStyle(Discord.ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('cr_cancel').setLabel('❌ Annuler').setStyle(Discord.ButtonStyle.Secondary)
        );
        const who = target === 'all' ? '**TOUS les membres**' : `${target}`;
        const msg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`⚠️ Vous allez réinitialiser **${type}** de ${who}.\nCette action est **irréversible**. Confirmer ?`)
        ], components: [row] }));

        const col = msg.createMessageComponentCollector({ time: 30000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            if (i.customId === 'cr_cancel') return i.update(v2({ embeds: [new Discord.EmbedBuilder().setColor('#57F287').setDescription('Annulé.')], components: [] }));

            const monnaies = ['coin_hand', 'coin_bank', 'coin_bronze', 'coin_silver', 'coin_gold', 'coin_celestial'];
            const targets = target === 'all' ? [...message.guild.members.cache.keys()] : [target.id];

            for (const uid of targets) {
                if (type === 'coins' || type === 'all') {
                    for (const m of monnaies) client.db.set(`${m}_${uid}_${guildId}`, 0);
                }
                if (type === 'xp' || type === 'all') {
                    client.db.set(`xp_${uid}_${guildId}`, 0);
                }
                if (type === 'cartes' || type === 'all') {
                    client.db.set(`boosters_${uid}`, { classique: 0, premium: 0, legendaire: 0 });
                    client.db.set(`collection_${uid}`, []);
                    client.db.delete(`col_page_${uid}`);
                    client.db.delete(`booster_sess_${uid}`);
                    client.db.delete(`col_main_msg_${uid}`);
                    client.db.delete(`col_sell_card_${uid}`);
                }
            }

            i.update(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#57F287').setTimestamp()
                .setDescription(`✅ Réinitialisation **${type}** effectuée pour ${who}.`)
            ], components: [] }));
        });
    }
};
