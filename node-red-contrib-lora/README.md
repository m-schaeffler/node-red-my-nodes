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

This node is a UDP server to communicate with LoRa gateways via the SEMTECH protocol.

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

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|UDP Port | number | port at which the server receives messages from the gateway.|

### lora decoder
### lora encoder
### lora check FC
### lora send
### lora keys

## Example Flow

[example flow](examples/flow.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
