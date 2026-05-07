# @mschaeffler/node-red-format

Node-Red nodes for atomic file operations.

If the msg property `invalid` is present in the message, all nodes ignore the message.

## Install

```
$ npm install @mschaeffler/node-red-fsatomic
```

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fsatomic/examples/fsatomic.png)

## 

.

### Input

.

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

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-fsatomic/examples/fsatomic.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
