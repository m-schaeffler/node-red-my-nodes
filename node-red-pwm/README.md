# @mschaeffler/node-red-pwm

Nodes for PWM handling in Node-Red.

If the msg property `invalid` is present in the message, all nodes ignore the message.

![image of nodes](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-pwm/examples/pwm.png)

## Install

```
$ npm install @mschaeffler/node-red-pwm
```

## PWM input

Measures the duty cycle of a rectangular wave.

### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | boolean| the rectangular wave signal.|

### Output

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | number | duty cycle.|
|cycles  | number | number of the high periods in the measurement buffer.|
|quality | number | fill rate of the measurement buffer.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|measure time|number|size of the measurement buffer in seconds.|
|Status|boolean|shows the actual value as a node status.|

## PWM output

Generates a PWM signal.

### Input

The message property to be used as payload can be defined with the `Property` property.

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | number | the duty cycle of the PWM between 0 and 1. 0 is off and 1 is continuously on.|

### Output

|msg.    | type   | description   |
|:-------|:-------|:--------------|
|payload | boolean| PWM signal of alternating `true` and `false`.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Period|number|periodic time of the PWM in seconds.|
|Status|boolean|shows the actual value as a node status.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-pwm/examples/pwm.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
