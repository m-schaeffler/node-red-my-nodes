# @mschaeffler/node-red-bthome

A Node Red node to decrypt and decode raw data frames from [BT-Home](https://bthome.io) sensors.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.png)

At the moment these sensors are implemented and tested:
- Shelly BLU Door/Window
- Shelly BLU H&T
- Shelly BLU Button 1
- Shelly BLU Button Tough 1 
- Shelly BLU RC Button 4
- Shelly BLU Wall Switch 4
- Shelly BLU Motion 

## capture of raw frames

The raw data frames are captured by Shellym devices with Bluetooth (Gen2 up to Gen4) and then sent via MQTT to Node-Red.

[This is the script to be used.](https://raw.githubusercontent.com/m-schaeffler/ShellyScripts/refs/heads/main/ShellyBlu.js)

## Install

```
$ npm install @mschaeffler/node-red-bthome
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | topic for the output message|
|payload |        | payload for the output message |

## Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message|
|payload |        | same is in corresponding input message|

## Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|interval | number | the intervall between two resends |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.json)

## Corresponding Shelly-Script

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

Apache-2.0
