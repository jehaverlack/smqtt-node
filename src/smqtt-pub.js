// # Pub Client: smqtt-pub.js
// An example command line script that will publish and encrypted message to a MQTT Topic.
// - An ES6 script that uses the smqtt library to publish a message to a MQTT Broker.
// - Pub Clients need access to the Private Key

import * as path from 'path'
import { fileURLToPath } from 'url';
import * as smqtt from './smqtt.js'

// ##########  App Configuration  ##########
const config = smqtt.get_config(fileURLToPath(import.meta.url))


// ##########  Main Routine  ##########

console.log('DEBUG: ' + JSON.stringify(config, null, 2))

smqtt.logger('START : ' + config.APP.NAME + " - " + config.PACKAGE.version + ' ' + config.PACKAGE.version_data, config.FILES.LOG_FILE)


// ##########  End Main Routine  ##########
// Exit if the event loop reaches the end.
process.on('SIGINT', () => {
    smqtt.logger('END : ' + config.APP.NAME + " - " + config.PACKAGE.version + ' ' + config.PACKAGE.version_data, config.FILES.LOG_FILE)
    process.exit(0)
});

process.on('SIGTERM', () => {
    smqtt.logger('END : ' + config.APP.NAME + " - " + config.PACKAGE.version + ' ' + config.PACKAGE.version_data, config.FILES.LOG_FILE)
    process.exit(0)
});

smqtt.logger('END : ' + config.APP.NAME + " - " + config.PACKAGE.version + ' ' + config.PACKAGE.version_data, config.FILES.LOG_FILE)
process.exit(0)
