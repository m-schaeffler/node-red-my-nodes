# matter.js-Server

I'm using the [matter.js-Server](https://github.com/matter-js/matterjs-server) together with a 
[SLZB-MR1U](https://smlight.tech/de/products/slzb-mr1u) for controlling my matter setup.

## Prerequisite on Raspi

- user `matter` created
- Bluetooth working
- nodejs installed

## SLZB-MR1U

- is set up in `Thread+OTBR running on device` mode.
- BLE is off

## Installation

Installation of needed packages:
```sudo apt install bluez libbluetooth-dev libudev-dev```

log in as `matter` user

```mkdir server
cd server
npm install matter-server```

Installation

## Configuration

## Autostart

