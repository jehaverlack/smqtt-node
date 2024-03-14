import fs from 'fs'
import * as path from 'path'
import crypto from 'crypto'
import * as mqtt from 'mqtt'
import { argv } from 'process'
import { fileURLToPath } from 'url';


export function pub_usage() { // Print usage for smqtt-pub.js
    console.log(`Usage:  smqtt-pub.js -c <mqtt-config.json> -h <mqtt_broker> -t <topic> -m <message>
    -c <mqtt-config.json>  : The configuration file in conf directory.
    -l <logfile>           : OPTIONAL: The log file to write to. Default is logs/smqtt.log
    -h <mqtt_broker>       : OPTIONAL: Overides MQTT Broker from the mqtt-config.json.
    -p <mqtt_port>         : OPTIONAL: Overides MQTT Port from the mqtt-config.json.
    -t <topic>             : OPTIONAL: Overides the MQTT Topic from the mqtt-config.json.
    -m <message>           : The message to encrypt and publish to the MQTT Topic.`)
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

    // if -l ARGV Override Log File from -l ARGV
    if (argv.indexOf('-l') > -1) {
    config.FILES.LOG = argv[argv.indexOf('-l') + 1]
    }

    // If -p ARGV Overide Port from -p ARGV
    if (argv.indexOf('-p') > -1) {
    config.MQTT.PORT = argv[argv.indexOf('-p') + 1]
    }

    // If -t ARGV Override Topic from -t ARGV
    if (argv.indexOf('-t') > -1) {
    config.MQTT.TOPIC = argv[argv.indexOf('-t') + 1]
    }

    // If -m ARGV Set Message from -m ARGV else exit on error
    if (argv.indexOf('-m') > -1) {
    config.MQTT.MESSAGE = argv[argv.indexOf('-m') + 1]
    } else {
        console.error('ERROR: No Message Provided')
        pub_usage()
        process.exit(1)
    }


    // project directory aka: src/..
    config.DIRS.APP_DIR = path.join(fileURLToPath(import.meta.url), '..', '..')
    config.APP.NAME     = path.join(app).replace(path.join(config.DIRS.APP_DIR, 'src') + '/', '')


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
        // console.log('DEBUG: ' + packageFile + ': ' + JSON.stringify(packageJson, null, 2))

    // try {
    //     // config.PACKAGE = packageJson
    // } catch (e) {
    //     console.error('ERROR: Cannot read ' + path.join(config.DIRS.APP_DIR, 'package.json'))
    //     process.exit(1)
    // }

    // If config.SMQTT.PRIVATE_KEY and/or config.SMQTT.PUBLIC_KEY are not defined or empty, then look
    // to import key files in config.FILES.PRIVATE_KEY_FILE and config.FILES.PUBLIC_KEY_FILE.
    // if (config.SMQTT.PRIVATE_KEY === '') {
    //     try {
    //         config.SMQTT.PRIVATE_KEY = fs.readFileSync(config.FILES.PRIVATE_KEY_FILE, 'utf8')
    //     } catch (e) {
    //         console.error('ERROR: No Private Key Provided')
    //         pub_usage()
    //         process.exit(1)
    //     }

    // }


    // ##########  Validating Configuration  ##########

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
