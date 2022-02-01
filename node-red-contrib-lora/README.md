# @mschaeffler/node-red-lora

Five nodes to send and receive LoRaWan messages via a gateway via the
[Semtech UDP protocol](https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT).

![image of example flow](examples/flow.png)

## Install

```
$ npm install @mschaeffler/node-red-lora
```

## Usage

By combining this five nodes, you can receive and send LoRaWan messages via a compatible gateway.

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

#### Parameters

|config   | type         | description                     |
|:--------|:-------------|:--------------------------------|
|LoRa Keys|`lorawan-keys`| configuration node to define the end nodes.|

### lora encoder

#### Parameters

|config   | type         | description                     |
|:--------|:-------------|:--------------------------------|
|LoRa Keys|`lorawan-keys`| configuration node to define the end nodes.|

### lora check FC

### lora send

This node puts a LoraWan message into the send queue.
The send queue is stored in the flow context `sendqueue`.

#### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | byte array | lora payload to be sent; as an array of bytes or as a `Buffer`.|
|topic   | string     | name of the LoRa end node as in `LoRa Keys`.|

#### Parameters

|config   | type         | description                     |
|:--------|:-------------|:--------------------------------|
|LoRa Keys|`lorawan-keys`| configuration node to define the end nodes.|

### lora keys

This configuration node stores data about the LoRa end nodes.

#### Parameters

|config   | type   | description                     |
|:--------|:-------|:--------------------------------|
|LoRa-Keys| object | config data about the end nodes.|

```
{
    <device address in lowercase hex>: {
        "nsw": "<LoRa NwkSKey>",
        "asw": "<LoRa AppSKey>",
        "type": "<Type of the node for further processing>",
        "name": "<Name of the node>",
        "timeout": <Timeout value for further processing, optional>;
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
