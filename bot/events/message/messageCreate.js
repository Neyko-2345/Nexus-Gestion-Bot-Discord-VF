const Discord = require('discord.js')
const { v2 } = require('../../utils/v2');

module.exports = {
    name: 'messageCreate',
    run: async (client, message) => {
        try {
            if (!message || !message.guild || !message.author) return
            if (message.author.bot) return

            if (!client.processedMessages) client.processedMessages = new Set()
            if (client.processedMessages.has(message.id)) return
            client.processedMessages.add(message.id)
            setTimeout(() => client.processedMessages?.delete(message.id), 5000)

            const guildId   = message.guild.id
            const coinEmoji = client.db.get(`coin_emoji_${guildId}`) || '<:coin:1510618513876717709>'
            let color  = client.db.get(`color_${guildId}`)  || client.color
            let prefix = client.db.get(`prefix_${guildId}`) || client.prefix
            const footer = client.db.get(`footer_${guildId}`) || client.footer

            const xpActive   = client.db.get(`xp_active_${guildId}`) !== false
            const xpMsgGain  = client.db.get(`xp_msg_gain_${guildId}`) || 0
            if (xpActive && xpMsgGain > 0 && !message.author.bot) {
                const userId = message.author.id
                const lastXp = client.db.get(`xp_msg_last_${userId}_${guildId}`) || 0
                const now = Date.now()
                if (now - lastXp >= 30000) {
                    const gain = Math.floor(Math.random() * xpMsgGain) + 1
                    client.db.add(`xp_${userId}_${guildId}`, gain)
                    client.db.set(`xp_msg_last_${userId}_${guildId}`, now)

                    const levels   = client.db.get(`xp_levels_${guildId}`) || { 1: 0, 2: 100, 3: 250, 4: 500, 5: 1000 }
                    const xp       = client.db.get(`xp_${userId}_${guildId}`) || 0
                    const prevXp   = xp - gain
                    let prevLvl = 1, curLvl = 1
                    for (const [lvl, req] of Object.entries(levels)) {
                        if (prevXp >= req) prevLvl = parseInt(lvl)
                        if (xp >= req)     curLvl  = parseInt(lvl)
                    }
                    if (curLvl > prevLvl) {
                        const levelUpChannel = client.db.get(`xp_levelup_channel_${guildId}`) || message.channel.id
                        const lvlCh  = message.guild.channels.cache.get(levelUpChannel) || message.channel
                        const reward = client.db.get(`xp_level_reward_${curLvl}_${guildId}`) || 0
                        if (reward > 0) client.db.add(`coin_hand_${userId}_${guildId}`, reward)
                        lvlCh.send({ embeds: [new Discord.EmbedBuilder()
                            .setColor(color)
                            .setDescription(`🎉 ${message.author} vient de passer au niveau **${curLvl}** !${reward > 0 ? ` +${reward} ${coinEmoji}` : ''}`)
                        ]}).catch(() => {})
                    }
                }
            }

            if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
                return message.reply(`Mon prefix est \`${prefix}\``).catch(() => {})
            }

            let usedPrefix = null
            if (message.content.startsWith(prefix)) {
                usedPrefix = prefix
            } else if (message.content.startsWith(`<@${client.user.id}> `)) {
                usedPrefix = `<@${client.user.id}> `
            } else if (message.content.startsWith(`<@!${client.user.id}> `)) {
                usedPrefix = `<@!${client.user.id}> `
            }
            if (!usedPrefix) return

            const args = message.content.slice(usedPrefix.length).trim().split(/ +/g)
            if (!args[0]) return
            const commandName = args[0].toLowerCase()
            const cmd = client.commands.get(commandName) || client.aliases.get(commandName)
            args.shift()
            if (!cmd) return

            const blockedInChannel  = client.db.get(`cmd_blocked_${commandName}_${message.channel.id}`)
            const blockedInCategory = message.channel.parentId ? client.db.get(`cmd_blocked_${commandName}_${message.channel.parentId}`) : false
            if (blockedInChannel || blockedInCategory) return

            const isOwner = client.staff.includes(message.author.id) || client.config.buyers.includes(message.author.id) || client.db.get(`owner_${message.author.id}`) === true
            if (!isOwner) {
                const coinChannels = client.db.get(`coin_channels_${guildId}`) || []
                const filmChannels = client.db.get(`film_channels_${guildId}`) || []
                const isCoinCmd    = cmd.category === 'coin' && !cmd.ownerOnly
                const isFilmCmd    = cmd.category === 'film' && !cmd.ownerOnly

                if (isCoinCmd && coinChannels.length > 0 && !coinChannels.includes(message.channel.id)) {
                    return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                        .setColor('#F1C40F')
                        .setTitle('💰 Salon incorrect')
                        .setDescription(`Cette commande n'est disponible que dans les salons **Coin** configurés.\n\nDemandez à un owner de vous indiquer le bon salon.`)
                    ]})).catch(() => {})
                }
                if (isFilmCmd && filmChannels.length > 0 && !filmChannels.includes(message.channel.id)) {
                    return message.channel.send(v2({ embeds: [new Discord.EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle('🎬 Salon incorrect')
                        .setDescription(`Cette commande n'est disponible que dans les salons **Film** configurés.\n\nUtilisez le panel film dans le bon salon.`)
                    ]})).catch(() => {})
                }
            }

            prefix = client.db.get(`prefix_${guildId}`) || client.prefix
            cmd.run(client, message, args, color, prefix, footer, commandName)
        } catch (err) {
            console.log("messageCreate error : " + err)
        }
    }
}
