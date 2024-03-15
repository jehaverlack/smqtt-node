// ## Sub Client: smqtt-sub.js
// An example command line script that will subscribe to a MQTT topic, decrypt the messages, and print them to the screen.
// - An ES6 script that uses the smqtt library to publish a message to a MQTT Broker.
// - Sub Client need access to the Public Key

import { fileURLToPath } from 'url';
import * as smqtt from './smqtt.js'
import * as applib from './applib.js'

// ##########  App Configuration  ##########
const config = applib.get_config(fileURLToPath(import.meta.url))
// console.log('DEBUG: ' + JSON.stringify(config.SUB, null, 2))

applib.logger('START : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)

// ##########  Exampel SMQTT Subscribe Routine  ##########

// Example Sub SMQTT Config
// config.SUB  =  {
//                     "MQTT": {
//                         "BROKER": "mqtt.example.com",
//                         "PORT": 1883,
//                         "TOPIC": "/example/topic"
//                     },
//                     "SMQTT": {
//                         "PRIVATE_KEY": ""
//                     }
//                 }


// Subscribe to the MQTT Broker

smqtt.subscribe(config.SUB, (message) => {
    // This function will be called each time a new message is received
    applib.logger('SUB : MESSAGE : RECEIVED : ' + message, config.FILES.LOG_FILE);
    console.log(message);
});

// ##########  End Main Routine  ##########


// Exit if the event loop reaches the end.
process.on('SIGINT', () => {
    applib.logger('END   : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)
    process.exit(0)
});

process.on('SIGTERM', () => {
    applib.logger('END   : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)
    process.exit(0)
});

