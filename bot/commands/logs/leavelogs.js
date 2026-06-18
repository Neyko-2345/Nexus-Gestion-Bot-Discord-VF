const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "leavelogs",
    aliases: [],
    description: "Configure les logs de membres qui partent",
    category: "logs",
    usage: ["leavelogs on [salon]", "leavelogs off"],
    run: async (client, message, args, color, prefix, footer, commandName) => {
        let pass = false;
        if (!client.staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true) {
            for (let i = 1; i <= 5; i++) {
                if (client.db.get(`perm_${commandName}.${message.guild.id}`) === String(i) && message.member.roles.cache.some(r => client.db.get(`perm${i}.${message.guild.id}`)?.includes(r.id))) pass = true;
            }
            if (client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = true;
        } else pass = true;
        if (!pass) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`);

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) || message.channel;

        if (args[0] === "on") {
            client.db.set(`leavelogs_${message.guild.id}`, channel.id);
            return message.reply(`Les logs de départs seront envoyés dans ${channel}.`);
        }
        if (args[0] === "off") {
            client.db.delete(`leavelogs_${message.guild.id}`);
            return message.reply(`Les logs de départs sont désactivés.`);
        }
        message.reply(`Usage : \`${prefix}leavelogs on [salon]\` ou \`${prefix}leavelogs off\``);
    }
};
