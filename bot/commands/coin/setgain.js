const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setgain",
    aliases: ["gainconfig"],
    description: "Modifie les gains pour chaque type de commande",
    category: "coin",
    ownerOnly: true,
    usage: ["setgain <vocal|cam|bar|join|work|daily|mine|gift|rob|casino|slots> <montant> [max]"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['vocal', 'cam', 'bar', 'join', 'work', 'daily', 'mine', 'gift', 'rob', 'casino', 'slots', 'crash', 'pfc', 'blackjack'];
        const type = args[0];
        const amount = parseInt(args[1]);
        const max = args[2] ? parseInt(args[2]) : null;

        if (!type) {
            const lines = types.map(t => {
                const val = client.db.get(`gain_${t}_${guildId}`);
                const maxVal = client.db.get(`gain_${t}_max_${guildId}`);
                return `**${t}** — ${val ?? 'non configuré'}${maxVal ? ` (max: ${maxVal})` : ''}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('📊 Gains actuels')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);
        if (isNaN(amount) || amount < 0) return message.reply(`Montant invalide.`);

        client.db.set(`gain_${type}_${guildId}`, amount);
        if (max !== null && !isNaN(max)) client.db.set(`gain_${type}_max_${guildId}`, max);

        message.reply(`✅ Gain **${type}** réglé à **${amount}**${max ? ` (max: ${max})` : ''}.`);
    }
};
