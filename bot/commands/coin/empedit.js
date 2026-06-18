const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');

module.exports = {
    name: "empedit",
    aliases: ["employedit", "setemp"],
    description: "Modifie les stats des employés par défaut du serveur (owner uniquement)",
    category: "coin",
    ownerOnly: true,
    usage: [
        "empedit list",
        "empedit <id> price <montant>",
        "empedit <id> gain <montant>",
        "empedit <id> salary <montant>",
        "empedit <id> duration <jours>",
        "empedit <id> minrank <rang>",
        "empedit reset",
    ],
    run: async (client, message, args, color, prefix, footer) => {
        const isOwner = client.staff.includes(message.author.id)
            || client.config.buyers.includes(message.author.id)
            || client.db.get(`owner_${message.author.id}`) === true;
        if (!isOwner) return message.reply(`❌ Commande réservée aux owners.`);

        const guildId = message.guild.id;

        const DEFAULT_EMPLOYEES = [
            { id: 'stagiaire',  name: 'Stagiaire',  salary: 100,  gain: 50,   price: 1000,   duration: 3, minCoffreRank: 1 },
            { id: 'employe',    name: 'Employé',    salary: 500,  gain: 100,  price: 5000,   duration: 3, minCoffreRank: 2 },
            { id: 'manager',    name: 'Manager',    salary: 1000, gain: 200,  price: 10000,  duration: 3, minCoffreRank: 3 },
            { id: 'directeur',  name: 'Directeur',  salary: 1500, gain: 700,  price: 20000,  duration: 3, minCoffreRank: 4 },
            { id: 'pdg',        name: 'PDG',        salary: 5000, gain: 2000, price: 100000, duration: 3, minCoffreRank: 5 },
        ];

        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';
        const sub       = args[0]?.toLowerCase();

        // ── list ──
        if (!sub || sub === 'list') {
            const employees = client.db.get(`ent_employees_${guildId}`) || DEFAULT_EMPLOYEES;
            const lines = employees.map(e =>
                `**${e.name}** (\`${e.id}\`)\n` +
                `  Prix: ${e.price} ${coinEmoji} | Gain: +${e.gain}/h | Salaire: ${e.salary}/j | Durée: ${e.duration}j | Coffre Rank min: ${e.minCoffreRank}`
            ).join('\n\n');

            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('👥 Employés — Configuration serveur')
                .setDescription(lines + `\n\n*\`${prefix}empedit <id> <stat> <valeur>\` pour modifier*`)
                .setColor('#F1C40F')
            ]}));
        }

        // ── reset ──
        if (sub === 'reset') {
            client.db.delete(`ent_employees_${guildId}`);
            return message.reply(`✅ Employés remis aux valeurs par défaut.`);
        }

        // ── empedit <id> <stat> <valeur> ──
        const empId  = sub;
        const stat   = args[1]?.toLowerCase();
        const valStr = args[2];

        const VALID_STATS = ['price', 'gain', 'salary', 'duration', 'minrank'];

        if (!stat || !valStr) {
            return message.reply(
                `Usage : \`${prefix}empedit <id> <stat> <valeur>\`\n` +
                `IDs : \`stagiaire\` | \`employe\` | \`manager\` | \`directeur\` | \`pdg\`\n` +
                `Stats : \`price\` | \`gain\` | \`salary\` | \`duration\` | \`minrank\``
            );
        }

        if (!VALID_STATS.includes(stat)) return message.reply(`❌ Stat invalide. Valides : ${VALID_STATS.map(s=>`\`${s}\``).join(', ')}`);

        const val = parseInt(valStr);
        if (isNaN(val) || val < 0) return message.reply(`❌ Valeur invalide. Doit être un nombre positif.`);

        const employees = client.db.get(`ent_employees_${guildId}`) || [...DEFAULT_EMPLOYEES];
        const emp = employees.find(e => e.id === empId);
        if (!emp) return message.reply(`❌ Employé \`${empId}\` introuvable. IDs valides : ${DEFAULT_EMPLOYEES.map(e=>`\`${e.id}\``).join(', ')}`);

        const oldVal = stat === 'price' ? emp.price
            : stat === 'gain'     ? emp.gain
            : stat === 'salary'   ? emp.salary
            : stat === 'duration' ? emp.duration
            : emp.minCoffreRank;

        if (stat === 'price')    emp.price        = val;
        if (stat === 'gain')     emp.gain         = val;
        if (stat === 'salary')   emp.salary       = val;
        if (stat === 'duration') emp.duration     = val;
        if (stat === 'minrank')  emp.minCoffreRank = Math.min(6, Math.max(1, val));

        client.db.set(`ent_employees_${guildId}`, employees);

        return message.reply(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle(`✅ Employé modifié — ${emp.name}`)
            .setColor('#57F287').setTimestamp()
            .setDescription(`**${stat}** : \`${oldVal}\` → \`${stat === 'minrank' ? emp.minCoffreRank : val}\``)
        ]}));
    }
};
