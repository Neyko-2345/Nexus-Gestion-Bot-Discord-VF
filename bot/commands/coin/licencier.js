const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: "licencier",
    aliases: ["fire", "layoff"],
    description: "Licencie un employé de votre entreprise",
    category: "coin",
    usage: ["licencier"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const ent = client.db.get(`ent_${userId}_${guildId}`);
        if (!ent) return message.reply(`Vous n'avez pas d'entreprise.`);
        const active = (ent.hiredEmployees || []).filter(e => e.hiredAt && (Date.now() - e.hiredAt) < (e.duration || 3) * 24 * 3600000);
        if (active.length === 0) return message.reply(`Vous n'avez aucun employé actif.`);

        const options = active.map((e, idx) => ({
            label: `${e.name} (embauché il y a ${Math.floor((Date.now()-e.hiredAt)/86400000)}j)`,
            value: String(idx)
        }));
        const menu = new StringSelectMenuBuilder().setCustomId('fire_select').setPlaceholder('Choisir un employé à licencier...').addOptions(options);
        const msg = await message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('👥 Licencier un employé')
            .setColor('#ED4245')
            .setDescription(active.map((e,i) => `**${i+1}.** ${e.name} — +${e.gain}/h`).join('\n'))
        ], components: [new ActionRowBuilder().addComponents(menu)] }));

        const col = msg.createMessageComponentCollector({ time: 30000, max: 1 });
        col.on('collect', async i => {
            if (i.user.id !== userId) return i.reply({ content: 'Ce menu ne vous appartient pas.', ephemeral: true });
            const idx = parseInt(i.values[0]);
            const emp = active[idx];
            const updatedEnt = client.db.get(`ent_${userId}_${guildId}`);
            // Retirer uniquement le premier employé correspondant
            let removed = false;
            updatedEnt.hiredEmployees = (updatedEnt.hiredEmployees || []).filter(e => {
                if (!removed && e.name === emp.name && e.hiredAt === emp.hiredAt) { removed = true; return false; }
                return true;
            });
            client.db.set(`ent_${userId}_${guildId}`, updatedEnt);
            await i.update(v2({ embeds: [new Discord.EmbedBuilder()
                .setColor('#F1C40F').setDescription(`✅ **${emp.name}** licencié.`)
            ], components: [] }));
        });
        col.on('end', c => { if (c.size === 0) msg.edit({ components: [] }).catch(() => {}); });
    }
};
