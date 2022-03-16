# @mschaeffler/node-red-logic

Nodes to perform boolean and arithmetic operations on input signals.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.png)

## Install

```
$ npm install @mschaeffler/node-red-logic
```

## Usage

### to bool

Converts payload to a bool value:

|type|value|is converted to|
|:---|:----|:--------------|
|bool|false|false|
||true|true|
|number|0|false|
||1|true|
|string|false|false|
||0|false|
||off|false|
||true|true|
||1|true|
||on|true|

#### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | | input value.          |

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | boolean | bool value of payload.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|

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

### to number

Converts payload to a number.

#### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | | input value.          |

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | number | number value of payload.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
