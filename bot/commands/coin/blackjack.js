const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

const SUITS  = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function newDeck() {
    const d = [];
    for (const s of SUITS) for (const v of VALUES) d.push(`${v}${s}`);
    return d.sort(() => Math.random() - 0.5);
}
function cardValue(card) {
    const v = card.slice(0, -1);
    if (['J','Q','K'].includes(v)) return 10;
    if (v === 'A') return 11;
    return parseInt(v);
}
function handScore(cards) {
    let score = cards.reduce((a, c) => a + cardValue(c), 0);
    let aces  = cards.filter(c => c.startsWith('A')).length;
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

module.exports = {
    name: "blackjack",
    aliases: ["bj", "21"],
    description: "Joue au Blackjack contre le dealer",
    category: "coin",
    usage: ["blackjack <montant>"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId    = message.author.id;
        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;

        const maxBet = client.db.get(`max_blackjack_${guildId}`) || Infinity;
        const amount = args[0] === 'all' ? hand : parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply(`Indiquez un montant valide.`);
        if (amount > hand)   return message.reply(`Vous n'avez que **${hand} ${coinEmoji}** en main.`);
        if (amount > maxBet) return message.reply(`La mise maximale au Blackjack est de **${maxBet} ${coinEmoji}**.`);

        const deck        = newDeck();
        const playerCards = [deck.pop(), deck.pop()];
        const dealerCards = [deck.pop(), deck.pop()];

        const buildEmbed = (showDealer = false, result = null) => {
            const pScore = handScore(playerCards);
            const dScore = showDealer ? handScore(dealerCards) : null;
            let embedColor = color, title = '🃏 Blackjack';
            if (result === 'win')  { embedColor = '#57F287'; title = '🃏 Blackjack — GAGNÉ ! 🏆'; }
            if (result === 'lose') { embedColor = '#ED4245'; title = '🃏 Blackjack — PERDU !'; }
            if (result === 'push') { embedColor = '#FEE75C'; title = '🃏 Blackjack — ÉGALITÉ !'; }
            if (result === 'bust') { embedColor = '#ED4245'; title = '🃏 Blackjack — BUST !'; }
            if (result === 'bj')   { embedColor = '#FFD700'; title = '🃏 BLACKJACK ! 🎉'; }
            return new Discord.EmbedBuilder()
                .setTitle(title).setColor(embedColor)
                .addFields({ name: 'Votre main', value: `${playerCards.join(' ')} — Score : **${pScore}**`, inline: true })
                .addFields({ name: 'Dealer', value: showDealer ? `${dealerCards.join(' ')} — Score : **${dScore}**` : `${dealerCards[0]} 🂠 — ?`, inline: true })
                .addFields({ name: 'Mise', value: `**${amount} ${coinEmoji}**`, inline: false });
        };

        const buildRow = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bj_hit').setLabel('🃏 Tirer').setStyle(Discord.ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('bj_stand').setLabel('🛑 Rester').setStyle(Discord.ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('bj_double').setLabel('2x Double').setStyle(Discord.ButtonStyle.Danger).setDisabled(hand < amount * 2),
        );

        const settle = async (i, result) => {
            let gain = 0;
            if (result === 'win')  { gain = amount; client.db.add(`coin_hand_${userId}_${guildId}`, amount); }
            else if (result === 'bj')   { gain = Math.floor(amount * 1.5); client.db.add(`coin_hand_${userId}_${guildId}`, gain); }
            else if (result === 'lose' || result === 'bust') { client.db.subtract(`coin_hand_${userId}_${guildId}`, amount); gain = -amount; }
            const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            const embed = buildEmbed(true, result);
            embed.addFields({ name: 'Résultat', value: `${gain >= 0 ? '+' : ''}${gain} ${coinEmoji} → En main : **${newTotal} ${coinEmoji}**`, inline: false });
            if (i) await i.update(v2({ embeds: [embed], components: [] }));
            else   await msg.edit(v2({ embeds: [embed], components: [] }));
        };

        if (handScore(playerCards) === 21) {
            const msg = await message.channel.send(v2({ embeds: [buildEmbed(true)], components: [] }));
            return settle(null, 'bj');
        }

        const msg = await message.channel.send(v2({ embeds: [buildEmbed()], components: [buildRow()] }));
        const col = msg.createMessageComponentCollector({ time: 60000 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce jeu ne vous appartient pas.', ephemeral: true });

            if (i.customId === 'bj_hit') {
                playerCards.push(deck.pop());
                if (handScore(playerCards) > 21) { col.stop(); return settle(i, 'bust'); }
                if (handScore(playerCards) === 21) {
                    col.stop();
                    while (handScore(dealerCards) < 17) dealerCards.push(deck.pop());
                    const pS = handScore(playerCards), dS = handScore(dealerCards);
                    return settle(i, dS > 21 || pS > dS ? 'win' : pS < dS ? 'lose' : 'push');
                }
                await i.update(v2({ embeds: [buildEmbed()], components: [buildRow()] }));

            } else if (i.customId === 'bj_stand') {
                col.stop();
                while (handScore(dealerCards) < 17) dealerCards.push(deck.pop());
                const pS = handScore(playerCards), dS = handScore(dealerCards);
                return settle(i, dS > 21 || pS > dS ? 'win' : pS < dS ? 'lose' : 'push');

            } else if (i.customId === 'bj_double') {
                col.stop();
                playerCards.push(deck.pop());
                const pS = handScore(playerCards);
                const curHand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                if (pS > 21) {
                    client.db.subtract(`coin_hand_${userId}_${guildId}`, Math.min(amount * 2, curHand));
                    const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                    const embed = buildEmbed(true, 'bust');
                    embed.addFields({ name: 'Résultat', value: `-${amount * 2} ${coinEmoji} (double) → En main : **${newTotal} ${coinEmoji}**`, inline: false });
                    return i.update(v2({ embeds: [embed], components: [] }));
                }
                while (handScore(dealerCards) < 17) dealerCards.push(deck.pop());
                const dS = handScore(dealerCards);
                if (dS > 21 || pS > dS) {
                    client.db.add(`coin_hand_${userId}_${guildId}`, amount * 2);
                    const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                    const embed = buildEmbed(true, 'win');
                    embed.setTitle('🃏 Blackjack — GAGNÉ ! (x2)');
                    embed.addFields({ name: 'Résultat', value: `+${amount * 2} ${coinEmoji} (double) → En main : **${newTotal} ${coinEmoji}**`, inline: false });
                    return i.update(v2({ embeds: [embed], components: [] }));
                } else if (pS < dS) {
                    client.db.subtract(`coin_hand_${userId}_${guildId}`, Math.min(amount * 2, curHand));
                    const newTotal = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
                    const embed = buildEmbed(true, 'lose');
                    embed.addFields({ name: 'Résultat', value: `-${amount * 2} ${coinEmoji} (double) → En main : **${newTotal} ${coinEmoji}**`, inline: false });
                    return i.update(v2({ embeds: [embed], components: [] }));
                } else {
                    return i.update(v2({ embeds: [buildEmbed(true, 'push')], components: [] }));
                }
            }
        });
        col.on('end', (c) => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
