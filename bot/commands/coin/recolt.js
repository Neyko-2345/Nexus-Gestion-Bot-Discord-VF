const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "recolt",
    aliases: ["recolte", "harvest"],
    description: "Récoltez des drogues (Cultivateur uniquement)",
    category: "coin",
    usage: ["recolt"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId  = message.author.id;
        const guildId = message.guild.id;

        const capacity = client.db.get(`illegal_capacity_${userId}_${guildId}`);
        if (capacity !== 'cultivateur') {
            return message.channel.send({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setDescription(`❌ Vous devez être **Cultivateur** pour récolter.\nDevenez cultivateur via \`${prefix}mobil\`.`)
            ]});
        }

        const cooldown = client.db.get(`illegal_recolt_cooldown_${guildId}`) || 3600000;
        const lastKey  = `illegal_recolt_last_${userId}_${guildId}`;
        const lastRecolt = client.db.get(lastKey) || 0;
        const now      = Date.now();

        if (now - lastRecolt < cooldown) {
            const remaining = cooldown - (now - lastRecolt);
            const h = Math.floor(remaining / 3600000);
            const m = Math.floor((remaining % 3600000) / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            const timeStr = h > 0 ? `${h}h ${m}min` : m > 0 ? `${m}min ${s}s` : `${s}s`;
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('🌱 Récolte en attente…')
                .setDescription(`Vos plantes ne sont pas encore prêtes !\nRevenez dans **${timeStr}**.`)
            ]}));
        }

        const minDrugs = client.db.get(`illegal_recolt_min_${guildId}`) || 1;
        const maxDrugs = client.db.get(`illegal_recolt_max_${guildId}`) || 3;
        const gained   = Math.floor(Math.random() * (maxDrugs - minDrugs + 1)) + minDrugs;

        client.db.set(lastKey, now);
        client.db.add(`illegal_drugs_${userId}_${guildId}`, gained);

        const curDrugs  = client.db.get(`illegal_drugs_${userId}_${guildId}`) || 0;
        const curPrice  = client.db.get(`illegal_drug_price_${guildId}`)      || 500;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setColor('#57F287').setTimestamp()
            .setTitle('🌿 Récolte effectuée !')
            .setDescription(
                `Vous avez récolté **${gained}** drogue(s) !\n\n` +
                `💊 Stock total : **${curDrugs}** drogue(s)\n` +
                `📈 Prix actuel : **${curPrice} ${coinEmoji}**\n` +
                `💰 Valeur estimée : **${curDrugs * curPrice} ${coinEmoji}**\n\n` +
                `*Vendez vos drogues via \`${prefix}mobil\` → Contactes (Blanchisseur requis)*`
            )
        ]}));
    }
};
