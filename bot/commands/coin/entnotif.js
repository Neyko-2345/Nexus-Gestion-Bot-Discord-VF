const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "entnotif",
    aliases: ["entreprisenotif", "entnotification"],
    description: "Active ou désactive les notifications DM de votre coffre d'entreprise",
    category: "coin",
    usage: ["entnotif"],
    run: async (client, message, args, color, prefix, footer) => {
        const userId  = message.author.id;
        const guildId = message.guild.id;

        const ent = client.db.get(`ent_${userId}_${guildId}`);
        if (!ent) return message.reply(`Vous n'avez pas d'entreprise.`);

        const current   = client.db.get(`ent_notif_${userId}_${guildId}`);
        const isEnabled = current !== false;
        const newVal    = !isEnabled;
        client.db.set(`ent_notif_${userId}_${guildId}`, newVal);

        return message.reply(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('🔔 Notifications Entreprise')
            .setColor(newVal ? '#57F287' : '#ED4245').setTimestamp()
            .setDescription(
                `Notifications ${newVal ? '✅ **activées**' : '❌ **désactivées**'}.\n\n` +
                `${newVal
                    ? 'Vous recevrez un DM quand votre coffre est plein.'
                    : 'Vous ne recevrez plus de DM quand votre coffre est plein.'}\n\n` +
                `*Utilisez à nouveau \`${prefix}entnotif\` pour ${newVal ? 'désactiver' : 'réactiver'}.*`
            )
        ]}));
    }
};
