const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "setrole",
    aliases: ["roleconfig"],
    description: "Configure les rôles requis pour accéder aux différentes fonctions",
    category: "coin",
    ownerOnly: true,
    usage: ["setrole <coin|film|casino|shop|team|entreprise|mine> <@role|off>"],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);
        const guildId = message.guild.id;
        const types = ['coin', 'film', 'casino', 'shop', 'team', 'entreprise', 'mine'];
        const type = args[0];

        if (!type) {
            const lines = types.map(t => {
                const roleId = client.db.get(`required_role_${t}_${guildId}`);
                return `**${t}** — ${roleId ? `<@&${roleId}>` : 'Tout le monde'}`;
            });
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🎭 Rôles requis')
                .setColor(color)
                .setDescription(lines.join('\n'))
            ]}));
        }

        if (!types.includes(type)) return message.reply(`Type inconnu. Disponibles : ${types.join(', ')}`);

        if (args[1] === 'off') {
            client.db.delete(`required_role_${type}_${guildId}`);
            return message.reply(`✅ Aucun rôle requis pour **${type}** désormais.`);
        }

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) return message.reply(`Mentionnez un rôle valide ou utilisez \`off\` pour désactiver.`);

        client.db.set(`required_role_${type}_${guildId}`, role.id);
        message.reply(`✅ Rôle requis pour **${type}** : ${role}.`);
    }
};
