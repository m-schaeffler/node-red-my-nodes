# @mschaeffler/node-red-format

Nodes to format data for dashboard 2.0.

If the msg property `invalid` is present in the message, all nodes ignore the message.

## Install

```
$ npm install @mschaeffler/node-red-format
```

## formNumber

Formats the payload as a number.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/format.png)

### Input

The message property to be used as payload can be defined with the `Property` property.

This value is then
- if the value is a number: converted to a string according to the parameters and a unit is added
- in other cases: been sent out unmodified

### Output

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | string | formated value|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Einheit|string|unit of the value.|
|Tausender|string|character to group the number in segments of 3 digits.|
|Dezimal|string|character to decimal separation.|
|Stellen|number|number of digits after the decimal point.|
|Status|boolean|shows the actual value as a node status.|
|Filter|boolean|block sending of unchanged `payload`.|

### Example Flow

Aggregates data series for a chart of dashboard 2.0.

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/format.json)

## collectChart

Formats the payload as a number.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/collectChart.png)

### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|topic   | string | series of the input value.|
|payload | string | input value.|

### Output

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | array | formated value for the dashboard 2.0 chart|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Contextstore|context store|context store for storing the values; `none` is no storage.|
|Topics|JSON array|array of the serieses of the chart. They can be either a string with just the name or an object with values from the next chapter.|
|Cyclic|number|cyclic time to send out the chart in seconds.|
|Löschzyklen |number| every how many `cycles` old data is deleted from the chart.|
|Hours|number|how many hours the chart should span over.|
|Steps|boolean|make steps instead of linear chart.|
|Status|boolean|shows the actual value as a node status.|

### Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/collectChart.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
