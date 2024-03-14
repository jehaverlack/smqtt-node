// ## Sub Client: smqtt-sub.js
// An example command line script that will subscribe to a MQTT topic, decrypt the messages, and print them to the screen.
// - An ES6 script that uses the smqtt library to publish a message to a MQTT Broker.
// - Sub Client need access to the Public Key

import { fileURLToPath } from 'url';
import * as smqtt from './smqtt.js'

// ##########  App Configuration  ##########
const config = smqtt.get_config(fileURLToPath(import.meta.url))


// ##########  Main Routine  ##########

// console.log('DEBUG: ' + JSON.stringify(config, null, 2))

smqtt.logger('START : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)

// Subscribe to the MQTT Broker
smqtt.subscribe(config);

// ##########  End Main Routine  ##########
// Exit if the event loop reaches the end.
process.on('SIGINT', () => {
    smqtt.logger('END   : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)
    process.exit(0)
});

process.on('SIGTERM', () => {
    smqtt.logger('END   : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)
    process.exit(0)
});

