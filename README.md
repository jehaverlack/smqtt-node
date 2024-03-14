# smqtt-nodejs
Secret Message Queue Telemetry Transport (SMQTT) for Node.js

> SMQTT is being targeted to work with JavaScript, Node.js, Python, Go, and Rust such that Pub/Sub clients can be as platform / language independent as possible.

## Overview

SMQTT adds a layer of abstraction ontop of an insecure MQTT Broker to **encrypt > pub** and **sub > decrypt** messages using public/private key encryption.

SMQTT provides a way to send secure messages over MQTT Broker Topics without using a secured MQTT Broker and without having time dependant encryption protocols.

# Componenents

## smqtt.js

This is the SMQTT node.js library which is needed for all SMQTT functions.  Other then core modules, SMQTT depends on one other node_module:
- mqtt

## Pub Client: smqtt-pub.js

An example command line script that will publish and encrypted message to a MQTT Topic.

- Pub Clients need access to the Private Key


## Sub Client: smqtt-sub.js

An example command line script that will subscribe to a MQTT topic, decrypt the messages, and print them to the screen.

- Sub Client need access to the Public Key


## Server: index.js

> **FUTURE FEATURE**

The server is a future feature that will:
- facilitate using uniq priv/pub encryption keys on a per client per topic basis.
- support for rolling priv/pub keys such that the keys per client are regularly updated.
- client validation and onboarding


# Installation

```
npm install
```



