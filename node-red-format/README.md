# @mschaeffler/node-red-format

Nodes to format simnple data.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/format.png)

If the msg property `invalid` is present in the message, all nodes ignore the message.

## Install

```
$ npm install @mschaeffler/node-red-format
```

## formatNumber

Formats the payload as a number.

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

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-format/examples/format.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
