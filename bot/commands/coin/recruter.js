const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const ARROW = '<:whitearrow:1510580999614894172>';

const DEFAULT_EMPLOYEES = [
    { id: 'stagiaire',  name: 'Stagiaire',  salary: 100,  gain: 50,   price: 1000,   duration: 3 },
    { id: 'employe',    name: 'Employé',    salary: 500,  gain: 100,  price: 5000,   duration: 3 },
    { id: 'manager',    name: 'Manager',    salary: 1000, gain: 200,  price: 10000,  duration: 3 },
    { id: 'directeur',  name: 'Directeur',  salary: 1500, gain: 700,  price: 20000,  duration: 3 },
    { id: 'pdg',        name: 'PDG',        salary: 5000, gain: 2000, price: 100000, duration: 3 },
];

module.exports = {
    name: "recruter",
    aliases: ["recruit", "hire"],
    description: "Emploie un travailleur dans votre entreprise",
    category: "coin",
    usage: ["recruter"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId   = message.guild.id;
        const userId    = message.author.id;
        const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>';

        const ent = client.db.get(`ent_${userId}_${guildId}`);
        if (!ent) return message.reply(`Vous n'avez pas d'entreprise. Achetez-en une dans \`${prefix}shop\`.`);

        const employees = client.db.get(`ent_employees_${guildId}`) || DEFAULT_EMPLOYEES;
        const hand      = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
        const now       = Date.now();

        // Vérifier si un employé est déjà actif
        const activeEmps = (ent.hiredEmployees || []).filter(e =>
            e.hiredAt && (now - e.hiredAt) < (e.duration || 3) * 86400000
        );
        if (activeEmps.length > 0) {
            const current = activeEmps[0];
            const daysLeft = Math.ceil(((current.duration || 3) * 86400000 - (now - current.hiredAt)) / 86400000);
            return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('❌ Employé déjà en poste')
                .setDescription(
                    `Vous avez déjà **${current.name}** en poste (encore **${daysLeft}j**).\n\n` +
                    `Vous ne pouvez avoir qu'**un seul employé à la fois**.\n` +
                    `Licenciez-le d'abord avec \`${prefix}licencier\`, puis recrutez un autre.`
                )
            ]}));
        }

        // Historique des employés déjà embauchés (tous, même expirés)
        const everHired = ent.everHired || [];

        const empLines = employees.map((e, idx) => {
            const prevEmp     = idx > 0 ? employees[idx - 1] : null;
            const unlocked    = idx === 0 || everHired.includes(prevEmp.id);
            const lockLabel   = !unlocked ? ` 🔒 *(nécessite d'avoir eu: ${prevEmp.name})*` : '';
            return `${unlocked ? ARROW : '🔒'} **${e.name}** — ${e.price} ${coinEmoji}${lockLabel}\n` +
                   `  +${e.gain}/h | Salaire: ${e.salary}/j | Durée: ${e.duration}j`;
        }).join('\n\n');

        const options = employees
            .map((e, idx) => {
                const prevEmp  = idx > 0 ? employees[idx - 1] : null;
                const unlocked = idx === 0 || everHired.includes(prevEmp.id);
                return {
                    label: `${e.name} — ${e.price} coins${!unlocked ? ' [🔒 Verrouillé]' : ''}`,
                    value: e.id,
                };
            });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('recruit_select')
            .setPlaceholder('Choisir un employé à recruter...')
            .addOptions(options);
        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new Discord.EmbedBuilder()
            .setTitle('👥 Recruter un employé')
            .setColor('#F1C40F')
            .setDescription(
                `Votre main : **${hand} ${coinEmoji}**\n\n` +
                empLines
            )
            .addFields({ name: 'ℹ️ Règles', value: 'Un seul employé actif à la fois. Vous devez avoir possédé l\'employé précédent pour débloquer le suivant.', inline: false });

        const msg = await message.channel.send(v2({ embeds: [embed], components: [row] }));
        const col = msg.createMessageComponentCollector({ time: 60000, max: 1 });

        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });

            const empId = i.values[0];
            const emp   = employees.find(e => e.id === empId);
            if (!emp) return i.update({ content: 'Employé introuvable.', components: [] });

            // Re-vérifier employé actif au moment de la sélection
            const freshEnt = client.db.get(`ent_${userId}_${guildId}`);
            const freshActive = (freshEnt.hiredEmployees || []).filter(e =>
                e.hiredAt && (Date.now() - e.hiredAt) < (e.duration || 3) * 86400000
            );
            if (freshActive.length > 0) {
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`❌ Vous avez déjà **${freshActive[0].name}** en poste. Licenciez-le d'abord.`)
                ], components: [] }));
            }

            // Vérifier le déverrouillage (historique)
            const empIdx      = employees.findIndex(e => e.id === empId);
            const prevEmp     = empIdx > 0 ? employees[empIdx - 1] : null;
            const freshEverHired = freshEnt.everHired || [];
            if (prevEmp && !freshEverHired.includes(prevEmp.id)) {
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('🔒 Employé verrouillé')
                    .setDescription(
                        `Pour recruter un **${emp.name}**, vous devez d'abord avoir eu un **${prevEmp.name}** au moins une fois.`
                    )
                ], components: [] }));
            }

            // Vérifier les coins
            const currentHand = client.db.get(`coin_hand_${userId}_${guildId}`) || 0;
            if (currentHand < emp.price) {
                return i.update(v2({ embeds: [new Discord.EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription(`❌ Pas assez de ${coinEmoji} ! Il faut **${emp.price} ${coinEmoji}** (vous avez **${currentHand} ${coinEmoji}**).`)
                ], components: [] }));
            }

            // Embaucher
            client.db.subtract(`coin_hand_${userId}_${guildId}`, emp.price);
            const updatedEnt = client.db.get(`ent_${userId}_${guildId}`);
            updatedEnt.hiredEmployees = updatedEnt.hiredEmployees || [];
            updatedEnt.hiredEmployees.push({ ...emp, hiredAt: Date.now() });

            // Mettre à jour l'historique
            const updatedEverHired = updatedEnt.everHired || [];
            if (!updatedEverHired.includes(emp.id)) updatedEverHired.push(emp.id);
            updatedEnt.everHired = updatedEverHired;

            client.db.set(`ent_${userId}_${guildId}`, updatedEnt);

            await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                .setTitle('✅ Employé recruté !')
                .setColor('#57F287').setTimestamp()
                .setDescription(
                    `**${emp.name}** recruté pour **${emp.price} ${coinEmoji}** !\n\n` +
                    `📈 Gain : +${emp.gain} ${coinEmoji}/h\n` +
                    `💸 Salaire : ${emp.salary} ${coinEmoji}/j\n` +
                    `⏳ Durée : **${emp.duration} jours**\n\n` +
                    `*Licenciez-le avec \`${prefix}licencier\` si vous souhaitez en recruter un autre.*`
                )
            ], components: [] }));
        });

        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
