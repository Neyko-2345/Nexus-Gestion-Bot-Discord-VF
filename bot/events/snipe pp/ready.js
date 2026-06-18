const { Bot } = require('../../structures/client')
const { v2 } = require('../../utils/v2');
const randomstring = require('randomstring')
const fs = require('fs')
const Discord = require('discord.js')
const { ActionRowBuilder, ButtonBuilder } = require('discord.js')
const ms = require("enhanced-ms")

module.exports = {
    name: 'clientReady',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client) => {
       
        setInterval(() => {
            client.guilds.cache.map(guild => {
                if (client.db.get(`show_pic_${guild.id}`)) {
                    let channel = guild.channels.cache.get(client.db.get(`show_pic_${guild.id}`))
                    if (channel) {
                        let users = guild.members.cache.filter(m => m.user.avatarURL()).map(m => m.user)
                        let user = users[Math.floor(Math.random() * users.length)]
                        let avatar = user.displayAvatarURL({dynamic: true, size: 2048});

                        let Embed = new Discord.EmbedBuilder()
                        .setColor(client.db.get(`color_${guild.guildId}`) || client.color)
                        .setTitle(`${user.username}`)
                        .setImage(avatar)
                        
                        const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setLabel('Cliquez pour télécharger')
                            .setURL(avatar)
                            .setStyle(Discord.ButtonStyle.Link),
                        );

                        channel.send(v2({ embeds: [Embed], components: [row] }))


                    }
                }
            })
        }, ms('45s'))
    

    }
}