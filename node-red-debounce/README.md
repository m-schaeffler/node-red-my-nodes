# @mschaeffler/node-red-debounce

Node Red nodes for debouncing data.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-debounce/examples/debounce.png)

## Install

```
$ npm install @mschaeffler/node-red-debounce
```

## debounce

The `debounce` node is for a general purpose debouncing of any data (`string`, `boolean`, `number` ...):

- What data is debounced can be selected with the `property` property.
- `filter`: The data can be checked for a change before the debounce.
- Debouncing means here that the node waits `time` time before sending out the last received message.
- If `restart` is active, the debouncing time is started again with every changed message.
- It can be changed from debouncing to blocking mode.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel. |
|payload |        | input value for `topic`. |
|debounceMs|number| if set, this is the debounce time for this message.|
|invalid |boolean | if true, this message is ignored. |
|reset   |boolean | if true, resets the node; if combined with a `topic`, only this topic is reseted.|

### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message.|
|payload |        | data evaluated out of the input message.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Time    | number | debouncing time.|
|Block   |boolean | block instead of decounce. this means that an incoming message is sent out immediately and afterwards for <code>time</code> all following messages are blocked|
|Filter in |boolean| data must differ at least by this value; it can be an absolute number or a percentage.|
|Filter out|boolean| shall messages with unchanged data not been sent.|
|Restart |boolean | shall the debouncing time be restarted with every received message.|
|byTopic |boolean | shall resending be done on a topic base.|
|Status  |boolean |shows the actual value as a node status.|

## debounce B

The `debounce B` node is for debouncing boolean values:

- What data is debounced can be selected with the `property` property.
- Unchanged values are sent out immediately.
- Debouncing means here that the node waits `timeTrue` / `timeFalse` time before sending out the last received message.
- If `restart` is active, the debouncing time is started again with every changed message.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel. |
|payload |        | input value for `topic`. |
|debounceMs|number| if set, this is the debounce time for this message.|
|invalid |boolean | if true, this message is ignored. |
|reset   |boolean | if true, resets the node; if combined with a `topic`, only this topic is reseted.|

### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message.|
|payload | boolean| data evaluated out of the input message.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Time True | number | debouncing time for `true` value.|
|Time False| number | debouncing time for `false` value.|
|Restart |boolean | shall the debouncing time be restarted with every received message.|
|byTopic |boolean | shall resending be done on a topic base.|
|Status  |boolean | shows the actual value as a node status.|

## debounce N

The `debounce N` node is for debouncing of numerical values:

- What data is debounced can be selected with the `property` property.
- `filter`: The value can be checked for a change greater then before the debounce.
- This threshold can be an absolute or a relative value.
- Debouncing means here that the node waits `time` time before sending out the last received message.
- If `restart` is active, the debouncing time is started again with every changed message.

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel. |
|payload |        | input value for `topic`. |
|debounceMs|number| if set, this is the debounce time for this message.|
|invalid |boolean | if true, this message is ignored. |
|reset   |boolean | if true, resets the node; if combined with a `topic`, only this topic is reseted.|

### Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message.|
|payload | number | data evaluated out of the input message.|

### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|Property| string | defines the message property to be used as payload.|
|Time    | number | debouncing time.|
|Filter  |boolean | shall messages received with unchanged data be ignored.|
|Restart |boolean | shall the debouncing time be restarted with every received message.|
|byTopic |boolean | shall resending be done on a topic base.|
|Status  |boolean | shows the actual value as a node status.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-debounce/examples/debounce.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
