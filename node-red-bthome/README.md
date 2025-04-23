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

## Encryption

This node can decrypt [encrypted messages](https://bthome.io/encryption/), if the AES key is set in the `devices` parameter.

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
    "addr":    "11:22:33:44:55:66",
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
|topic   | string | `State-Prefix` + name of the device|
|payload | object | decoded state data|

### Events

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `Event-Prefix` + name of the device|
|payload | object | data of the decoded event|

## Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Devices      | JSON   | configuration of the BT-Home devices |
|Status-Prefix| string | prefix for the topic for state output |
|Event-Prefix | string | prefix for the topic for event output |
|Context-Variable| string | name of the variable in flow context storage |
|Contextstore | string | context store to be used |

### Device-Configuration

With this JSON string the installed [BT-Home](https://bthome.io) devices are configured:
```
{
    "<mac address of the device>": { "topic": "<name of the device>", "key": "<encryption key, if device is encrypted>" }
}
```

An example for such a config from the unit tests:
```
{
    "11:22:33:44:55:66": { "topic": "dev_unencrypted_1" },
    "00:01:02:03:04:05": { "topic": "dev_unencrypted_2" },
    "00:10:20:30:40:50": { "topic": "dev_encrypted_1", "key": "00112233445566778899AABBCCDDEEFF" },
    "00:00:00:00:00:00": { "topic": "dev_encrypted_2", "key": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] }
}
```

### Context storage

All recorded data can be stored in a flow context variable for
- initialisation
- statistics
- visualisation

Example:
```
{
    "dev_unencrypted_1":
    {
        "pid":       164,
        "time":      1745395033113,
        "encrypted": false,
        "battery":   100,
        "gw":        { "Shelly Gateway": { "time": 1745395033113, "rssi":-85 } },
        data":       { "humidity":56, "temperature":-21.3 }
    }
}
```

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
