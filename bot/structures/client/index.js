const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js')
const db = require('quick.db')
const fs = require('fs')
global.print = console.log

class bot extends Client {
    constructor(options = {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.MessageContent,
        ],
        partials: [
            Partials.Channel,
            Partials.Message,
            Partials.User,
            Partials.GuildMember,
            Partials.Reaction,
        ],
    }) {
        super(options);
        this.setMaxListeners(20)
        this.db = db
        this.color = "#1519f0"
        this.footer = ".gg/n2xus"
        this.link = "https://discord.gg/n2xus"
        this.prefix = db.get(`mainprefix`) || "&"
        this.dev = "BNT Feujjj"
        this.staff = ["876126492604641370", "594718632966357022"]
        this.version = require('../../version.json').version
        this.snipe = new Collection()
        this.config = require('../../config')
        this.config.token = process.env.DISCORD_TOKEN || this.config.token
        this.commands = new Collection()
        this.aliases = new Collection()
        this.loadCommands()
        this.loadEvents()
        console.log(`⏳ Connexion à Discord... (${this.commands.size} commandes chargées)`)
        this.login(this.config.token).catch(err => {
            console.error('❌ ERREUR LOGIN DISCORD:', err.message)
            if (err.message?.toLowerCase().includes('token')) {
                console.error('→ Le token est invalide. Génère un nouveau token sur discord.com/developers et mets à jour le secret DISCORD_TOKEN dans Replit.')
            }
        })
    }

    loadCommands() {
        const subFolders = fs.readdirSync('./commands')
        for (const category of subFolders) {
            const commandsFiles = fs.readdirSync(`./commands/${category}`).filter(file => file.endsWith('.js'))
            for (const commandFile of commandsFiles) {
                try {
                    const command = require(`../../commands/${category}/${commandFile}`)
                    if (command.name) {
                        this.commands.set(command.name, command)
                        if (command.aliases && command.aliases.length > 0) {
                            command.aliases.forEach(alias => this.aliases.set(alias, command))
                        }
                    }
                } catch (e) {
                    console.log(`Erreur chargement commande ${commandFile}: ${e.message}`)
                }
            }
        }
    }

    loadEvents() {
        const subFolders = fs.readdirSync(`./events`)
        for (const category of subFolders) {
            const eventsFiles = fs.readdirSync(`./events/${category}`).filter(file => file.endsWith(".js"))
            for (const eventFile of eventsFiles) {
                try {
                    const event = require(`../../events/${category}/${eventFile}`)
                    this.on(event.name, (...args) => event.run(this, ...args))
                } catch (e) {
                    console.log(`Erreur chargement event ${eventFile}: ${e.message}`)
                }
            }
        }
    }
}

exports.bot = bot
