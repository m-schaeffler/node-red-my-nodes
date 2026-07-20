// Matter Enums

class OperationalStateEnum {
    static 0x00 = "Stopped";
    static 0x01 = "Running";
    static 0x02 = "Paused";
    static 0x03 = "Error";
    static 0x40 = "SeekingCharger";
    static 0x41 = "Charging";
    static 0x42 = "Docked";
    static 0x43 = "EmptyingDustBin";
    static 0x44 = "CleaningMop";
    static 0x45 = "FillingWaterTank";
    static 0x46 = "UpdatingMaps";
}
Object.freeze(OperationalStateEnum);

class ErrorStateEnum {
    static 0x00 = "NoError";
    static 0x01 = "UnableToStartOrResume";
    static 0x02 = "UnableToCompleteOperation";
    static 0x03 = "CommandInvalidInState";
    static 0x40 = "FailedToFindChargingDock";
    static 0x41 = "Stuck";
    static 0x42 = "DustBinMissing";
    static 0x43 = "DustBinFull";
    static 0x44 = "WaterTankEmpty";
    static 0x45 = "WaterTankMissing";
    static 0x46 = "WaterTankLidOpen";
    static 0x47 = "MopCleaningPadMissing";
    static 0x48 = "LowBattery";
    static 0x49 = "CannotReachTargetArea";
    static 0x4A = "DirtyWaterTankFull";
    static 0x4B = "DirtyWaterTankMissing";
    static 0x4C = "WheelsJammed";
    static 0x4D = "BrushJammed";
    static 0x4E = "NavigationSensorObscured";
}
Object.freeze(ErrorStateEnum);

class OperationalStatusBitmap_Global {
    static 0x00 = "stopped";
    static 0x01 = "opening";
    static 0x02 = "closing";
}
Object.freeze(OperationalStatusBitmap_Global)

// LUTs

class MatterClusters {
    static OnOff               = 0x0006;
    static LevelControl        = 0x0008;
    static RvcRunMode          = 0x0054;
    static RvcOperationalState = 0x0061;
    static WindowCovering      = 0x0102;
    static ServiceArea         = 0x0150;
}
Object.freeze(MatterClusters);

// MatterData

class MatterData {
    constructor()
    {
        this._dataById = {};
        this._namesLut = {};
        this._changed  = {};
    }

    _doSetAttribute(id,attr,value)
    {
        let item    = this._dataById[id];
        let changed = this._changed;
        if( item )
        {
            const [endpoint,cluster,attribute] = attr.split( "/" );

            function setInternalMode(name,modeList)
            {
                item.internal[endpoint][name] = {};
                for( const v of modeList )
                {
                    item.internal[endpoint][name][v.mode] = v.label;
                }
            }

            function setDataValue(name,value)
            {
                item.data[endpoint][name] = value;
                changed[id] = true;
            }

            function convertErrors(errors)
            {
                let result = [];
                for( const i in errors )
                {
                    const e = errors[i];
                    if( e != 0 )
                    {
                        item.data[endpoint].errors.push( ErrorStateEnum[e] );
                    }
                }
                return result;
            }

            switch( cluster )
            {
                case "6": // On/Off
                    switch( attribute )
                    {
                        case "0": // OnOff
                            setDataValue( "output", value );
                            break;
                    }
                    break;
                case "8": // Level Control
                    switch( attribute )
                    {
                        case "0": // CurrentLevel
                            setDataValue( "brightness", Math.round( value / 2.54 ) );
                            break;
                    }
                    break;
                case "47": // Power Source
                    switch( attribute )
                    {
                        case "12": // BatPercentRemainingCurrentLevel
                            item.battery = value / 2;
                            break;
                    }
                    break;
                case "54": // WiFi Network Diagnostics
                    switch( attribute )
                    {
                        case "4": // Rssi
                            item.rssi = value;
                            break;
                    }
                    break;
            case "69": // BooleanStateswitch( attribute )
                switch( attribute )
                {
                    case "0": // StateValue
                        setDataValue( "sensor", value );
                        break;
                }
                break;
            case "84": // RVC Run Mode
                switch( attribute )
                {
                    case "0": // SupportedModes
                        setInternalMode( "supportedRunModes", value );
                        break;
                    case "1": // Current­Mode
                        setDataValue( "runMode", item.internal[endpoint].supportedRunModes[value] );
                        break;
                }
                break;
            case "85": // RVC Clean Mode
                switch( attribute )
                {
                    case "0": // SupportedModes
                        setInternalMode( "supportedCleanModes", value );
                        break;
                    case "1": // Current­Mode
                        setDataValue( "cleanMode", item.internal[endpoint].supportedCleanModes[value] );
                        break;
                }
                break;
            case "97": // RVC Operational State
                switch( attribute )
                {
                    case "4": // OperationalState
                        setDataValue( "state", OperationalStateEnum[value] );
                        break;
                    case "5": // OperationalError
                        setDataValue( "errors", convertErrors( value ) );
                        break;
                }
                break;
            case "128": // Boolean State Configuration
                switch( attribute )
                {
                    case "7": // Sensor­Fault
                        setDataValue( "errors", value ? ["GeneralFault"] : [] );
                        break;
                }
                break;
            case "144": // Electrical Power Measurement
                switch( attribute )
                {
                    case "8": // ActivePower
                        setDataValue( "power", value / 1000 );
                        break;
                }
                break;
            case "145": // Electrical Energy Measurement
                switch( attribute )
                {
                    case "1": // CumulativeEnergyImported
                        setDataValue( "energy", value["0"] / 1000 );
                        break;
                    case "2": // CumulativeEnergyExported
                        setDataValue( "returned_energy", value["0"] / 1000 );
                        break;
                }
                break;
            case "258": // Window Covering
                switch( attribute )
                {
                    case "8": // CurrentPositionLiftPercentage
                        setDataValue( "pos", value !== null ? 100 - value : null );
                        break;
                    case "9": // CurrentPositionTiltPercentage
                        setDataValue( "tilt", value );
                        break;
                    case "10": // OperationalStatus
                        setDataValue( "output", OperationalStatusBitmap_Global[ value & 0x03 ] );
                        break;
                }
                break;
            case "336": // Service Area
                switch( attribute )
                {
                    case "0": // SupportedAreas
                        item.internal[endpoint].supportedAreas = {};
                        for( const v in value )
                        {
                            item.internal[endpoint].supportedAreas[value[v][0]] = value[v][2][0][0];
                        }
                        break;
                    case "2": // SelectedAreas
                      {
                        let selectedAreas = [];
                        for( const a of value )
                        {
                            selectedAreas.push( item.internal[endpoint].supportedAreas[a] );
                        }
                        setDataValue( "selectedAreas", selectedAreas );
                      }
                        break;
                }
                break;
            }
        }
    }

    setAttribute(id,attr,value)
    {
        this._dataById[id].time = Temporal.Now.instant().epochMilliseconds;
        this._doSetAttribute( id, attr, value );
        this._changed[id] = true;
    }

    handleEvent(data)
    {
        console.log(data)
    }

    storeNode(n)
    {
        let help = this._dataById[n.node_id] ?? {};
        help.online   = n.available;
        help.time     = ( help.online ? Temporal.Now.instant() : Temporal.PlainDateTime.from( n.last_interview ).toZonedDateTime( Temporal.Now.timeZoneId() ) ).epochMilliseconds;
        help.make     = n.attributes["0/40/1"];
        help.model    = n.attributes["0/40/3"];
        help.label    = n.attributes["0/40/5"];
        help.name     = n.attributes["0/40/5"] || `${n.attributes["0/40/1"]}_${n.attributes["0/40/18"]}`;
        help.internal ??= {};
        help.data     ??= {};
        for( const e of n.attributes["0/29/3"] )
        {
            const channel = n.attributes["0/29/3"].length == 1 ? help.name : `${help.name}/${e}`;
            help.internal[e] ??= {};
            help.data    [e] ??= {};
            help.internal[e].name = channel;
            this._namesLut[channel] = { node: n.node_id, endpoint: e };
        }
        this._dataById[n.node_id] = help;
        this._changed [n.node_id] = true;
        for( const a in n.attributes )
        {
            this._doSetAttribute( n.node_id, a, n.attributes[a] );
        }
    }

    storeNodes(nodes)
    {
        for( const n of nodes )
        {
            this.storeNode( n );
        }
    }

    deleteNode(id)
    {
        if( this._dataById[id] )
        {
            this._dataById[id].online = false;
            this._changed[id] = true;
        }
    }

    storeIP(id,ips)
    {
        const testIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        for( const v of ips )
        {
            if( testIPv4.test( v ) )
            {
                this._dataById[id].ip4 = v;
            }
            else
            {
                this._dataById[id].ip6 = v;
            }
        }
    }

    forAllIds(callback)
    {
        for( const i in this._dataById )
        {
            callback( i );
        }
    }

    sendChanged(sendData)
    {
        for( const i in this._changed )
        {
            if( this._changed[i] )
            {
                this._changed[i] = false;
                const n = this._dataById[i];
                if( n.label )
                {
                    for( const e in n.data )
                    {
                        sendData( n.internal[e].name, n.data[e] );
                    }
                }
            }
        }
    }

    sendCommand(topic,command,data,sendCommand)
    {
        const id       = this._namesLut[topic];
        if( id === undefined )
        {
            throw new Error( "unknown node " + topic );
        }
        const internal = this._dataById[id.node].internal[id.endpoint];

        function sendDeviceCommand(cluster,command,data={})
        {
            sendCommand( "device_command", command, {
                "node_id":      id.node,
                "endpoint_id":  id.endpoint,
                "cluster_id":   cluster,
                "command_name": command,
                "payload":      data
            } );
        }

        function convertAreas(areas)
        {
            function area2id(area)
            {
                for( const id in internal.supportedAreas )
                {
                    if( id == area || internal.supportedAreas[id] == area )
                        return Number( id );
                }
                console.log(internal.supportedAreas)
                throw new Error( "invalid area " + area );
            }

            let help = [];
            switch( typeof areas )
            {
                case "number":
                case "string":
                    help.push( area2id( areas ) );
                    break;
                case "object":
                    if( Array.isArray( areas ) )
                    {
                        for( const i in areas )
                        {
                            help.push( area2id( areas[i] ) );
                        }
                    }
                    else
                    {
                        for( const i in areas )
                        {
                            if( areas[i] )
                            {
                                help.push( area2id( i ) );
                            }
                        }
                    }
                    break;
            }
            return help;
        }

        switch( command )
        {
            case "onoff.on":
                sendDeviceCommand( MatterClusters.OnOff, "On" );
                break;
            case "onoff.off":
                sendDeviceCommand( MatterClusters.OnOff, "Off" );
                break;
            case "onoff.toggle":
                sendDeviceCommand( MatterClusters.OnOff, "Toggle" );
                break;
            case "levelcontrol.movetolevel":
                sendDeviceCommand( MatterClusters.LevelControl, "MoveToLevel", data );
                break;
            case "rvc.clean":
                if( data != null )
                {
                    sendDeviceCommand( MatterClusters.ServiceArea, "SelectAreas", { newAreas: convertAreas( data ) } );
                }
                sendDeviceCommand( MatterClusters.RvcRunMode, "ChangeToMode", { newMode: 1 } );
                break;
            case "rvc.stop":
                sendDeviceCommand( MatterClusters.RvcRunMode, "ChangeToMode", { newMode: 0 });
                break;
            case "rvc.gohome":
                sendDeviceCommand( MatterClusters.RvcOperationalState, "GoHome" );
                break;
            case "rvc.pause":
                sendDeviceCommand( MatterClusters.RvcOperationalState, "Pause" );
                break;
            case "rvc.resume":
                sendDeviceCommand( MatterClusters.RvcOperationalState, "Resume" );
                break;
            case "rvc.selectareas":
                sendDeviceCommand( MatterClusters.ServiceArea, "SelectAreas", { newAreas: convertAreas( data ) } );
                break;
            case "windowcovering.open":
                sendDeviceCommand( MatterClusters.WindowCovering, "UpOrOpen" );
                break;
            case "windowcovering.close":
                sendDeviceCommand( MatterClusters.WindowCovering, "DownOrClose" );
                break;
            case "windowcovering.stop":
                sendDeviceCommand( MatterClusters.WindowCovering, "StopMotion" );
                break;
            case "windowcovering.gotolift":
                sendDeviceCommand( MatterClusters.WindowCovering, "GoToLiftPercentage", { liftPercent100thsValue: (100-data)*100 } );
                break;
            default:
                throw new Error( "not implemented "+command );
        }
    }
}

// Export

module.exports = MatterData;
