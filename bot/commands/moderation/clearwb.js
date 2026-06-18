const Discord = require('discord.js');
const fetch = require('node-fetch');
const {bot} = require('../../structures/client'); 
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const ms = require('enhanced-ms')
module.exports = {
    name: "clear-wb",
    aliases: ["clear_wb", "clearwb"],
    description: "Permet de supprimer tout les webhook du serveur",
    category: "moderation",
    usage: ["clearwb"],

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

        message.guild.fetchWebhooks().then(async (webhooks) => {
            for (const webhook of webhooks.values()) {
                try {
                    await fetch(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
                        method: 'DELETE'
                    });
                } catch(e) {}
            }
        })

        message.channel.send(`Tout les webhooks ont été supprimés.`)
    }
}
