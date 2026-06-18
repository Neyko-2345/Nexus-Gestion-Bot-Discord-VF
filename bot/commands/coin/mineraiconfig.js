const Discord = require('discord.js');
const { bot } = require('../../structures/client');

module.exports = {
    name: "mineraiconfig",
    aliases: ["addminerais", "delminerais", "modifminerais"],
    description: "Gère les minerais disponibles à la mine (owner seulement)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "mineraiconfig add <nom> <emoji> <valeur> <chance/10>",
        "mineraiconfig remove <nom>",
        "mineraiconfig modify <nom> <valeur|chance> <nouvelle_valeur>",
        "mineraiconfig list",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.channel.send(`Cette commande est réservée aux owners.`);

        const guildId = message.guild.id;
        const sub = args[0];
        const minerais = client.db.get(`minerais_${guildId}`) || [
            { name: 'Charbon',           emoji: '▪️',                                  value: 20,  chance: 5 },
            { name: 'Azuryn',            emoji: '<:dsclookup:1514405513901903913>',     value: 50,  chance: 5 },
            { name: 'Amethyst',          emoji: '<:dsclookup:1514405529596858432>',     value: 100, chance: 3 },
            { name: 'Pierre de lune rose', emoji: '<:dsclookup:1514405478254510122>',   value: 150, chance: 2 },
            { name: 'Béryl rouge',       emoji: '<:dsclookup:1514405563495092304>',     value: 500, chance: 1 },
        ];

        if (sub === 'add') {
            const [, name, emoji, value, chance] = args;
            if (!name || !emoji || isNaN(parseInt(value)) || isNaN(parseInt(chance))) return message.reply(`Usage : \`${prefix}mineraiconfig add <nom> <emoji> <valeur> <chance/10>\``);
            if (minerais.find(m => m.name.toLowerCase() === name.toLowerCase())) return message.reply(`Minerai \`${name}\` existe déjà.`);
            minerais.push({ name, emoji, value: parseInt(value), chance: parseInt(chance) });
            client.db.set(`minerais_${guildId}`, minerais);
            return message.reply(`✅ Minerai **${emoji} ${name}** ajouté (valeur: ${value} coins, chance: ${chance}/10).`);
        }

        if (sub === 'remove') {
            const name = args.slice(1).join(' ');
            const idx = minerais.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
            if (idx === -1) return message.reply(`Minerai \`${name}\` introuvable.`);
            minerais.splice(idx, 1);
            client.db.set(`minerais_${guildId}`, minerais);
            return message.reply(`✅ Minerai \`${name}\` supprimé.`);
        }

        if (sub === 'modify') {
            const name = args[1];
            const prop = args[2]; // value ou chance
            const val = parseInt(args[3]);
            const m = minerais.find(m => m.name.toLowerCase() === name?.toLowerCase());
            if (!m) return message.reply(`Minerai \`${name}\` introuvable.`);
            if (!['value', 'chance', 'emoji', 'name'].includes(prop)) return message.reply(`Propriété invalide : value, chance, emoji, name`);
            if (['value','chance'].includes(prop)) { if (isNaN(val)) return message.reply(`Valeur invalide.`); m[prop] = val; }
            else { m[prop] = args.slice(3).join(' '); }
            client.db.set(`minerais_${guildId}`, minerais);
            return message.reply(`✅ Minerai \`${name}\` modifié.`);
        }

        if (sub === 'list') {
            const embed = new Discord.EmbedBuilder().setTitle('⛏️ Minerais configurés').setColor(color)
                .setDescription(minerais.map(m => `${m.emoji} **${m.name}** — ${m.value} coins, chance: ${m.chance}/10`).join('\n'));
            return message.channel.send({ embeds: [embed] });
        }

        message.reply(`Usage : \`${prefix}mineraiconfig add|remove|modify|list ...\``);
    }
};
