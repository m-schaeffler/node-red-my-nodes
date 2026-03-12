# @mschaeffler/node-red-fenecon

Node Red nodes to communicate with a Fenecon FEMS.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon_http.png)

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon_websocket.png)

## Install

```
$ npm install @mschaeffler/node-red-fenecon
```

## feneconFems Node

This node contains the configuration data for the connection to the FEMS.

### Parameters

|config       | type   | description                       |
|:------------|:-------|:----------------------------------|
|Hostname     | string | hostname of the FEMS |

## feneconHttpGet Node

A Node Red node to request one ore more data points from a Fenecon FEMS.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   |string  |data point to be requested         |

#### Data Points

The data points of the FEMS are always named as `group/name`.
You can get all possible data points with the request `.*/.*`.

Examples:
- `.*/.*`
- `_meta/V.*`
- `_meta/Version`
- `ctrlGridOptimizedCharge0/(DelayChargeMaximumChargeLimit|_PropertyManualTargetTime)`

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | same as in input.|
|payload| value or object | received data points. If more than one data point is returned, it is an object with key/value pairs.|

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|Fems    | feneconFems | configuration of the FEMS. |
|Topic   | string      | the data point to request; if empty, `msg.topic` will be used. |

## feneconHttpPost node

A Node Red node to set data points at a Fenecon FEMS with the App "Schreibzugriff".

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   |string  |data point to be written |
|payload |number  |value to be written |

#### Data Points

The data points of the FEMS are always named as `group/name`.
You can find the writable data points at the [FEMS documentation](https://docs.fenecon.de/de/fems/fems-app/App_REST-JSON_Schreibzugriff.html).

Examples:
- `ess0/SetActivePowerEquals`
- `ess0/SetActivePowerLessOrEquals`
- `ess0/SetActivePowerGreaterOrEquals`

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|Fems    | feneconFems | configuration of the FEMS. |
|Topic   | string      | the data point to set; if empty, `msg.topic` will be used. |

## feneconWebsocket node

A Node Red node to subscribe data points and configuration data at a Fenecon FEMS via the WebSocket interface similar to the web UI.

It is also possible to write config data.
__This can be dangerous and damage your FEMS! This is done at your own risk! Please be careful and we accept no responsibility whatsoever for a damaged FEMS!__

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   |string  |`open`, `close` or name of the config parameter to be written |
|payload |number  |value of the config parameter to be written |

### Outputs

#### subscribed data

Cyclic output of the subscribed data points.

|msg.   | type   | description |
|:------|:-------|:------------|
|payload| object | received data points. It is an object with key/value pairs.|

#### config data

Config data of the FEMS.

|msg.   | type   | description |
|:------|:-------|:------------|
|payload| object | received config data.|

#### state

Actual state of the websocket connection.

|msg.   | type   | description |
|:------|:-------|:------------|
|payload| string | state of the websocket.|

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|Fems    | feneconFems | configuration of the FEMS. |
|Edge    | string      | id of the edge; normally `"0"`. |
|Inlist  | array       | list of subscribed data points. |
|Risk    | boolean     | risk accepted, enables writing. |
|Timeout | boolean     | send `"timeout"` as state, if 10s no subscribed message arrives. |

#### Data Points

The data points of the FEMS are always named as `group/name`.
You can find possible data points at [FEMS documentation](https://docs.fenecon.de/de/fems/glossar.html#_liste_der_komponenten_und_kan%C3%A4le).

Example inlist:
```
[
    "_sum/State",
    "_sum/GridMode",
    "_sum/EssSoc",
    "_sum/ProductionActivePower",
    "_sum/EssDischargePower",
    "_sum/GridActivePower",
    "_sum/GridSellActiveEnergy",
    "_sum/GridBuyActiveEnergy",
    "_sum/ProductionActiveEnergy",
    "_sum/EssDcDischargeEnergy",
    "_sum/EssDcChargeEnergy",
    "batteryInverter0/AirTemperature",
    "batteryInverter0/RadiatorTemperature",
    "ctrlIoHeatPump0/Status",
    "charger0/ActualPower",
    "charger1/ActualPower",
    "ctrlGridOptimizedCharge0/DelayChargeState",
    "meter0/CurrentL1",
    "meter0/CurrentL2",
    "meter0/CurrentL3"
]
```

## Example Flow

[HTTP API](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon_http.json)

[WebSocket API](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon_websocket.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
