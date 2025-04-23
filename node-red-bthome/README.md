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

## Capture of Raw Frames

The raw data frames are captured by Shelly devices with Bluetooth (Gen2 up to Gen4) and then sent via MQTT to Node-Red.

[This is the script to be used.](https://raw.githubusercontent.com/m-schaeffler/ShellyScripts/refs/heads/main/ShellyBlu.js)

## Install

```
$ npm install @mschaeffler/node-red-bthome
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | data from Shelly script|

### msg.payload

Only the first two values are needed, the others are optional.

|msg.payload| type   | description                       |
|:----------|:-------|:----------------------------------|
|addr       | string |mac of the BT-Home device (needed) |
|data       | array of bytes|raw BT-Home message (needed) |
|rssi       | number |signal strength |
|time       | number |Javscript timestamp of the reception |
|gateway    | string |name of the geteway |

This is an example of such a message payload:
```
{
    "addr":    "00:11:22:33:44:55",
    "rssi":    -85,
    "time":    1745395033113,
    "gateway": "Shelly Gateway",
    "data":    [68,0,164,1,100,46,56,69,43,255]
}
```

## Outputs

There are two output ports:
1. one for meassurement values (states)
2. one for actions done with the devices (events)

### State

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | State-Prefix + name of the device|
|payload | object | decoded state data|

### Events

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | Event-Prefix + name of the device|
|payload | object | data of the decoded event|

## Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Devices      | JSON   | configuration of the BT-Home devices |
|Status-Prefix| string | prefix for the topic for state output |
|Event-Prefix | string | prefix for the topic for event output |
|Contextvar   | string | name of the variable in flow context storage |
|Contextstore | string | context store to be used |

### Device-Configuration

```
{}
```

### Context storage

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
