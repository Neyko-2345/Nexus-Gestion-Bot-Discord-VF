const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

const COFFRE_LEVELS_DEFAULT = [
    { rank: 1, capacity: 5000,   price: 0,     image: 'https://i.postimg.cc/rwFHZ99J/niveau1.png' },
    { rank: 2, capacity: 7500,   price: 1000,  image: 'https://i.postimg.cc/25gX6NfN/niveau3.png' },
    { rank: 3, capacity: 10000,  price: 2500,  image: 'https://i.postimg.cc/cCS9R7Hm/niveau10.png' },
    { rank: 4, capacity: 25000,  price: 5000,  image: 'https://i.postimg.cc/DfrY2Njs/niveau11.png' },
    { rank: 5, capacity: 50000,  price: 10000, image: 'https://i.postimg.cc/PrdVNM0G/niveau12.png' },
    { rank: 6, capacity: 200000, price: 20000, image: 'https://i.postimg.cc/Yq8nFWwS/niveau15.png' },
];

module.exports = {
    name: "entconfig",
    aliases: ["entrepriseconfig", "configent"],
    description: "Configure le système d'entreprise (owner)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "entconfig addemployee <id> <nom> <prix> <gain/h> <salaire/j> <durée_jours>",
        "entconfig removeemployee <id>",
        "entconfig listemployees",
        "entconfig addcoffre <capacite> <prix>",
        "entconfig removecoffre <rank>",
        "entconfig listcoffre",
        "entconfig settax <montant> <intervalle_heures>",
        "entconfig setprice <prix>",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId   = message.guild.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const sub       = args[0];

        if (!sub) {
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('⚙️ EntConfig — Options disponibles')
                .setColor(color)
                .setDescription(module.exports.usage.map(u => `\`${prefix}${u}\``).join('\n'))
            ]}));
        }

        if (sub === 'addemployee') {
            const [, id, nom, prix, gain, salaire, duree] = args;
            if (!id || !nom || !prix || !gain || !salaire || !duree)
                return message.reply(`Usage : \`${prefix}entconfig addemployee <id> <nom> <prix> <gain/h> <salaire/j> <durée_jours>\``);
            const employees = client.db.get(`ent_employees_${guildId}`) || [];
            if (employees.find(e => e.id === id)) return message.reply(`Un employé avec l'ID \`${id}\` existe déjà.`);
            employees.push({ id, name: nom, price: parseInt(prix), gain: parseInt(gain), salary: parseInt(salaire), duration: parseInt(duree) });
            client.db.set(`ent_employees_${guildId}`, employees);
            return message.reply(`✅ Employé **${nom}** ajouté.`);
        }

        if (sub === 'removeemployee') {
            const employees = client.db.get(`ent_employees_${guildId}`) || [];
            const filtered  = employees.filter(e => e.id !== args[1]);
            if (filtered.length === employees.length) return message.reply(`Employé \`${args[1]}\` introuvable.`);
            client.db.set(`ent_employees_${guildId}`, filtered);
            return message.reply(`✅ Employé supprimé.`);
        }

        if (sub === 'listemployees') {
            const employees = client.db.get(`ent_employees_${guildId}`) || [];
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('👥 Employés configurés')
                .setColor(color)
                .setDescription(employees.length > 0
                    ? employees.map(e => `\`${e.id}\` **${e.name}** — ${e.price} ${coinEmoji} | +${e.gain}/h | Salaire: ${e.salary}/j | Durée: ${e.duration}j`).join('\n')
                    : 'Aucun employé.')
            ]}));
        }

        if (sub === 'addcoffre') {
            const [, capacite, prix] = args;
            if (!capacite || !prix) return message.reply(`Usage : \`${prefix}entconfig addcoffre <capacite> <prix>\``);
            const coffres = client.db.get(`ent_coffre_config_${guildId}`) || JSON.parse(JSON.stringify(COFFRE_LEVELS_DEFAULT));
            coffres.push({ capacity: parseInt(capacite), price: parseInt(prix), image: null });
            coffres.sort((a, b) => a.price - b.price);
            coffres.forEach((c, i) => c.rank = i + 1);
            client.db.set(`ent_coffre_config_${guildId}`, coffres);
            return message.reply(`✅ Coffre ajouté. Ranks recalculés.`);
        }

        if (sub === 'removecoffre') {
            const coffres = (client.db.get(`ent_coffre_config_${guildId}`) || []).filter((_, i) => i + 1 !== parseInt(args[1]));
            coffres.forEach((c, i) => c.rank = i + 1);
            client.db.set(`ent_coffre_config_${guildId}`, coffres);
            return message.reply(`✅ Coffre supprimé.`);
        }

        if (sub === 'listcoffre') {
            const coffres = client.db.get(`ent_coffre_config_${guildId}`) || [];
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('🏦 Coffres configurés')
                .setColor(color)
                .setDescription(coffres.length > 0
                    ? coffres.map(c => `**Rank ${c.rank}** — Capacité: ${c.capacity} ${coinEmoji} | Prix: ${c.price} ${coinEmoji}`).join('\n')
                    : 'Aucun coffre.')
            ]}));
        }

        if (sub === 'settax') {
            const [, montant, intervalH] = args;
            if (!montant || !intervalH) return message.reply(`Usage : \`${prefix}entconfig settax <montant> <intervalle_heures>\``);
            client.db.set(`ent_tax_amount_${guildId}`,    parseInt(montant));
            client.db.set(`ent_tax_interval_${guildId}`,  parseInt(intervalH));
            return message.reply(`✅ Impôt configuré : **${montant} ${coinEmoji}** tous les **${intervalH}h**.`);
        }

        if (sub === 'setprice') {
            const [, prix] = args;
            if (!prix) return message.reply(`Usage : \`${prefix}entconfig setprice <prix>\``);
            client.db.set(`ent_price_${guildId}`, parseInt(prix));
            return message.reply(`✅ Prix d'une entreprise : **${prix} ${coinEmoji}**.`);
        }

        message.reply(`Sous-commande inconnue. Utilisez \`${prefix}entconfig\` pour voir les options.`);
    }
};
