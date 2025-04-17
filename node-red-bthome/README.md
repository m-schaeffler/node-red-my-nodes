# @mschaeffler/node-red-bthome

A Node Red node to decrypt and decode bthome frames.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.png)

## Install

```
$ npm install @mschaeffler/node-red-bthome
```

## Input

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | topic for the output message|
|payload |        | payload for the output message |

## Output

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|topic   | string | same is in corresponding input message|
|payload |        | same is in corresponding input message|

## Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|interval | number | the intervall between two resends |

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-bthome/examples/bthome.json)

## Corresponding Shelly-Script

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

[Bart Butenaers](https://github.com/bartbutenaers)

## License

Apache-2.0
