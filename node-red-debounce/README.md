# @mschaeffler/node-red-debounce

Node Red nodes for debouncing data.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-debounce/examples/debounce.png)

## Install

```
$ npm install @mschaeffler/node-red-debounce
```

## debounce

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel. |
|payload |        | input value for `topic`. |
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
|time    | number | debouncing time.|
|filter  |boolean | shall messages received with unchanged data be ignored.|
|restart |boolean | shall the debouncing time be restarted with every received message.|
|byTopic |boolean | shall resending be done on a topic base.|

## debounce N

### Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | name of the input channel. |
|payload |        | input value for `topic`. |
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
|time    | number | debouncing time.|
|filter  | number | data must differ at least by this value; it can be an absolute number or a percentage.|
|restart |boolean | shall the debouncing time be restarted with every received message.|
|byTopic |boolean | shall resending be done on a topic base.|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-debounce/examples/debounce.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
