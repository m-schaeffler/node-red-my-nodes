# @mschaeffler/node-red-fenecon

A Node Red nodes to ping a host via TCP.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-tcping/examples/tcping.png)

## Install

```
$ npm install @mschaeffler/node-red-tcping
```

## tcPing Node

The node tests the ability to communicate with a host at a specific TCP port.
It just tries to establish the communication and closes it again without sending or receiving anything.

### Input

|msg.    | type    | description                       |
|:-------|:--------|:----------------------------------|
|topic   |string   | topic.|
|payload |undefined| Host and Port must be set in the node parameters.|
|payload |string   | defines the Host. If no Port is set with a speration by `:`, the Port parameter is used.|
|payload |object   | Host, Port and Family can be set by corresponding attributes; all missing ones are taken from the parameters.|

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | same as in input message.|
|payload| number or `false` | time of the communication startup or `false`; so it can be used like a Boolean value.|
|ping   | object | detailed data of the ping.|

### Parameters

|config  | type    | description                       |
|:-------|:--------|:----------------------------------|
|Host    | string  | Host to be pinged. |
|Port    | number  | TCP port to be used. |
|Family  | number  | Automatic, IPv4 or IPv6. |

## Example Flow

[example](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-tcping/examples/tcping.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
