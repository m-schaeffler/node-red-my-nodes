# matter.js-Server

I'm using the [matter.js-Server](https://github.com/matter-js/matterjs-server) together with a 
[SLZB-MR1U](https://smlight.tech/de/products/slzb-mr1u) for controlling my matter setup.

## Prerequisite on Raspi

- user `matter` created with home dir `/srv/matter`
- Bluetooth working
- nodejs installed

## SLZB-MR1U

- is set up in `Thread+OTBR running on device` mode.
- BLE is off

## Installation

Installation of needed packages:
```
sudo apt install bluez libbluetooth-dev libudev-dev
```

log in as `matter` user and

```
mkdir server
cd server
npm install matter-server
```

## Configuration

all needed configuration is in the startup script `/srv/matter/start`:
```
#!/bin/sh

export NOBLE_BINDINGS=dbus

node ~/server/node_modules/matter-server/dist/esm/MatterServer.js --primary-interface eth0 --storage-path ~/data --production-mode --bluetooth-adapter 0
```

## Autostart

I'm autostarting with this systemd service file
```
# systemd service file to start matter server

[Unit]
Description=Matter.js server
Wants=network.target

[Service]
Type=exec
User=matter
Group=matter
WorkingDirectory=/srv/matter

Nice=1
LogsDirectory=matter

ExecStart=/srv/matter/start
# Use SIGINT to stop
KillSignal=SIGINT
# Auto restart on crash
Restart=on-failure
RestartSec=20
# Tag things in the log
SyslogIdentifier=MatterServer
#StandardOutput=syslog

[Install]
WantedBy=multi-user.target
```
