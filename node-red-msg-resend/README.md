# @mschaeffler/node-red-msg-resend
A Node Red node for resending flow messages.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-msg-resend/examples/msg-resend.png)

Thanks to Bart Butenaers for the basement I developed this node out of.

## Install

```
$ npm install @mschaeffler/node-red-msg-resend
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | topic for the outout message|
|payload |        | payload for the outout message |
|reset   |boolean | if true, resets the node; if combined with a `topic`, only this topic is reseted|
|resend_interval| number ||
|resend_max_count| number ||

## Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message|
|payload |        | same is in corresponding input message|
|counter | number | resending counter, if parameter `addCounters` is set|
|max     | number | resending maximum, if parameter `addCounters` is set|
|...     |        | same is in corresponding input message|

## Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|| | |
|| number ||

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-msg-resend/examples/msg-resend.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

[Bart Butenaers](https://github.com/bartbutenaers)

## License

Apache-2.0
