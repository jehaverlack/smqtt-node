// # Pub Client: smqtt-pub-stdin.js
// An example command line script that will listen on STDIN and publish and encrypted message to a MQTT Topic.
// - An ES6 script that uses the smqtt library to publish a message to a MQTT Broker.
// - Pub Clients need access to the Private Key

import { fileURLToPath } from 'url';
import * as smqtt from './smqtt.js'
import * as applib from './applib.js'

// ##########  App Configuration  ##########
const config = applib.get_config(fileURLToPath(import.meta.url))
// console.log('DEBUG: ' + JSON.stringify(config.PUB, null, 2))


// ##########  Main Routine  ##########
applib.logger('START : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)

// Example Pub SMQTT Config
// config.PUB  =  {
//                     "MESSAGE": [
//                         "Hello, World!",
//                         "This is a secret message."
//                     ],
//                     "MQTT": {
//                         "BROKER": "mqtt.example.com",
//                         "PORT": 1883,
//                         "TOPIC": "/example/topic"
//                     },
//                     "SMQTT": {
//                         "PUBLIC_KEY": ""
//                     }
//                 }

let msg_status = {}
msg_status[true]  = 'SUCCESS'
msg_status[false] = 'FAILED'

// if config.PUB.MESSAGE[0] == '-' then Read from STDIN
if (config.PUB.MESSAGE[0] == '-') {
    // Listen for data on standard input
    process.stdin.on('data', async (data) => {
        // Convert the data to a string and remove the trailing newline
        const message = data.toString().trim();

        // Add the message to the config.PUB.MESSAGE array
        config.PUB.MESSAGE.push(message);

        // Publish the message to the MQTT Broker
        try {
            const result = await smqtt.publish(config.PUB);
            applib.logger('PUB : MESSAGE : SENT : ' + msg_status[result], config.FILES.LOG_FILE);
        } catch (err) {
            applib.logger('PUB : ERROR : ' + err, config.FILES.LOG_FILE);
        }
    });
} else {
    // Publish the message to the MQTT Broker
    try {
        const result = await smqtt.publish(config.PUB);
        applib.logger('PUB : MESSAGE : SENT : ' + msg_status[result], config.FILES.LOG_FILE);
    } catch (err) {
        applib.logger('PUB : ERROR : ' + err, config.FILES.LOG_FILE);
    }
}

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

applib.logger('END   : ' + config.APP.LOG_TITLE, config.FILES.LOG_FILE)
process.exit(0)
