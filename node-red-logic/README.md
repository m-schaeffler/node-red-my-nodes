# @mschaeffler/node-red-logic

Nodes to perform boolean and arithmetic operations on input signals.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/logic.png)

If the msg property `invalid` is present in the message, all nodes ignore the message.

## Install

```
$ npm install @mschaeffler/node-red-logic
```

## Boolean Nodes

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/bool.png)

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
|Status|boolean|shows the actual value as a node status.|

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

## Integer Nodes

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/math.png)

### counter

A node that just count the messages.

#### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|count | number | number of messages.|

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
|Status|boolean|shows the actual value as a node status.|

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

|algorithm|description|
|:--------|:----------|
|add      |ads up the `topic` channels|
|mean     |averages the `topic` channels|
|prod     |multiplies the `topic` channels|
|min      |gets the minimal value of the `topic` channels|
|max      |gets the maximal value of the `topic` channels|

### statistics

Calculate statistical values of one or more data streams.

Each stream can be debounced by arithmatic mean.

If the msg property `invalid` is present in the message, all nodes ignore the message.

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
|payload | | same as in input message.|
|stats.count | number | number of data elements.|
|stats.min number | number | minimal value.|
|stats.max number | number | maximal value.|
|stats.average number | number | average value.|
|stats.deviation number | number | standard deviation.|
|stats.variation number | number | coefficient of variation.|

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|delta time|number|time frame to collect the data for the analysis.|
|min. Data|number|min. amount of data points to generate an output.|

## Edge Nodes

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/edge.png)

### fallingEdge

Message is only forwarded, if the payload falls below a threshold value.

Each `topic` is treated seperatly.

#### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | number | input value for `topic`.          |

#### Output

Trigger message, in case a falling edge is detected.

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Threshold|number|threshold value for the edge detection.|
|Status|boolean|shows the actual value as a node status.|

### raisingEdge

Message is only forwarded, if the payload raises above a threshold value.

Each `topic` is treated seperatly.

#### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | number | input value for `topic`.          |

#### Output

Trigger message, in case a raising edge is detected.

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Threshold|number|threshold value for the edge detection.|
|Status|boolean|shows the actual value as a node status.|

### hysteresis

Message is only forwarded, if the payload raises above an upper limit or falls below a lower limit.

Each `topic` is treated seperatly.

#### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel.        |
|payload | number | input value for `topic`.          |

#### Output

Trigger message, in case an edge is detected.

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|up Threshold|number|threshold value for the raising edge detection.|
|d(ow)n Threshold|number|threshold value for the falling edge detection.|
|1st message|string|initial behaviour (None, Rising, Falling, Any).|
|Status|boolean|shows the actual value as a node status.|

## Example Flows

[boolean nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/bool.json)

[integer nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/math.json)

[edge nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-logic/examples/edge.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## Contributors

for `falling edge`, `raising edge` and `hysteresis`:
* [Eugene Schava](https://github.com/eschava/node-red-contrib-edge-trigger)

## License

LGPL-2.1
