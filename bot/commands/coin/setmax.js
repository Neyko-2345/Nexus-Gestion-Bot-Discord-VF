const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setmax",
    aliases: ["maxconfig"],
    description: "Modifie les limites maximales (mise, stockage...)",
    category: "coin",
    ownerOnly: true,
    usage: ["setmax <blackjack|slots|crash|pfc|casino|banque|wagon|entreprise> <valeur>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['blackjack', 'slots', 'crash', 'pfc', 'casino', 'banque', 'wagon', 'entreprise'];
        const type = args[0];
        const val = parseInt(args[1]);

        if (!type) {
            const lines = types.map(t => `**${t}** — max: ${client.db.get(`max_${t}_${guildId}`) ?? 'illimité'}`);
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📏 Limites maximales')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);
        if (isNaN(val) || val <= 0) return message.reply(`Valeur invalide.`);

        client.db.set(`max_${type}_${guildId}`, val);
        message.reply(`✅ Max **${type}** réglé à **${val}**.`);
    }
};
