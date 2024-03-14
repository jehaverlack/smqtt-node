import fs from 'fs'
import * as path from 'path'
import crypto from 'crypto'
import * as mqtt from 'mqtt'
import { argv } from 'process'
import { fileURLToPath } from 'url';


export function pub_usage() { // Print usage for smqtt-pub.js
    console.log(`Usage:  smqtt-pub.js -c <mqtt-config.json> [OPTIONS] -m <message>
    -c <mqtt-config.json>  : The configuration file in conf directory.
    -m <message>           : The message to encrypt and publish to the MQTT Topic.

    Optional Arguments:
    -l <logfile>           : Override the Logfile from the mqtt-config.json
    -h <mqtt_broker>       : Overides MQTT Broker from the mqtt-config.json
    -p <mqtt_port>         : Overides MQTT Port from the mqtt-config.json
    -t <topic>             : Overides the MQTT Topic from the mqtt-config.json
    -k <new_key_name>      : Generate new RSA Key Pair and save to KEY_DIR directory.
    `)
}

export function sub_usage() { // Print usage for smqtt-sub.js
    console.log(`Usage:  smqtt-sub.js -c <mqtt-config.json> [OPTIONS]
    -c <mqtt-config.json>  : The configuration file in conf directory.

    Optional Arguments:
    -l <logfile>           : Override the Logfile from the mqtt-config.json
    -h <mqtt_broker>       : Overides MQTT Broker from the mqtt-config.json
    -p <mqtt_port>         : Overides MQTT Port from the mqtt-config.json
    -t <topic>             : Overides the MQTT Topic from the mqtt-config.json
    `)
}


export function get_config(app) { // Get the configuration
    // ##########  Defining Configuration  ##########
    let config = {}

    // if -c ARGV Load Config from -c ARGV else exit on error
    if (argv.indexOf('-c') > -1) {
        config = JSON.parse(fs.readFileSync(argv[argv.indexOf('-c') + 1], 'utf8'))
        config.FILES.CONFIG = argv[argv.indexOf('-c') + 1]
    } else {
            console.error('ERROR: No Config File Provided')
            pub_usage()
            process.exit(1)
    }

    // If -h ARGV Override Broker from -h ARGV
    if (argv.indexOf('-h') > -1) {
    config.MQTT.BROKER = argv[argv.indexOf('-h') + 1]
    }

    // If -p ARGV Overide Port from -p ARGV
    if (argv.indexOf('-p') > -1) {
    config.MQTT.PORT = argv[argv.indexOf('-p') + 1]
    }

    // If -t ARGV Override Topic from -t ARGV
    if (argv.indexOf('-t') > -1) {
    config.MQTT.TOPIC = argv[argv.indexOf('-t') + 1]
    }


    // project directory aka: src/..
    config.DIRS.APP_DIR  = path.join(fileURLToPath(import.meta.url), '..', '..')

    for (let d in config.DIRS) {
        for (let r in config.DIRS) {
            config.DIRS[d] = config.DIRS[d].replace(RegExp(r, 'g'), config.DIRS[r])
        }
    }

    // Ensure directories have been created
    for (let d in config.DIRS) {
        try {
            fs.mkdirSync(config.DIRS[d], { recursive: true })
        } catch (e) {
            console.error('ERROR: Cannot create Directory: ' + config.DIRS[d])
            process.exit(1)
        }
    }

    for (let f in config.FILES) {
        for (let r in config.DIRS) {
            config.FILES[f] = config.FILES[f].replace(RegExp(r, 'g'), config.DIRS[r])
        }
    }

    // Read package.json

    let packageFile = path.join(config.DIRS.APP_DIR, 'package.json')
    let packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'))
    config.PACKAGE = packageJson

    config.APP.NAME      = path.join(app).replace(path.join(config.DIRS.APP_DIR, 'src') + '/', '')
    config.APP.LOG_TITLE = config.APP.NAME + " : v" + config.PACKAGE.version + ' ' + config.PACKAGE.version_date + ' : PID = ' + process.pid

    
    // If -m ARGV Set Message from -m ARGV else exit on error
    if (config.APP.NAME == 'smqtt-pub.js') {
        if (argv.indexOf('-m') > -1) {
            config.MQTT.MESSAGE = argv[argv.indexOf('-m') + 1]
        } else {
            console.error('ERROR: No Message Provided')
            console.log('')
            pub_usage()
            process.exit(1)
        }                
    }

    // if -l ARGV Override Log File from -l ARGV
    if (argv.indexOf('-l') > -1) {
        config.FILES.LOG_FILE = argv[argv.indexOf('-l') + 1]
    } else { // No -l ARGV then define the default log file based on the app name
        config.FILES.LOG_FILE = path.join(config.DIRS.LOG_DIR, config.APP.NAME.replace(RegExp('\.js$'), '') + '.log')
    }

    // Private / Public Keys
    // 0. if -k ARGV Generate new RSA Key Pair and save to KEY_DIR directory.
    // 1. Firt look to config.SMQTT.PRIVATE_KEY and config.SMQTT.PUBLIC_KEY.
    // 2. If keys are not defined in step 1.  Then look to import key files in config.FILES.PRIVATE_KEY_FILE and config.FILES.PUBLIC_KEY_FILE.
    // 3. If keys are not defined in step 2.  Then generate new keys.
    // 4. If keys are not defined in step 3.  Then exit with error.

    if (argv.indexOf('-k') > -1) {
        let keyName = argv[argv.indexOf('-k') + 1]
        let newKeys = gen_rsa_keys()

        config.FILES.PRIVATE_KEY_FILE = path.join(config.DIRS.KEY_DIR, keyName + '.priv.pem')
        config.FILES.PUBLIC_KEY_FILE = path.join(config.DIRS.KEY_DIR, keyName + '.pub.pem')

        // update config file with new keys
        config.SMQTT.PRIVATE_KEY = newKeys.privateKey
        config.SMQTT.PUBLIC_KEY = newKeys.publicKey

        // console.log('DEBUG: ' + JSON.stringify(config.SMQTT, null, 2))
        // console.log('DEBUG: ' + JSON.stringify(config.FILES, null, 2))

        // Write Private Key to File with 400 permission
        try {
            fs.writeFileSync(config.FILES.PRIVATE_KEY_FILE, newKeys.privateKey, 'utf8')
            logger('INFO : New RSA Private Key File: ' + config.FILES.PRIVATE_KEY_FILE, config.FILES.LOG_FILE)
            try {
                fs.chmodSync(config.FILES.PRIVATE_KEY_FILE, 0o400)
            } catch (e) {
                logger('ERROR: Cannot chmod Private Key File: ' + config.FILES.PRIVATE_KEY_FILE + ' : ' + e, config.FILES.LOG_FILE)
                console.error('ERROR: Cannot chmod Private Key File: ' + config.FILES.PRIVATE_KEY_FILE + ' : ' + e)
                process.exit(1)
            }
        } catch (e) {
            logger('ERROR: Cannot write Private Key File: ' + config.FILES.PRIVATE_KEY_FILE + ' : ' + e, config.FILES.LOG_FILE)
            console.error('ERROR: Cannot write Private Key File: ' + config.FILES.PRIVATE_KEY_FILE + ' : ' + e)
            process.exit(1)
        }

        // Write Public Key to File with 400 permissions
        try {
            fs.writeFileSync(config.FILES.PUBLIC_KEY_FILE, newKeys.publicKey, 'utf8')
            logger('INFO : New RSA Public  Key File: ' + config.FILES.PUBLIC_KEY_FILE, config.FILES.LOG_FILE)
            try {
                fs.chmodSync(config.FILES.PUBLIC_KEY_FILE, 0o400)
            } catch (e) {
                logger('ERROR: Cannot chmod Public Key File: ' + config.FILES.PUBLIC_KEY_FILE + ' : ' + e, config.FILES.LOG_FILE)
                console.error('ERROR: Cannot chmod Public Key File: ' + config.FILES.PUBLIC_KEY_FILE + ' : ' + e)
                process.exit(1)
            }
        } catch (e) {
            logger('ERROR: Cannot write Public Key File: ' + config.FILES.PUBLIC_KEY_FILE + ' : ' + e, config.FILES.LOG_FILE)
            console.error('ERROR: Cannot write Public Key File: ' + config.FILES.PUBLIC_KEY_FILE + ' : ' + e)
            process.exit(1)
        }

        // Read, Update, and Write the Config File
        let configFile = JSON.parse(fs.readFileSync(config.FILES.CONFIG, 'utf8'))
        // configFile.SMQTT.PRIVATE_KEY = newKeys.privateKey
        // configFile.SMQTT.PUBLIC_KEY = newKeys.publicKey
        configFile.FILES.PRIVATE_KEY_FILE = config.FILES.PRIVATE_KEY_FILE
        configFile.FILES.PUBLIC_KEY_FILE = config.FILES.PUBLIC_KEY_FILE
        
        try {
            fs.writeFileSync(config.FILES.CONFIG, JSON.stringify(configFile, null, 2), 'utf8')
        } catch (e) {
            logger('ERROR: Cannot write Config File: ' + config.FILES.CONFIG + ' : ' + e, config.FILES.LOG_FILE)
            console.error('ERROR: Cannot write Config File: ' + config.FILES.CONFIG + ' : ' + e)
            process.exit(1)
        }

    } else {
        if (config.SMQTT.PRIVATE_KEY && config.SMQTT.PUBLIC_KEY) {
            config.SMQTT.PRIVATE_KEY = config.SMQTT.PRIVATE_KEY
            config.SMQTT.PUBLIC_KEY = config.SMQTT.PUBLIC_KEY
        } else if (config.FILES.PRIVATE_KEY_FILE && config.FILES.PUBLIC_KEY_FILE) {
            try {
                config.SMQTT.PRIVATE_KEY = fs.readFileSync(config.FILES.PRIVATE_KEY_FILE, 'utf8')
                config.SMQTT.PUBLIC_KEY = fs.readFileSync(config.FILES.PUBLIC_KEY_FILE, 'utf8')
            } catch (e) {
                console.log('TIP:  Generating new RSA Key Pair with the -k option')
                pub_usage()
                process.exit(1)
            }
        } else {
            console.log('TIP:  Generating new RSA Key Pair with the -k option')
            pub_usage()
            process.exit(1)
        }
    }

  return config
}

export function logger(message, logfile) { // Write a message to the log file
    // ISO 8601 Date and Time to Seconds
    let now = new Date()
    let ts = now.toISOString()

    try {
        fs.appendFileSync(logfile, ts + ' : '+ message + "\n", 'utf8')
    } catch (e) {
        console.log("ERROR: Cannot write Log File: " + logfile)
        process.exit(1)
    }
}
  
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

export function publish(config) { // Publish a secret message to the MQTT Broker
    return new Promise((resolve, reject) => {
        try {
            let client = mqtt.connect('mqtt://' + config.MQTT.BROKER + ':' + config.MQTT.PORT)
            let checksum = crypto.createHash('sha256').update(config.MQTT.MESSAGE).digest('base64')
            let payload = {}
            payload['TIMESTAMP'] = new Date().toISOString() // UTC ISO 8601
            payload['MESSAGE'] = config.MQTT.MESSAGE
            payload['CHECKSUM'] = checksum
            let msgString = JSON.stringify(payload)

            let spayload = {}
            spayload['SMQTT'] = []
            spayload['SMQTT'].push(encrypt_message(msgString, config.SMQTT.PUBLIC_KEY))

            client.on('connect', () => {
                try {
                    client.publish(config.MQTT.TOPIC, JSON.stringify(spayload))
                    client.end()
                    resolve(true)
                } catch (err) {
                    logger('ERROR: Cannot publish message to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err, config.FILES.LOG_FILE)
                    reject(false)
                }
            })

        } catch (err) {
            logger('ERROR: Cannot connect to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err, config.FILES.LOG_FILE)
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
                let checksum = crypto.createHash('sha256').update(payload.MESSAGE).digest('base64')
                if (checksum != payload.CHECKSUM) {
                    logger('ERROR : CHECKSUM : FAILED : ', config.FILES.LOG_FILE)
                } else {
                    console.log(payload.MESSAGE)
                    logger('SUB : MESSAGE : RECEIVED : ' + payload.TIMESTAMP, config.FILES.LOG_FILE)
                }
            }
        })

    } catch (err) {
        logger('ERROR: Cannot connect to MQTT Broker: ' + config.MQTT.BROKER + ' : ' + err, config.FILES.LOG_FILE)
        process.exit(1)
    }
}
