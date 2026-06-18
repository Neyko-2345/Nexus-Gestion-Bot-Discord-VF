const Discord = require('discord.js');
const { v2 }  = require('../../utils/v2');
const fs      = require('fs');
const path    = require('path');
const { DEFAULTS } = require('../../utils/boosterAlgo');

const CONFIG_PATH = path.join(__dirname, '../../data/boosterConfig.json');

const TYPES = ['classique', 'premium', 'legendaire'];
const FIELDS = ['min', 'max'];

function readConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
}

function writeConfig(cfg) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

module.exports = {
    name: 'carteconfig',
    description: 'Configure les valeurs min/max des boosters (owner seulement)',
    category: 'cartes',
    ownerOnly: true,
    usage: [
        'carteconfig',
        'carteconfig set <classique|premium|legendaire> <min|max> <valeur>',
    ],

    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) ||
                        (client.config.buyers || []).includes(message.author.id) ||
                        client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send('❌ Commande réservée aux owners.');

        const cfg = readConfig();

        if (!args[0] || args[0] === 'get') {
            const lines = TYPES.map(t => {
                const c = cfg[t] || DEFAULTS[t];
                return `**${t.charAt(0).toUpperCase() + t.slice(1)}** — Min : \`${c.min}\` | Max : \`${c.max}\``;
            });
            return message.channel.send(v2({ embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('<:icontb:1516711894122237962> Config Boosters')
                    .setDescription(lines.join('\n'))
                    .setColor('#F1C40F')
            ]}));
        }

        if (args[0] === 'set') {
            const type  = args[1]?.toLowerCase();
            const field = args[2]?.toLowerCase();
            const val   = parseInt(args[3]);

            if (!TYPES.includes(type))   return message.reply(`❌ Type invalide. Choix : \`${TYPES.join(', ')}\``);
            if (!FIELDS.includes(field)) return message.reply(`❌ Champ invalide. Choix : \`min\`, \`max\``);
            if (isNaN(val) || val < 0)  return message.reply('❌ Valeur invalide. Donne un nombre positif.');

            if (!cfg[type]) cfg[type] = { ...DEFAULTS[type] };
            cfg[type][field] = val;

            if (cfg[type].min > cfg[type].max) {
                return message.reply(`❌ Le min (\`${cfg[type].min}\`) ne peut pas être supérieur au max (\`${cfg[type].max}\`).`);
            }

            writeConfig(cfg);

            return message.channel.send(v2({ embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('<:icontb:1516711894122237962> Config mise à jour')
                    .setDescription(
                        `✅ **${type.charAt(0).toUpperCase() + type.slice(1)}** — \`${field}\` défini à \`${val}\`\n` +
                        `Nouvelle config : Min \`${cfg[type].min}\` | Max \`${cfg[type].max}\``
                    )
                    .setColor('#F1C40F')
            ]}));
        }

        return message.reply(`Usage : \`${prefix}carteconfig\` ou \`${prefix}carteconfig set <classique|premium|legendaire> <min|max> <valeur>\``);
    },
};
