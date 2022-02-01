# node-red-contrib-lora

Five nodes to send and receive LoRaWan messages via a gateway via the
[Semtech UDP protocol](https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT).

![image of example flow](examples/flow.png)

## Install

```
$ npm install node-red-contrib-lora
```

## Usage

By combining this 5 nodes, you can receive and send LoRaWan messages via a compatible gateway.

### lora server

This node is a UDP server to communicate with LoRa gateways via the
[SEMTECH protocol](https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT).

#### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | encoded txpk object generated py `lora encoder`.|

#### Outputs

##### tx

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | received message to be processed by `lora decoder`.|
|mac     | string | mac of the gateway.               |

##### stat

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | statistical data from gateway.    |
|mac     | string | mac of the gateway.               |

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|UDP Port | number | port at which the server receives messages from the gateway.|

### lora decoder

### lora encoder

### lora check FC

### lora send

### lora keys

This configuration node stores data about the LoRa end nodes.

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|LoRa-Keys|object|config data about the end nodes.|

```json
{
    "&lt;device address in lowercase hex&gt;": {
        "nsw": "&lt;LoRa NwkSKey&gt;",
        "asw": "&lt;LoRa AppSKey&gt;",
        "type": "&lt;Type of the node for further processing&gt;",
        "name": "&lt;Name of the node&gt;",
        "timeout": &lt;Timeout value for further processing, optional&gt;
    },
    "123456ab": {
        "nsw": "0123456789abcdef0123456789abcdef",
        "asw": "0123456789abcdef0123456789abcdef",
        "type": "FooType",
        "name": "FooBar",
        "timeout": 3600
    },
    ...
}
```

## Example Flow

[example flow](examples/flow.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
