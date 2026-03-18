# @mschaeffler/node-red-fenecon

A Node Red nodes to .

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-tcping/examples/tcping.png)

## Install

```
$ npm install @mschaeffler/node-red-tcping
```

## tcPing Node

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   |string  | .|

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | .|
|payload| value or object | .|

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|Fems    | feneconFems | configuration of the FEMS. |
|Topic   | string      | the data point to request; if empty, `msg.topic` will be used. |
|Complete| boolean     | sending out the complete response data or just the value. |

## Example Flow

[example](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-tcping/examples/tcping.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
