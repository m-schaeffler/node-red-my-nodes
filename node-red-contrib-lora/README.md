# @mschaeffler/node-red-lora

Five nodes to send and receive LoRaWan messages via a gateway via the
[Semtech UDP protocol](https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT).

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-contrib-lora/examples/lora.png)

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

This node decodes a LoraWan message received by `lora server`.
It also generates messages to be sent to the end node in case of

- confirmed messages: the corresponding acknowledgment
- a message for this node from the send queue (s. `lora send`).

By this the downlink messages can be timed to be sent in the RX1 receive window of the LoRa end node.

#### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | lora message received by `lora server`.|

#### Outputs

##### decoded payload

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the end node from `lora keys`.|
|payload | object | decoded message to be further processed by `lora check FC`.|
|timeout | number | timeout, if present in `lora keys` for this node.|

```
{
    "rxpk": {                    // data from lora server
        "tmst": 501680883,
        "chan": 0,
        "rfch": 1,
        "freq": 868.1,
        "stat": 1,
        "modu": "LORA",
        "datr": "SF7BW125",
        "codr": "4/5",
        "lsnr": 10.3,
        "rssi": -67,
        "size": 23,
        "data": "...",
        "time": 1643556838991
    },
    "device_address": "123456ab",
    "frame_count": 4592,
    "port": 10,
    "mtype": "Confirmed Data Up",
    "confirmed": true,           // confirmed uplink?
    "type": "FooType",           // type of the lora node from lorawan-keys
    "name": "FooBar",            // name of the lora node from lorawan-keys
    "data": [ 0, 0 ]             // payload of the lora message
}
```

##### unknown sender

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | messages from unkown end nodes.   |

##### send message for encoder

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object |message from send queue to be encoded by `lora encoder`.|

#### Parameters

|config   | type         | description                     |
|:--------|:-------------|:--------------------------------|
|LoRa Keys|`lorawan-keys`| configuration node to define the end nodes.|
|TX-delay | number       | delay in µs for a downlink message (RECEIVE_DELAY1 in LoRa); possibly needs some tweaking.|

### lora encoder

This node encodes a LoraWan message.

#### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | lora message to be sent; normally from `lora decoder, send message for encoder`.|
|framecounter|number|set frame counter with value from persistent memory.|

#### Outputs

##### encoded payload

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | object | encoded message for `lora sender`.|

##### frame counter for persistence

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | number | frame counter for persistent storage.|

#### Parameters

|config   | type         | description                     |
|:--------|:-------------|:--------------------------------|
|LoRa Keys|`lorawan-keys`| configuration node to define the end nodes.|
|TX-Power | number       | transmit power for the gateway. |

### lora check FC

This node checks the frame counter (FC) of a LoraWan message.

It recognizes this situations:

- first message received: ok
- FC 0: ok, startup of end node
- FC increased by one: ok
- FC rollover: ok
- FC increased by more then one: ok + error message missing frame
- FC the same as last valid one: duplicate message
- anything else: error merssage, LoRa message is discared

#### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the end node from `lora keys`.|
|payload | object | lora message decoded by `lora decoder`.|

#### Outputs

##### checked lora message

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the end node from `lora keys`.|
|payload | object | checked ok message ready for node specific payload decoder.|

##### duplicate message

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the end node from `lora keys`.|
|payload | object | message in case of a reuse of the last valid farme counter value.|

##### error message

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | subject of the error message.     |
|payload | string | error message for logging.        |
|lora    | object | lora msg that caused the error message.|

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

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-contrib-lora/examples/lora.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
