const { Bot } = require('../../structures/client')

module.exports = {
    name: 'clientReady',

    /**
     * 
     * @param {Bot} client 
     */
    run: async (client) => {
        console.log(`Bot mis à jour - version ${client.version}`)
    }
}
