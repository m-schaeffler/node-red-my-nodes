# @mschaeffler/node-red-thermostat

.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-thermostat/examples/thermostat.png)

## Install

```
$ npm install @mschaeffler/node-red-thermostat
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | |

## Outputs

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `State-Prefix` + name of the device|
|payload | object | decoded state data|


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
