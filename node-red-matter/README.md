# @mschaeffler/node-red-matterServer

Node Red nodes to do Matter communication via a [matter.js](https://github.com/matter-js/matterjs-server) server

[Configuration of the server](https://github.com/m-schaeffler/node-red-my-nodes/blob/main/node-red-matter/server.md)

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-matter/examples/matter.png)

## Install

```
$ npm install @mschaeffler/node-red-matterServer
```

## matterServer Node


### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | |
|payload| object | |

### Parameters

|config  | type        | description                       |
|:-------|:------------|:----------------------------------|

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

This commands are implemented:
- relay
- switch
- output
- light
    
    with this data:
    - `true` or `false`
    - `"on"` or `"off"`
    - `"toggle"`
    - on object with at least one of these elements:
        - `turn` or `on` with one of the values above
        - `brightness` with a number
        - `temp` with a color temperature in K
        - `rgb` with an object with `red`, `green`and `blue` values.
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
