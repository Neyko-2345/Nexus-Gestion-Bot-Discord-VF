const Discord = require('discord.js');
const { v2 }  = require('../../utils/v2');
const fs      = require('fs');
const path    = require('path');

const PRICES_PATH    = path.join(__dirname, '../../data/boosterPrices.json');
const DEFAULT_PRICES = { classique: 1000, premium: 10000, legendaire: 50000 };
const TYPES          = ['classique', 'premium', 'legendaire'];
const LABELS         = { classique: 'Booster Classique', premium: 'Booster Premium', legendaire: 'Booster Légendaire' };

function readPrices() {
    try { return JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8')); }
    catch { return { ...DEFAULT_PRICES }; }
}

function writePrices(p) {
    fs.writeFileSync(PRICES_PATH, JSON.stringify(p, null, 2));
}

module.exports = {
    name: 'carteprix',
    description: 'Modifie le prix de vente des boosters dans le shop (owner seulement)',
    category: 'cartes',
    ownerOnly: true,
    usage: [
        'carteprix',
        'carteprix set <classique|premium|legendaire> <prix>',
    ],

    run: async (client, message, args, color, prefix) => {
        const isOwner = client.staff.includes(message.author.id) ||
                        (client.config.buyers || []).includes(message.author.id) ||
                        client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send('❌ Commande réservée aux owners.');

        const prices = readPrices();

        if (!args[0] || args[0] === 'get') {
            const lines = TYPES.map(t =>
                `**${LABELS[t]}** — \`${(prices[t] ?? DEFAULT_PRICES[t]).toLocaleString('fr-FR')}\` <:coin:1510618513876717709>`
            );
            return message.channel.send(v2({ embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('<:icontb:1516711894122237962> Prix des Boosters')
                    .setDescription(lines.join('\n'))
                    .setColor('#F1C40F')
            ]}));
        }

        if (args[0] === 'set') {
            const type = args[1]?.toLowerCase();
            const val  = parseInt(args[2]);

            if (!TYPES.includes(type)) return message.reply(`❌ Type invalide. Choix : \`${TYPES.join(', ')}\``);
            if (isNaN(val) || val < 1)  return message.reply('❌ Prix invalide. Donne un nombre entier positif.');

            prices[type] = val;
            writePrices(prices);

            return message.channel.send(v2({ embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('<:icontb:1516711894122237962> Prix mis à jour')
                    .setDescription(
                        `✅ **${LABELS[type]}** coûte désormais \`${val.toLocaleString('fr-FR')}\` <:coin:1510618513876717709>\n` +
                        `Le shop et les achats utilisent immédiatement ce nouveau prix.`
                    )
                    .setColor('#F1C40F')
            ]}));
        }

        return message.reply(`Usage : \`${prefix}carteprix\` ou \`${prefix}carteprix set <classique|premium|legendaire> <prix>\``);
    },
};
