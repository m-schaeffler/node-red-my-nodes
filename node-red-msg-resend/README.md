# @mschaeffler/node-red-msg-resend

A Node Red node for resending flow messages.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-msg-resend/examples/msg-resend.png)

When a new input message arrives, it will be (re)sent to the output port at specified time intervals.
This process will repeat until the next input message arrives, or until the maximum number of resends has been reached.

Thanks to Bart Butenaers for the basement I developed this node out of.

## Install

```
$ npm install @mschaeffler/node-red-msg-resend
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | topic for the output message|
|payload |        | payload for the output message |
|reset   |boolean | if true, resets the node; if combined with a `topic`, only this topic is reseted|
|resend_interval| number | changes the parameter `interval` for this topic|
|resend_max_count| number | changes the parameter `maximum` for this topic|

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
|interval | number | the intervall between two resends |
|maximum  | number | the maximum number of resends; 0 is infinite |
|byTopic  | boolean| shall resending be done on a topic base |
|firstDelayed | boolean| shall the first message be sent after a intervall, or instantly |
|addCounters  | boolean| shall a counter be added to the sent mesages |
|clone        | boolean| shall the messages be cloned |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-msg-resend/examples/msg-resend.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

[Bart Butenaers](https://github.com/bartbutenaers)

## License

Apache-2.0
