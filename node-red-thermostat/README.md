# @mschaeffler/node-red-thermostat

A Node Red node to control an (electric) heater.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-thermostat/examples/thermostat.png)

## Install

```
$ npm install @mschaeffler/node-red-thermostat
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | data to control the thermostat |

There are two different ways to control the thermostat:

### direct control

`msg.payload` is a destinct value:

|msg.payload| type  | description |
|:------|:------|:------------|
|`true` |boolean| starts heating according to already set data |
|`false`|boolean| stopps the heating |
|`on`   |string | starts heating according to already set data |
|`off`  |string | stopps the heating |
|`1`    |number | sets the cycle count to 1 and starts heating |
|`2`    |number | sets the cycle count to 2 and starts heating |
|`3`    |number | sets the cycle count to 3 and starts heating |
|`4`    |number | sets the cycle count to 4 and starts heating |
|`5`    |number | sets the cycle count to 5 and starts heating |
|`0`    |number | stopps the heating |

### control woith objects

`msg.payload` is an object with at least one of these members:

|msg.payload.| type  | description |
|:------|:------|:------------|
|temperature|number | actual temperature |

## Outputs

### state feedback

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `State-Prefix` + name of the device|
|payload | object | decoded state data|

### control output

## Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Devices      | JSON   | configuration of the BT-Home devices |
|counter is time|Boolean| the counter in encrypted messages is checked again the actual time |
|Status-Prefix| string | prefix for the topic for state output |
|Event-Prefix | string | prefix for the topic for event output |
|Context-Variable| string | name of the variable in flow context storage |
|Contextstore | string | context store to be used |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-thermostat/examples/thermostat.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
