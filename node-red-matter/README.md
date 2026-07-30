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

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|

### Output

|msg.   | type   | description |
|:------|:-------|:------------|
|topic  | string | |
|payload| object | |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-matter/examples/matter.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
