# hour meter

A working hour meter for NodeRed.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-hourmeter/examples/hourmeter.png)

## Install

```
$ npm install @mschaeffler/node-red-hourmeter
```

## Usage

The counter is started / stopped according to the value of the payload:

|type|value|counter is|
|:---|:----|:--------------|
|bool|false|stopped|
||true|started|
|number|0|stopped|
||1|started|
|string|false|stopped|
||0|stopped|
||off|stopped|
||stop|stopped|
||true|started|
||1|started|
||on|started|
||start|started|

A [local filesystem context store](https://nodered.org/docs/user-guide/context#saving-context-data-to-the-file-system) called `storeInFile` is needed to store the internal data.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | | Starts or stopps the counting. |
|reset   |boolean |If true, resets the counter to 0.|
|querry  |boolean |If true, just querries the state of the counter.|

### Outputs

#### boolean value

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | boolean | Is counting active?|

#### hour counter

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | number | Value of the hour counter.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|topic| string | Topic to send output values with.|
|cycle| number |Cyclic time of output; 0 is only at state change.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-hourmeter/examples/hourmeter.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
