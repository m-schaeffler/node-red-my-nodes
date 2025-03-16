# @mschaeffler/node-red-format

Nodes for initialisation of context storages.

At the start of a NodeRed flow, a flow or global contaxt variable can be initalized with a defined value, if is not already defined.
With input messages it can also be set or reseted to the initalisation value.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-init/examples/init.png)

## Install

```
$ npm install @mschaeffler/node-red-init
```

## initFlow

initialises a flow context variable.

### Input

If `msg.reset` is set or `msg.topic==="init"`, the variable is set to the initialisation value.

Otherwise the variable is set to `msg.payload`.

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Name  | string | name of the variable|
|Value | str,num,bool,json | initialisation value |

## initGlobal

initialises a global context variable.

### Input

If `msg.reset` is set or `msg.topic==="init"`, the variable is set to the initialisation value.

Otherwise the variable is set to `msg.payload`.

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Name  | string | name of the variable|
|Value | str,num,bool,json | initialisation value |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-init/examples/init.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
