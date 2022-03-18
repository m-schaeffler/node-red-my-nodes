# @mschaeffler/node-red-logic

Nodes to perform boolean and arithmetic operations on input signals.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.png)

## Install

```
$ npm install @mschaeffler/node-red-logic
```

## Usage

### counter

A node that just count the messages.

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|count | number | number of messages.|

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

Combines two or more boolean vales with the `or` operator.

The input values are converted as described in the `to bool` node.

#### Input

The different inputs are differentiated by topics.

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | boolean| input value for `topic`.          |

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | boolean | result of `or` of all input topics.|
|count | number | number of data elements.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Topic | string | defines the topic for the output message.|
|Property| string | defines the message property to be used as payload.|
|min. Data|number|min. amount of topics to generate an output.|

### and

Combines two or more boolean vales with the `and` operator.

The input values are converted as described in the `to bool` node.

#### Input

The different inputs are differentiated by topics.

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | boolean| input value for `topic`.          |

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | boolean | result of `and` of all input topics.|
|count | number | number of data elements.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Topic | string | defines the topic for the output message.|
|Property| string | defines the message property to be used as payload.|
|min. Data|number|min. amount of topics to generate an output.|

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

### reduce

Combines two or more streams of data (topics) into one single value.

Each stream can be debounced by arithmatic mean.

#### Input

The different inputs are differentiated by topics.

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | number | input value for `topic`.          |

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | number | result of combining of all input topics.|
|count   | number | number of data elements.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Topic | string | defines the topic for the output message.|
|Property| string | defines the message property to be used as payload.|
|min. Mean|number|min. amount of values for the arithmatic mean of one topic.|
|max. Mean|number|max. amount of values for the arithmatic mean of one topic.|
|min. Data|number|min. amount of topics to generate an output.|
|Algorithm|string|algorithm to combine the values.|

#### Algorithms

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
