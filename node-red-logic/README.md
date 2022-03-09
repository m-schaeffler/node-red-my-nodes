# @mschaeffler/node-red-logic

Nodes to perform boolean and arithmetic operations on input signals.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.png)

## Install

```
$ npm install @mschaeffler/node-red-logic
```

## Usage

.

### or

.

#### Input

.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | .|
|payload | boolean| input value for `topic`.          |

#### Output

.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | boolean | result of `or` of all input topics.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|  | string | .     |

### and

.

#### Input

#### Output

#### Parameters

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
