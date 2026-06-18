const Discord = require('discord.js');
const {bot} = require('../../structures/client'); 
const fetch = require('node-fetch');

module.exports = {
    name: "user",
    aliases: [],
    description: "Permet d'obtenir des informations sur un utilisateur",
    category: "utilitaire" ,
    usage: ["user <utilisateur>"],

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

        let user = message.mentions.users.first() || args[0] || message.author;

        try {
            const res = await fetch(`https://discord.com/api/v10/users/${user.id || user}`, {
                headers: { 'Authorization': `Bot ${client.config.token}` }
            });
            if (!res.ok) return message.channel.send(`Cet utilisateur n'existe pas ou est introuvable.`);
            const uzer = await res.json();
            let Embed = new Discord.EmbedBuilder()
            .setTitle(`Informations sur ${uzer.username}`)      
            .setDescription(`**${uzer.username}#${uzer.discriminator}**
**Pseudo:** ${uzer.username}
**Tag:** ${uzer.discriminator}
**ID:** ${uzer.id}
`)
            .setColor(color)
            .setThumbnail(`https://cdn.discordapp.com/avatars/${uzer.id}/${uzer.avatar}.webp?size=1024`)
            .setTimestamp();
            message.channel.send({ embeds: [Embed] });
        } catch(err) {
            message.channel.send(`Cet utilisateur n'existe pas ou est introuvable.`);
        }
    }
}
