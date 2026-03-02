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
- Shelly BLU Distance
- Shelly BLU Remote
- Ecowitt WS90 powered by Shelly

## Capture of Raw Frames

The raw data frames are captured by Shelly devices with Bluetooth (Gen2 up to Gen4) and then sent via MQTT to Node-Red.

[This is the script to be used.](https://raw.githubusercontent.com/m-schaeffler/ShellyScripts/refs/heads/main/ShellyBlu.js)

## Encryption

This node can decrypt [encrypted messages](https://bthome.io/encryption/), if the AES key is set in the `devices` parameter.

## Install

```
$ npm install @mschaeffler/node-red-bthome
```

## bthome Node

This node decodes the raw frames.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | data from Shelly script|
|resync  | boolean| if set to yes, allow all packed ids; to resync after some issue|

#### msg.payload

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

### Outputs

There are two output ports:
1. one for meassurement values (states)
2. one for actions done with the devices (events)

#### State

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `State-Prefix` + name of the device|
|payload | object | decoded state data|

#### Events

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `Event-Prefix` + name of the device|
|payload | object | data of the decoded event|

### Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Devices      | JSON   | configuration of the BT-Home devices |
|counter is time|Boolean| the counter in encrypted messages is checked again the actual time |
|Status-Prefix| string | prefix for the topic for state output |
|Event-Prefix | string | prefix for the topic for event output |
|Context-Variable| string | name of the variable in flow context storage |
|Contextstore | string | context store to be used |

#### Device-Configuration

With this JSON string the installed [BT-Home](https://bthome.io) devices are configured:
```
{
    "<mac address of the device in lower case>": { "topic": "<name of the device>", "key": "<encryption key, if device is encrypted>" }
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

#### Context storage

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
        "data":      { "humidity":56, "temperature":-21.3 }
    }
}
```

If content storage is active, statistical data is also stored in a variable with the suffix `-stat`:
```
{ ok:0, err:0, old:0, dup:0 }
```

## ws90 Node

This node does additional calulations with the data from an "*Ecowitt WS90 powered by Shelly*" weather station.

Normally this data is decoded by the `bthome` node.

Similar calculations are done by the Ecowitt base stations.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload |object  |data from `bthome` node.           |
|reset   |boolean |if set to `true`, the output filter is reset and unchanged values will been sent with the next raw data.|
|newday  |boolean |if set to `true`, a new day is started (rain today, rain yesterday and wind max).|

This is an example of such a message payload:
```
{
    "lux":           3630,
    "moisture":      false,
    "wind":          [1.5,1.5],
    "uv":            0,
    "direction":     174,
    "pressure":      948.2,
    "dewpoint":      -0.43,
    "humidity":      99,
    "temperature":   -0.3,
    "precipitation": 121.5
}
```
    
### Outputs

There are 12 output ports:

values are only sent out, if they are changed

| topic | explanation |
|:------|:------------|
|temperature|no calculation, value directly from the input data|
|dew point|no calculation, value directly from the input data|
|humidity|no calculation, value directly from the input data|
|raining|Is it raining at the moment?<br>It is set to `true`, if `moisture==true` or a delta in `precipitation` is received.<br>It is set to `false` after a timeout of 15min or 20min without any of the above events.<br>If `true` the class is set to `blueValue`.|
|rain yesterday|rain from yesterday, at `newday==true` it is taken from `rain today`|
|rain today|accumulated rain today, so since the last `newday==true` received|
|uv|no calculation, value directly from the input data<br>between 0 and 2 the class is set to `greenValue`, up to 5 to `yellowValue` and above to `redValue`|
|air pressure|can be either the measured air pressure (QFE) without any further calculation<br>or the air pressure at sea level (QFF) [for the calculation](https://de.wikipedia.org/wiki/Barometrische_H%C3%B6henformel)|
|direction|no calculation, value directly from the input data|
|wind|no calculation, value directly from the input data<br>between 0 and 25 the class is set to default, up to 50 to `yellowValue` and above to `redValue`|
|wind max|maximal wind speed today, so since the last `newday==true` received|
|illumination|no calculation, value directly from the input data|

#### style classes

Some values have style classes for the `dashboard 2` attached.

This classes should be defined (for an example check the `ui-template` in the 
[examples](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/CSS.json)):
- greenValue
- yellowValue
- redValue
- blueValue

### Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Contextstore | string | context store to be used. |
|reference height|number| height of the installation over the sea level, to caculate the relative air pressure (QFF).<br>If set to `0` no caclulation is done and the absolute air pressure (QFE) is outputed.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.json)

[CSS template](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/CSS.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
