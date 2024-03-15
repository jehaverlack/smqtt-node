// applib.js
// Application Library for APP Specific Functions

import fs from 'fs'
import * as path from 'path'
import { argv } from 'process'
import { fileURLToPath } from 'url';
import * as smqtt from './smqtt.js'

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

export function logger(message, logfile) { // Write a message to the log file
    // ISO 8601 UTC Date and Time to Seconds
    let ts = new Date().toISOString()

    try {
        fs.appendFileSync(logfile, ts + ' : '+ message + "\n", 'utf8')
    } catch (e) {
        console.log("ERROR: Cannot write Log File: [" + logfile + ']' + ' : ' + e)
        process.exit(1)
    }
}

export function get_config(app) { // Get the configuration
    let app_name = path.join(app).replace(path.join(fileURLToPath(import.meta.url), '..', '..') + '/src/', '')
    
    // ##########  Defining Configuration  ##########
    let config = {}

    // Reading Config File
    // if -c ARGV Load Config from -c ARGV else exit on error
    if (argv.indexOf('-c') > -1) {
        config = JSON.parse(fs.readFileSync(argv[argv.indexOf('-c') + 1], 'utf8'))
        config.FILES.CONFIG = argv[argv.indexOf('-c') + 1]
    } else {
            console.error('ERROR: No Config File Provided')
            pub_usage()
            process.exit(1)
    }

    // Set the App Name
    config.APP.NAME = app_name

    // App directories and files
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
    config.PACKAGE = JSON.parse(fs.readFileSync(path.join(config.DIRS.APP_DIR, 'package.json'), 'utf8'))

    // Set the App Log Title
    config.APP.LOG_TITLE = config.APP.NAME + " : v" + config.PACKAGE.version + ' ' + config.PACKAGE.version_date + ' : PID = ' + process.pid

    // Log File
    // if -l ARGV Override Log File from -l ARGV
    if (argv.indexOf('-l') > -1) {
        config.FILES.LOG_FILE = argv[argv.indexOf('-l') + 1]
    } else { // No -l ARGV then define the default log file based on the app name
        config.FILES.LOG_FILE = path.join(config.DIRS.LOG_DIR, config.APP.NAME.replace(RegExp('\.js$'), '') + '.log')
    }



    // MQTT parameters
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

        
    switch (config.APP.NAME) {
        case 'smqtt-pub.js': // Pub Config
            config.PUB = {}
            config.PUB.MESSAGE = []
            config.PUB.MQTT = config.MQTT
            config.PUB.SMQTT = {}
            
            // If -m ARGV push the remaining ARGV to the MESSAGE array
            if (argv.indexOf('-m') > -1) {
                for (let i = argv.indexOf('-m') + 1; i < argv.length; i++) {
                    config.PUB.MESSAGE.push(argv[i])
                }
                if (config.PUB.MESSAGE.length == 0) {
                    console.error('ERROR: No Message Provided')
                    console.log('')
                    pub_usage()
                    process.exit(1)
                }
            } else {
                console.error('ERROR: No Message Provided')
                console.log('')
                pub_usage()
                process.exit(1)
            } 

            // Generate a new RSA Key Pair
            if (argv.indexOf('-k') > -1) { 
                let keyName = argv[argv.indexOf('-k') + 1]
                let newKeys = smqtt.gen_rsa_keys()
    
                config.SMQTT.PRIVATE_KEY = newKeys.privateKey
                config.SMQTT.PUBLIC_KEY = newKeys.publicKey
    
                config.FILES.PRIVATE_KEY_FILE = path.join(config.DIRS.KEY_DIR, keyName + '.priv.pem')
                config.FILES.PUBLIC_KEY_FILE = path.join(config.DIRS.KEY_DIR, keyName + '.pub.pem')
    
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
                configFile.FILES.PRIVATE_KEY_FILE = config.FILES.PRIVATE_KEY_FILE
                configFile.FILES.PUBLIC_KEY_FILE = config.FILES.PUBLIC_KEY_FILE
                
                try {
                    fs.writeFileSync(config.FILES.CONFIG, JSON.stringify(configFile, null, 2), 'utf8')
                } catch (e) {
                    logger('ERROR: Cannot write Config File: ' + config.FILES.CONFIG + ' : ' + e, config.FILES.LOG_FILE)
                    console.error('ERROR: Cannot write Config File: ' + config.FILES.CONFIG + ' : ' + e)
                    process.exit(1)
                }
            }


            if (config.SMQTT.PUBLIC_KEY) {
                config.PUB.SMQTT.PUBLIC_KEY = config.SMQTT.PUBLIC_KEY
            } else if (config.FILES.PUBLIC_KEY_FILE) {
                try {
                    config.SMQTT.PUBLIC_KEY = fs.readFileSync(config.FILES.PUBLIC_KEY_FILE, 'utf8')
                    config.PUB.SMQTT.PUBLIC_KEY = config.SMQTT.PUBLIC_KEY
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

            break
        case 'smqtt-sub.js': // Sub Config
            config.SUB = {}
            config.SUB.MQTT = config.MQTT
            config.SUB.SMQTT = {}

            if (config.SMQTT.PRIVATE_KEY) {
                config.SUB.SMQTT.PRIVATE_KEY = config.SMQTT.PRIVATE_KEY
            } else if (config.FILES.PRIVATE_KEY_FILE) {
                try {
                    config.SMQTT.PRIVATE_KEY = fs.readFileSync(config.FILES.PRIVATE_KEY_FILE, 'utf8')
                    config.SUB.SMQTT.PRIVATE_KEY = config.SMQTT.PRIVATE_KEY
                } catch (e) {
                    console.log('TIP:  Generating new RSA Key Pair with the -k option')
                    pub_usage()
                    process.exit(1)
                }
            } else {
                console.log('TIP:  Generating new RSA Key Pair with smqtt-pub.sh and the -k option')
                pub_usage()
                process.exit(1)
            }

            break
        default:
            console.error('ERROR: Invalid App Name: ' + config.APP.NAME)
            process.exit(1)
    }

  return config
}