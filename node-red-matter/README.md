# @mschaeffler/node-red-matterServer

Node Red nodes to do Matter communication via a [matter.js](https://github.com/matter-js/matterjs-server) server

[Configuration of the server](https://github.com/m-schaeffler/node-red-my-nodes/blob/main/node-red-matter/server.md)

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-matter/examples/matter.png)

## Install

```
$ npm install @mschaeffler/node-red-matterServer
```

## matterServer Node

This node connects to a matter.js server, decodes received data (Matter attributes and events) and controls nodes via Matter commands.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic  | string | comnmand to be executed by the server or name of the node to be controlled.|
|payload| | data for the control of a node.|

#### Server Commands

|msg.topic|msg.payload|description|
|:------|:----------|:----------------------------------|
|open|null|opens the connection to the server|
|close|null|closes the connection to the server|
|get_nodes|null|rereads all avaliable nodes, normally not neccessary|
|ping_node|node id to be pinged|pings a node|
|get_thread_border_routers|null|requests all available TBRs; data is outputed via `node.warn`|
|get_thread_diagnostics|null|requests available Thread diag data; data is outputed via `node.warn`|

#### Node Control

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | name of the device ( + number of the endpoint )|
|payload| object | command and data|
|payload.command| string | command in the form `clustername.commandname`|
|payload.data| object | data for this command|

additional commands:
- `rvc.clean` starts a vacuum robot for the rooms in the `data` array.
- `rvc.stop`
- `windowcovering.gotolift` moves the cover to the `data` position.


### Outputs

#### Received Data

Received and decoded values of selected cluster attributes  the node.

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | `State-Prefix` + name of the device ( + number of the endpoint )|
|payload| object | decoded state (attribute) data|

#### Received Events

Received and decoded events of the node.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `Event-Prefix` + name of the device ( + number of the endpoint )|
|payload | object | data of the decoded event|

#### Node Online State

Online status of the node as reported by the matter.js server.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | `Online-Prefix` + name of the device|
|payload | boolean| online status of the node|

#### Connection Status

Actual state of the websocket connection.

|msg.   | type   | description |
|:------|:-------|:------------|
|payload| string | state of the websocket.|

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|
|host    | string | hostname of the matter.js server |
|port    | number | port for the websocket API |
|statusPrefix| string | prefix for the topic for state / data output |
|eventPrefix | string | prefix for the topic for event output |
|onlinePrefix| string | prefix for the topic for online output |
|contextVar  | string | name of the variable in flow context storage |

### Context Storage

In the flow context variable are all data for the different nodes stored.

## matterConnMan node

A Node Red node to manage the state of a `matterServer` node.

### Input

|msg.   | type   | description |
|:------|:-------|:------------|
|payload|string  | state message from `matterServer` node. |

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  |string  | `open` command for a `matterserver` node. |

### Parameters

|config  | type  | description                       |
|:-------|:------|:----------------------------------|
|restart time |number | delay after an error before the first restart, it will be cyclically retried until the connection can be established. |

## matterShellySim node

This node converts several commands with data similar to the [Shelly RPC API](https://shelly-api-docs.shelly.cloud/gen2/) into matter compatible commands.

Any unknown command is forwarded unchanged, so also Matter commands can be routed through the node.

This commands are implemented with the corresponding data indented:
- relay
- switch
- output
- light
    - `true` or `false`
    - `"on"` or `"off"`
    - `"toggle"`
    - an object with at least one of these elements:
        - `turn` or `on` with one of the values above
        - `brightness` with a number
        - `temp` with a color temperature in K
        - `rgb` with an object with `red`, `green` and `blue` values.
- roller
- cover
    - `"open"`, `"close"` or `"stop"` 
- position
    - with a position for the cover in %

Example:
```
{
    "command": "light",
    "data": {
        "on": true,
        "brightness": 80,
        "rgb": {
            "red": 255,
            "green": 0,
            "blue": 0
        }
    }
}
```

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | target of the command |
|payload| object | object with the command |
|payload.command| string | Shelly or Matter command |
|payload.data| object or value | Data for the command |

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | same as on input, target of the command |
|payload| object | object with the command |
|payload.command| string | Matter command |
|payload.data| object | Data for the command |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-matter/examples/matter.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
