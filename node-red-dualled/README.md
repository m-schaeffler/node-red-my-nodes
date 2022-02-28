# @mschaeffler/node-red-dualled

Two nodes to control dual (CCT) LEDs.

![image of example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-dualled/examples/dual.png)

## Install

```
$ npm install @mschaeffler/node-red-dualled
```

## Usage

With this nodes you can control pairs of warm and cold leds (called dual leds or CCT leds),
which are controled by two independant drivers, and use the feedback from the drivers.

### ctrlDualLed

This node drives the dual led by calculating the individual brightness values.
It works on base of `topic`s so that with each different `topic` another led can be controlled.

#### Input

All inputs are stored in a node local context variable, to always output a complete data set.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload | string | `on`, `off`, `toggle`             |
|        | boolean| switch on or off.                 |
|        | object | set `temp` or `brightness` according to `key`.|

#### Output

All values of the msg (incl. `topic`) are preserved, except the payload.

##### control warm LED

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload.turn | string | `on` or `off` for the warm led.|
|payload.brightness | number | brightness for the warm led.|
|payload.transition | number | transition time.       |

##### control cold LED

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload.turn | string | `on` or `off` for the cold led.|
|payload.brightness | number | brightness for the cold led.|
|payload.transition | number | transition time.       |

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|  | string | .     |
|    | string | .|

### feedbackDualLed

This node converts brightness values of two individually controlled leds into a brightness / temp tuple.

#### Input

All input values are organized in objects with the parameters `iWarm` and `iCold` as indexes.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload.output[iWarm]| string | state of warm led.   |
|payload.output[iCold]| string | state of cold led.   |
|payload.brightness[iWarm]| number | brightness of warm led.|
|payload.brightness[iCold]| number | brightness of cold led.|
|payload.power[iWarm]| number | actual power of warm led.|
|payload.power[iCold]| number | actual power of cold led.|
|payload.energy[iWarm]| number | total energy of warm led.|
|payload.energy[iCold]| number | total energy of cold led.|

```
{
    "output":{
        "Warm":"off",
        "Cold":"off"
    },
    "brightness":{
        "Warm":42,
        "Cold":38
    },
    "power":{
        "Warm":0,
        "Cold":0
    },
    "energy":{
        "Warm":45.56666666666667,
        "Cold":9.8
    }
}
```

#### Output

All values of the msg (incl. `topic`) are preserved, only this vales are chaged in the payload.

|msg.    | type   | description                       |
|:-------|:-------|:----------------------------------|
|payload.output|  | `output` of warm led              |
|payload.brightness| summed brightness                |
|payload.temp| number | interpolated color temperature.|
|payload.power| number | summed power of both leds.   |
|payload.energy| number | summed energy of both leds. |

#### Parameters

|config| type   | description                       |
|:-----|:-------|:----------------------------------|
|  | string | .     |
|    | string | .|

## Example Flow

[example flow](https://github.com/m-schaeffler/node-red-my-nodes/raw/main/node-red-dualled/examples/dual.json)

## Author

[Mathias Schäffler](https://github.com/m-schaeffler)

## License

LGPL-2.1
