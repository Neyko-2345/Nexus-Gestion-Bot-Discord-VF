const Discord = require('discord.js');
const { v2 } = require('../../utils/v2');
module.exports = {
    name: "tattack",
    aliases: ["teamattack"],
    description: "Attaque une team adverse pour tenter de casser son cadenas",
    category: "coin",
    usage: ["tattack <teamid> <nb_troupes>"],
    run: async (client, message, args, color, prefix, footer) => {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const teams = client.db.get(`teams_${guildId}`) || [];
        const myTeamIdx = teams.findIndex(t => t.members?.includes(userId));
        if (myTeamIdx === -1) return message.reply(`Vous n'êtes dans aucune team.`);
        const myTeam = teams[myTeamIdx];
        if (!['Fondateur', 'Co-fondateur'].includes(myTeam.ranks?.[userId])) return message.reply(`Seul le Fondateur ou Co-fondateur peut attaquer.`);

        const targetId = args[0];
        const nb = parseInt(args[1]);
        if (!targetId || isNaN(nb) || nb <= 0) return message.reply(`Usage : \`${client.db.get(`prefix_${guildId}`)||'&'}tattack <teamid> <nb_troupes>\``);
        if ((myTeam.army || 0) < nb) return message.reply(`Votre armée n'a que **${myTeam.army||0}** troupes.`);

        const targetIdx = teams.findIndex(t => t.id === targetId);
        if (targetIdx === -1) return message.reply(`Team ID \`${targetId}\` introuvable.`);
        if (targetIdx === myTeamIdx) return message.reply(`Vous ne pouvez pas vous attaquer vous-même.`);

        const target = teams[targetIdx];
        // Cooldown attaque 30min
        const lastAttack = client.db.get(`team_attack_${myTeam.id}_${guildId}`) || 0;
        if (Date.now() - lastAttack < 30 * 60 * 1000) {
            const rem = 30 * 60 * 1000 - (Date.now() - lastAttack);
            return message.reply(`⏳ Cooldown d'attaque : **${Math.floor(rem/60000)} minutes** restantes.`);
        }

        // Calcul : puissance attaque vs défense (armée défenseur + bonus cadenas)
        const armyRanks = client.db.get(`army_ranks_${guildId}`) || [{ power: 1 }, { power: 3 }, { power: 10 }];
        const avgPower = armyRanks[0]?.power || 1;
        const attackPower = nb * avgPower;
        const lockBonus = target.lock ? (client.db.get(`lock_power_${target.lock}_${guildId}`) || 0) : 0;
        const defensePower = (target.army || 0) * avgPower + lockBonus;

        client.db.set(`team_attack_${myTeam.id}_${guildId}`, Date.now());
        // Perte de troupes des deux côtés
        const attackerLoss = Math.floor(nb * 0.3);
        const defenderLoss = Math.floor((target.army || 0) * 0.3);
        teams[myTeamIdx].army = Math.max(0, (myTeam.army || 0) - nb);
        teams[targetIdx].army = Math.max(0, (target.army || 0) - defenderLoss);

        const win = attackPower > defensePower;
        let desc;
        if (win) {
            // Casse le cadenas si il y en a un
            if (target.lock) {
                teams[targetIdx].lock = null;
                desc = `⚔️ **ATTAQUE RÉUSSIE** contre **${target.name}** !\n\nLe cadenas a été **brisé** ! Votre armée a perdu **${attackerLoss}** troupes.\nLeur armée a perdu **${defenderLoss}** troupes.`;
            } else {
                desc = `⚔️ **ATTAQUE RÉUSSIE** contre **${target.name}** !\n\nIl n'y avait pas de cadenas mais l'attaque a affaibli leur armée (-${defenderLoss} troupes).\nVotre armée a perdu **${attackerLoss}** troupes.`;
            }
        } else {
            desc = `⚔️ **ATTAQUE REPOUSSÉE** par **${target.name}** !\n\nLeur défense était trop forte (${lockBonus > 0 ? `cadenas +${lockBonus}` : `armée`}).\nVotre armée a perdu **${attackerLoss}** troupes. Leur armée a perdu **${defenderLoss}** troupes.`;
        }

        client.db.set(`teams_${guildId}`, teams);

        // DM au fondateur de la team attaquée
        const targetFounder = message.guild.members.cache.get(target.founder);
        targetFounder?.user.send(`⚔️ Votre team **${target.name}** a été attaquée par **${myTeam.name}** avec **${nb} troupes** ! ${win && target.lock ? 'Votre cadenas a été BRISÉ !' : 'L\'attaque a été repoussée.'}`).catch(() => {});

        message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
            .setTitle('⚔️ Résultat d\'attaque')
            .setDescription(desc)
            .setColor(win ? '#57F287' : '#ED4245').setTimestamp()
        ]}));
    }
};
