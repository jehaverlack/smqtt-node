# smqtt-nodejs
Secret Message Queue Telemetry Transport (SMQTT) for Node.js

> SMQTT is being targeted to work with JavaScript, Node.js, Python, Go, and Rust such that Pub/Sub clients can be as platform / language independent as possible.

## Overview

SMQTT adds a layer of abstraction ontop of an insecure MQTT Broker:

-  **message** > **encrypt > pub** ->  **sub > decrypt** > **message**

Using public/private key encryption.

SMQTT provides a way to send secure messages over MQTT Broker Topics without using a secured MQTT Broker and without having time dependant encryption protocols.

# Example Usage

## Config

Copy **src/smqtt-config.example.json** to **conf/smqtt-config.test.json** and fill out 

---

## Sending one message

### Publish to MQTT Topic
```
$ node src/smqtt-pub.js -c conf/smqtt-config.test.json -m "Hello World"
```

### Listen on MQTT Broker Topic
The data is encrypted.

```
$ mosquitto_sub -h mqtt.example.com -t /smqtt
{"SMQTT":["Tmrx4NL6JBQ1uez6+gG30/vyGt4WBx2sa3/nXBtKO/CaOI/9qrJmLaQNSxnMh3OYkBQImCElWm3e6SPgutaEZJwNwH9uoOfSiscmr52mMFV+2nRRntziBzZyEaWsmZMpNE21EkCyG4bAzp0p+xz7VvCrKbpVYk4eV21BOGZOvZzCGEOam4egYnUdKFVCj6lpnKxe+wZ99bFUqBrrK1rYA8XlVN92/otP4RounxxZku8FYzWhzsPwxnW9N2D6ch9Xg2DnVTRW6bLnCQFR+Pb6DdE23nPTreLJegwus645u1A9ZGMr2iKp9Zzv930EG4mpthOs91uq4R7IUOQEecsA7Q=="]}
```

### SMQTT Subscrfiption
```
$ node src/smqtt-sub.js -c conf/smqtt-config.test.json
Hello World
```
---

## Sending 3 messages

### SMQTT Publish to MQTT Topic
```
$ node src/smqtt-pub.js -c conf/smqtt-config.test.json -m "one" "two" "three"
```

### Subscribe to MQTT Broker Topic
The data is encrypted.

```
$ mosquitto_sub -h mqtt.example.com -t /smqtt
{"SMQTT":["j9wGD8p1/0KSWX3P6EBcIm2O3RL872EGMXl5avl15WQ2BOZ6rPhBFEBweQ6ATPL6z2IbisN8E6+LSJ8/I3tmbwdsX65NXiaRnGynBBeRarY9SyXHCn7/196sJltEnsDHko7yvQGoF4AMTBUsd5E2bbotFU5lN7qU6W1Pso1QLWbg0rPOKOphbzbspF/oKm1GNoixOF9Z69GxyhwE9Ofoa9DFp/sGHRygRC6ktwW9qu80HtH6V3HfPUMnuoHlNMkagPT4NIzBt5AyKpS4mltcLzCz1/sNdPoHNEqrVEmdwXUh93My8wGS0WQGyy5ThtFmqcaTNH2SItdqL0i/VYM+MQ=="]}
{"SMQTT":["jMpR9ecoLXTX6T+HqrT7At1CjMPK823GgZp5011S6LjxfaBe7kAwEDC8gb+05VmSegyM9gDIpjFdFrEvlqn4m6dvPYEQV2jMv92V4t/jGKxsbiUt7Qe+kj6HOZsHxMGeqDW8oreZJy+ECM/wSTzU7f2oxQ+GZrmp/o5D7TcPqjuENj5KquJByYGUEx5WX31zquHY9Y1vbDczi4SIqThUO8yq+0g8bsJrAiU9FMzZOuFeluU08JKkRtm1chWigGsDQFrnxfmXCT4dqrCgsa4DJbH5wbj87Y/hHRIBU2ctl5GEkaEns4q1TZTixtQGaWcFjsyZF+gfnZVj7Uoocq1LMg=="]}
{"SMQTT":["g5a0SRV1/48AkEMt739vTE/2yl/cjQpMDP/HND2ptkb6HzACesjMGPoxeAOnPRQ3kGQ0sGr8b5OYqvOcSkEB6AfcmP9NgINd6STXyRroq+cIf/Fwq1I9xf21qJ0TQpvp1YEVc9Fg9z1p/cdYH2ZOaoNBSVfW42IrUkqwe52jgTFHroe3oXwpysCybqGmMOYvNhsCIL1OUzA7PQ/3hicZLltH3N4OoHDPISMMyZr8+riXyz6NLBgvVvgEUcyAiw3SESYb9CYkPTd0yMn92UjNyMDYpEhLXY05jN4uld2yd0Gf1XJkUHz/NyoHXiI3p/r3/1QZjwHAosg1jOdiJek4mQ=="]}
```

### SMQTT Subscrfiption
```
$ node src/smqtt-sub.js -c conf/smqtt-config.test.json
one
two
three
```

# Componenents

## smqtt.js

This is the SMQTT node.js library which is needed for all SMQTT functions.  Other then core modules, SMQTT depends on one other node_module:
- mqtt

## Pub Client: smqtt-pub.js

An example command line script that will publish and encrypted message to a MQTT Topic.
- Pub Clients need access to the Private Key

```
Usage:  smqtt-pub.js -c <mqtt-config.json> [OPTIONS] -m <message>
    -c <mqtt-config.json>  : The configuration file in conf directory.
    -m <message>           : The message to encrypt and publish to the MQTT Topic.

    Optional Arguments:
    -l <logfile>           : Override the Logfile from the mqtt-config.json
    -h <mqtt_broker>       : Overides MQTT Broker from the mqtt-config.json
    -p <mqtt_port>         : Overides MQTT Port from the mqtt-config.json
    -t <topic>             : Overides the MQTT Topic from the mqtt-config.json
    -k <new_key_name>      : Generate new RSA Key Pair and save to KEY_DIR directory.
```

## Sub Client: smqtt-sub.js

An example command line script that will subscribe to a MQTT topic, decrypt the messages, and print them to the screen.
- Sub Client need access to the Public Key

```
Usage:  smqtt-sub.js -c <mqtt-config.json> [OPTIONS]
    -c <mqtt-config.json>  : The configuration file in conf directory.

    Optional Arguments:
    -l <logfile>           : Override the Logfile from the mqtt-config.json
    -h <mqtt_broker>       : Overides MQTT Broker from the mqtt-config.json
    -p <mqtt_port>         : Overides MQTT Port from the mqtt-config.json
    -t <topic>             : Overides the MQTT Topic from the mqtt-config.json
```




# Installation

```
npm install
```

## Generating a new RSA Key Pair
To generate your RSA Key Pair

```
$ node src/smqtt-pub.js -c conf/smqtt-config.test.json -m "My Secret Message" -k myNewKey
```

# Roadmap 

## Server: index.js

> **FUTURE FEATURE**

The server is a future feature that will:
- facilitate using uniq priv/pub encryption keys on a per client per topic basis.
- support for rolling priv/pub keys such that the keys per client are regularly updated.
- client validation and onboarding