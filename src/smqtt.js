// smqtt.js
// SMQTT - Secret Message Queue Telemetry Transport Library
// SMQTT provides a way to send secure messages over MQTT Broker Topics without using a secured MQTT Broker and without having time dependant encryption protocols.

import crypto from 'crypto'
import * as mqtt from 'mqtt'
  
export function gen_rsa_keys() { // Generate a new RSA Key Pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        }
    })
    return { privateKey, publicKey }
}

export function encrypt_message(message, publicKey) { // Encrypt a message with the public key
    return crypto.publicEncrypt(publicKey, Buffer.from(message, 'utf8')).toString('base64')
}

export function decrypt_message(encryptedMessage, privateKey) { // Decrypt a message with the private key
    return crypto.privateDecrypt(privateKey, Buffer.from(encryptedMessage, 'base64')).toString('utf8')
}

export function publish(config) { // Publish  secret messages to the MQTT Broker
    return new Promise((resolve, reject) => {
        console.log('DEBUG : PUB ' + JSON.stringify(config, null, 2))
        try {
            let client = mqtt.connect('mqtt://' + config.MQTT.BROKER + ':' + config.MQTT.PORT)

            client.on('connect', () => {
                // For each message in the config.MESSAGE array, publish the message to the MQTT Broker
                for (let i in config.MESSAGE) {
                    let checksum = crypto.createHash('sha256').update(config.MESSAGE[i]).digest('base64')
                    let payload = {}
                    payload['TIMESTAMP'] = new Date().toISOString() // UTC ISO 8601
                    payload['MESSAGE']  = encodeURIComponent(config.MESSAGE[i]) 
                    payload['CHECKSUM'] = checksum
                    let msgString = JSON.stringify(payload)

                    let spayload = {}
                    spayload['SMQTT'] = []
                    spayload['SMQTT'].push(encrypt_message(msgString, config.SMQTT.PUBLIC_KEY))

                    try {
                        client.publish(config.MQTT.TOPIC, JSON.stringify(spayload))
                        resolve(true)
                    } catch (err) {
                        console.log('ERROR: Cannot publish message to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err)
                        reject(false)
                    }
                }
                client.end()
            })
        } catch (err) {
            console.log('ERROR: Cannot connect to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err)
            reject(false)
        }
    })
}

export function subscribe(config) { // Subscribe to the MQTT Broker and decrypt the messages
    try {
        let client = mqtt.connect('mqtt://' + config.MQTT.BROKER + ':' + config.MQTT.PORT)
        client.on('connect', () => {
            client.subscribe(config.MQTT.TOPIC)
        })

        client.on('message', (topic, message) => {
            let spayload = JSON.parse(message.toString())
            for (let i in spayload['SMQTT']) {
                let payload = JSON.parse(decrypt_message(spayload['SMQTT'][i], config.SMQTT.PRIVATE_KEY))
                let checksum = crypto.createHash('sha256').update(decodeURIComponent(payload.MESSAGE)).digest('base64')
                if (checksum != payload.CHECKSUM) {
                    console.log('ERROR : CHECKSUM : FAILED : ')
                } else {
                    console.log(decodeURIComponent(payload.MESSAGE))
                    // console.log('SUB : MESSAGE : RECEIVED : ' + payload.TIMESTAMP)
                }
            }
        })

    } catch (err) {
        console.log('ERROR: Cannot connect to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err)
        process.exit(1)
    }
}
