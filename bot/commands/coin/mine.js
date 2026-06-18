const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const DEFAULT_MINERAIS = [
    { name: 'Charbon',         emoji: '▪️',                                     value: 20,  chance: 5 },
    { name: 'Azuryn',          emoji: '<:dsclookup:1514405513901903913>',        value: 50,  chance: 5 },
    { name: 'Amethyst',        emoji: '<:dsclookup:1514405529596858432>',        value: 100, chance: 3 },
    { name: 'Pierre de lune rose', emoji: '<:dsclookup:1514405478254510122>',    value: 150, chance: 2 },
    { name: 'Béryl rouge',     emoji: '<:dsclookup:1514405563495092304>',        value: 500, chance: 1 },
];

const MAX_CHARGES    = 3;
const CHARGE_COOLDOWN = 15 * 60 * 1000; // 15 minutes

module.exports = {
    name: "mine",
    aliases: ["miner"],
    description: "Mine des minerais avec votre wagon (3 charges / 15min)",
    category: "coin",
    usage: ["mine"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId  = message.author.id;
        const guildId = message.guild.id;
        const P       = client.db.get(`prefix_${guildId}`) || '&';

        // Récupérer le nom dynamique du wagon dans le shop
        const shopItems = client.db.get(`shop_items_${guildId}`) || [
            { name: 'Wagon', emoji: '🚂', price: 200, description: 'Permet de miner des minerais (3 charges / 15min)', type: 'wagon' },
            { name: 'Entreprise', emoji: '🏢', price: 5000, description: 'Créez votre propre entreprise et engagez des employés', type: 'entreprise' },
        ];
        const wagonItem  = shopItems.find(i => i.type === 'wagon');
        const wagonName  = wagonItem?.name  || 'Wagon';
        const wagonEmoji = wagonItem?.emoji || '🚂';

        // Vérifier si l'utilisateur possède un wagon (uses totales)
        const wagonUses = client.db.get(`wagon_uses_${userId}_${guildId}`) || 0;
        if (wagonUses <= 0) {
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setDescription(`❌ Vous n'avez plus de **${wagonName}** !\nAchetez-en un dans \`${P}shop\`.`)
            ]});
        }

        // Système de charges (3 charges / 15min)
        const chargesKey      = `mine_charges_${userId}_${guildId}`;
        const chargesResetKey = `mine_charges_reset_${userId}_${guildId}`;
        const now             = Date.now();

        let charges   = client.db.get(chargesKey);
        const lastReset = client.db.get(chargesResetKey) || 0;

        // Si jamais initialisé → plein
        if (charges === null || charges === undefined) {
            charges = MAX_CHARGES;
            client.db.set(chargesKey, MAX_CHARGES);
            client.db.set(chargesResetKey, now);
        }

        // Si 0 charges → vérifier rechargement
        if (charges <= 0) {
            const timeSinceReset = now - lastReset;
            if (timeSinceReset >= CHARGE_COOLDOWN) {
                charges = MAX_CHARGES;
                client.db.set(chargesKey, MAX_CHARGES);
                client.db.set(chargesResetKey, now);
            } else {
                const remaining = CHARGE_COOLDOWN - timeSinceReset;
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle(`${wagonEmoji} ${wagonName} en rechargement…`)
                    .setDescription(`Votre **${wagonName}** recharge ses charges !\nRevenez dans **${m}m ${s}s** (**${MAX_CHARGES} charges** disponibles).`)
                ]}));
            }
        }

        // Déduire une charge et une utilisation de wagon
        client.db.subtract(chargesKey, 1);
        client.db.subtract(`wagon_uses_${userId}_${guildId}`, 1);

        const chargesLeft = client.db.get(chargesKey) || 0;
        // Enregistrer l'heure de reset quand on utilise la dernière charge
        if (chargesLeft === 0) {
            client.db.set(chargesResetKey, now);
        }

        // Tirer un minerai selon les chances
        const minerais = client.db.get(`minerais_${guildId}`) || DEFAULT_MINERAIS;
        const totalChance = minerais.reduce((a, m) => a + (m.chance || 1), 0);
        const roll        = Math.floor(Math.random() * totalChance) + 1;
        let found = minerais[0];
        let cumulative = 0;
        for (const m of minerais) {
            cumulative += (m.chance || 1);
            if (roll <= cumulative) { found = m; break; }
        }

        // Stocker le minerai dans l'inventaire
        client.db.add(`mine_inv_${userId}_${guildId}_${found.name}`, 1);

        // XP silencieux (non affiché)
        const xpActive = client.db.get(`xp_active_${guildId}`) !== false;
        const xpGain   = xpActive ? (Math.floor(Math.random() * 5) + 2) : 0;
        if (xpGain > 0) client.db.add(`xp_${userId}_${guildId}`, xpGain);

        const coinEmoji  = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const wagonUsesLeft = client.db.get(`wagon_uses_${userId}_${guildId}`) || 0;

        let chargesLine;
        if (chargesLeft > 0) {
            chargesLine = `🔋 Charges restantes : **${chargesLeft}/${MAX_CHARGES}**`;
        } else {
            chargesLine = `🔋 Charges épuisées — Recharge dans **15 min**`;
        }

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#F1C40F').setTimestamp()
            .setTitle(`${wagonEmoji} Mine — ${found.emoji} ${found.name}`)
            .setDescription(
                `Vous avez miné et trouvé : **${found.emoji} ${found.name}** !\n` +
                `Valeur : **${found.value} ${coinEmoji}**\n\n` +
                `${chargesLine}\n` +
                `${wagonEmoji} Utilisations de wagon : **${wagonUsesLeft}**\n` +
                `*Inventaire : \`${P}minerais\` — Vendre : \`${P}sellminerais\`*`
            )
        ]}));
    }
};
