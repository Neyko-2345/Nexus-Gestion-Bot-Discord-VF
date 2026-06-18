const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const ms = require('enhanced-ms')
const backup = require("discord-backup")
const backupDir = __dirname + "/../../backup"
backup.setStorageFolder(backupDir)

module.exports = {
    name: "backup",
    aliases: ["bkp"],
    description: "Permet de créer, lister, supprimer ou charger une backup",
    category: "backup",
    usage: ["backup server/emoji create <nom>", "backup server/emoji delete <nom>", "backup server/emoji load <nom>", "backup server/emoji list"],

    /**
     * @param {bot} client 
     * @param {Discord.Message} message 
     * @param {Array<>} args 
     * @param {string} commandName 
     */

    run: async (client, message, args, color, prefix, footer, commandName) => {

let pass = false

let staff = client.staff

if(!staff.includes(message.author.id) && !client.config.buyers.includes(message.author.id) && client.db.get(`owner_${message.author.id}`) !== true){
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "1" && message.member.roles.cache.some(r => client.db.get(`perm1.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "2" && message.member.roles.cache.some(r => client.db.get(`perm2.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "3" && message.member.roles.cache.some(r => client.db.get(`perm3.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "4" && message.member.roles.cache.some(r => client.db.get(`perm4.${message.guild.id}`)?.includes(r.id))) pass = true;
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "5" && message.member.roles.cache.some(r => client.db.get(`perm5.${message.guild.id}`)?.includes(r.id))) pass = true; 
    if(client.db.get(`perm_${commandName}.${message.guild.id}`) === "public") pass = "oui";   
} else pass = true;

if (pass === false) return message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)


        let server = args[0] === "server" || args[0] === "serveur"
        let emoji = args[0] === "emoji" || args[0] === "emojis" || args[0] === "emotes" || args[0] === "emote"

        if (server) {
            if(args[1].toLowerCase() === "create") {
                let nom = args[2]
                if (!nom) return
                let backups = client.db.get(`backups_server`)
                if (!backups) backups = []
                if (backups.length > 0) {
                    let backup_ = backups.find(b => b.code === nom)
                    if (backup_) return message.channel.send(`Le backup ${nom} existe déjà.`)
                }
                backup.create(message.guild, {
                    maxMessagesPerChannel: 0,
                    jsonBeautify: true,
                    doNotBackup: ["emojis", "bans" ]
                }).then((backupData) => {
                    client.db.push(`backups_server`, {
                        code: nom,
                        id: backupData.id
                    })
                    message.channel.send(`Backup créé avec succès`)
                }).catch(err => {
                    message.channel.send(`Le serveur n'a pas pu être sauvegardé`)
                })

            } else if(args[1].toLowerCase() === "delete") {
                let nom = args[2]
                if (!nom) return
                let backupData = client.db.get(`backups_server`).find(b => b.code === nom)
                if (!backupData) return message.channel.send(`Backup introuvable`)
                client.db.set(`backups_server`, client.db.get(`backups_server`).filter(b => b.code !== nom))
                message.channel.send(`Backup supprimé avec succès`)      
            } else if(args[1].toLowerCase() === "list") {
                let backups = client.db.get(`backups_server`)
                if (!backups) return message.channel.send(`Aucune backup trouvé`)
                if (backups.length === 0) return message.channel.send(`Aucune backup trouvé`)
                let embed = new Discord.EmbedBuilder()
                .setColor(color)
                .setTitle(`Liste des backups`)
                .setDescription(`${backups.map(b => `${b.code}`).join("\n")}`)
                .setFooter({ text: footer })
                message.channel.send({ embeds: [embed] })
            } else if(args[1].toLowerCase() === "load") {
                let nom = args[2]
                if (!nom) return
                let backupData = client.db.get(`backups_server`).find(b => b.code === nom)
                if (!backupData) return message.channel.send(`Backup introuvable`)
                backup.load(backupData.id, message.guild).then((backupData) => {
                    message.author.send(`Backup chargée avec succès`)
                }).catch(err => {
                    console.log(err)
                    message.channel.send(`Le serveur n'a pas pu être e`)
                })
            } else if(args[1].toLowerCase() === "clear") {
                // find there is how many backups
                let backups = client.db.get(`backups_server`)
                if (!backups) return message.channel.send(`Aucune backup trouvé`)
                if (backups.length === 0) return message.channel.send(`Aucune backup trouvé`)
                let backupNumber = backups.length
                client.db.delete(`backups_server`)
                message.channel.send(`${backupNumber} backups supprimés avec succès`)
            }

        } else if (emoji) {
            if(args[1].toLowerCase() === "create") {
                let nom = args[2]
                if (!nom) return
                let backups = client.db.get(`backups_emoji`)
                if (!backups) backups = []
                if (backups.length > 0) {
                    let backup_ = backups.find(b => b.code === nom)
                    if (backup_) return message.channel.send(`Le backup ${nom} existe déjà.`)
                }
                let emoji = message.guild.emojis.cache;
                     
                var array = new Array();
                emoji.forEach(e => array.push(e.toString()));
                client.db.push(`backups_emoji`, {
                    code: nom,
                    serveur: message.guild.name,
                    emojis: array,
                    size: emoji.size
                });

                message.channel.send(`Backup créé avec succès (${emoji.size} emojis)`)

            } else if(args[1].toLowerCase() === "delete") {
                let nom = args[2]
                if (!nom) return
                let backupData = client.db.get(`backups_emoji`).find(b => b.code === nom)
                if (!backupData) return message.channel.send(`Backup introuvable`)
                client.db.set(`backups_emoji`, client.db.get(`backups_emoji`).filter(b => b.code !== nom))
                message.channel.send(`Backup supprimé avec succès`)      
            } else if(args[1].toLowerCase() === "list") {
                let backups = client.db.get(`backups_emoji`)
                if (!backups) return message.channel.send(`Aucune backup trouvé`)
                if (backups.length === 0) return message.channel.send(`Aucune backup trouvé`)
                let embed = new Discord.EmbedBuilder()
                .setColor(color)
                .setTitle(`Liste des backups`)
                .setDescription(`${backups.map(b => `${b.code} : ${b.serveur}`).join("\n")}`)
                .setFooter({ text: footer })
                message.channel.send({ embeds: [embed] })
            } else if(args[1].toLowerCase() === "load") {
                let nom = args[2]
                if (!nom) return
                let backupData = client.db.get(`backups_emoji`).find(b => b.code === nom)
                if (!backupData) return message.channel.send(`Backup introuvable`)
                
                backupData.emojis.forEach(emote => {
                    let emoji = Discord.Util.parseEmoji(emote);
                    if (emoji.id) {
                        const Link = `https://cdn.discordapp.com/emojis/${emoji.id}.${
                            emoji.animated ? 'gif' : 'png'
                        }`;
                        message.guild.emojis
                            .create(`${Link}`, `${`${emoji.name}`}`)
                            .catch(error => {
                                                  });
                    }
                });
                message.channel.send(`Backup chargée avec succès`)
            } else if(args[1].toLowerCase() === "clear") {
                let backups = client.db.get(`backups_emoji`)
                if (!backups) return message.channel.send(`Aucune backup trouvé`)
                if (backups.length === 0) return message.channel.send(`Aucune backup trouvé`)
                let backupNumber = backups.length
                client.db.delete(`backups_emoji`)
                message.channel.send(`${backupNumber} backups supprimés avec succès`)
            }
        } else {
           return message.channel.send(`Syntaxe incorrecte`)
        }
    }
}