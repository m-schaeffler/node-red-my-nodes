# @mschaeffler/node-red-fenecon

Node Red nodes to communicate with a Fenecon FEMS.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon.png)

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

### Outputs

|msg.   | type   | description |
|:------|:-------|-------------|
|topic  | string | same as in input.|
|payload| value or object | received data points. If more than one data point is returned, it is an object with key/value pairs.|

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|Fems    | feneconFems | configuration of the FEMS. |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fenecon/examples/fenecon.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
