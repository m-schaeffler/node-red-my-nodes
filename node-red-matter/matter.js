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

class AirQualityEnum {
    static 0 = "Unknown";
    static 1 = "Good";
    static 2 = "Fair";
    static 3 = "Moderate";
    static 4 = "Poor";
    static 5 = "VeryPoor";
    static 6 = "ExtremelyPoor";
}
Object.freeze(AirQualityEnum)

class MeasurementUnitEnum {
    static 0 = "ppm";   // Parts per Million (106) MEA
    static 1 = "ppb";   // Parts per Billion (109) MEA
    static 2 = "ppt";   // Parts per Trillion (1012) MEA
    static 3 = "mg/m³"; // Milligram per m3 MEA
    static 4 = "µg/m³"; // Microgram per m3 MEA
    static 5 = "ng/m³"; // Nanogram per m3 MEA
    static 6 = "1/m³";  // Particles per m3 MEA
    static 7 = "Bq/m³"; // Becquerel per m3
}
Object.freeze(MeasurementUnitEnum)

// LUTs

class MatterClusters {
    static OnOff               = 0x0006;
    static LevelControl        = 0x0008;
    static TimeSynchronization = 0x0038;
    static RvcRunMode          = 0x0054;
    static RvcOperationalState = 0x0061;
    static WindowCovering      = 0x0102;
    static ServiceArea         = 0x0150;
}
Object.freeze(MatterClusters);

// MatterData

class MatterData {
    constructor(sendCallback)
    {
        this._dataById = {};
        this._namesLut = {};
        this._changed  = {};
        this.sendCommandCallback = sendCallback;
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
                case "56": // TimeSynchronization
                    item.timeSync = true;
                    break;
                case "69": // BooleanStateswitch( attribute )
                    switch( attribute )
                    {
                        case "0": // StateValue
                            setDataValue( "sensor", value );
                            break;
                    }
                    break;
                case "70": // Icd Management
                    item.icd = true;
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
                case "91": // AirQuality
                    switch( attribute )
                    {
                        case "0": // AirQuality
                            setDataValue( "airQuality", AirQualityEnum[value] );
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
                            setDataValue( "stateErrors", convertErrors( value ) );
                            break;
                    }
                    break;
                case "128": // Boolean State Configuration
                    switch( attribute )
                    {
                        case "7": // Sensor­Fault
                            setDataValue( "sensorErrors", value ? ["GeneralFault"] : [] );
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
                case "1026": // TemperatureMeasurement
                    switch( attribute )
                    {
                        case "0": // MeasuredValue
                            setDataValue( "temperature", value !== null ? value / 100 : null );
                            break;
                    }
                    break;
                case "1029": // RelativeHumidityMeasurement
                    switch( attribute )
                    {
                        case "0": // MeasuredValue
                            setDataValue( "humidity", value !== null ? value / 100 : null );
                            break;
                    }
                    break;
                case "1036": // Carbon Monoxide Concentration Measurement
                    switch( attribute )
                    {
                        case "0": // MeasuredValue
                            setDataValue( "CO", value );
                            break;
                        case "8": // MeasurementUnit
                            setDataValue( "CO_unit", MeasurementUnitEnum[value] );
                            break;
                    }
                    break;
                case "1037": // CarbonDioxideConcentrationMeasurement
                    switch( attribute )
                    {
                        case "0": // MeasuredValue
                            setDataValue( "CO_2", value );
                            break;
                        case "8": // MeasurementUnit
                            setDataValue( "CO_2_unit", MeasurementUnitEnum[value] );
                            break;
                    }
                    break;
                case "1066": // PM2.5 Concentration Measurement
                    switch( attribute )
                    {
                        case "0": // MeasuredValue
                            setDataValue( "pm25", value );
                            break;
                        case "8": // MeasurementUnit
                            setDataValue( "pm25_unit", MeasurementUnitEnum[value] );
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
        switch( data.cluster_id )
        {
            case 40:
            case 51:
            case 56:
            case 145:
                break;
            default:
                console.log(data);
        }
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

    sendChanged(sendData,sendTimeout)
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
                    sendTimeout( n.name );
                }
            }
        }
    }

    sendDeviceCommand(node,endpoint,cluster,command,data={})
    {
        this.sendCommandCallback( "device_command", command, {
            "node_id":      node,
            "endpoint_id":  endpoint,
            "cluster_id":   cluster,
            "command_name": command,
            "payload":      data
        } );
    }

    sendCommand(topic,command,data)
    {
        const id = this._namesLut[topic];
        if( id === undefined )
        {
            throw new Error( "unknown node " + topic );
        }
        const internal = this._dataById[id.node].internal[id.endpoint];

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
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.OnOff, "On" );
                break;
            case "onoff.off":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.OnOff, "Off" );
                break;
            case "onoff.toggle":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.OnOff, "Toggle" );
                break;
            case "levelcontrol.movetolevel":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.LevelControl, "MoveToLevel", data );
                break;
            case "rvc.clean":
                if( data != null )
                {
                    this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.ServiceArea, "SelectAreas", { newAreas: convertAreas( data ) } );
                }
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.RvcRunMode, "ChangeToMode", { newMode: 1 } );
                break;
            case "rvc.stop":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.RvcRunMode, "ChangeToMode", { newMode: 0 });
                break;
            case "rvc.gohome":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.RvcOperationalState, "GoHome" );
                break;
            case "rvc.pause":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.RvcOperationalState, "Pause" );
                break;
            case "rvc.resume":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.RvcOperationalState, "Resume" );
                break;
            case "rvc.selectareas":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.ServiceArea, "SelectAreas", { newAreas: convertAreas( data ) } );
                break;
            case "windowcovering.open":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.WindowCovering, "UpOrOpen" );
                break;
            case "windowcovering.close":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.WindowCovering, "DownOrClose" );
                break;
            case "windowcovering.stop":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.WindowCovering, "StopMotion" );
                break;
            case "windowcovering.gotolift":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.WindowCovering, "GoToLiftPercentage", { liftPercent100thsValue: (100-data)*100 } );
                break;
            default:
                throw new Error( "not implemented "+command );
        }
    }

    timeSync()
    {
        const now        = Temporal.Now.zonedDateTimeISO();
        const epoch      = Temporal.ZonedDateTime.from({year:2000,month:1,day:1,timeZone:'utc'});
        const utc        = Math.round( now.since( epoch ).total( "microseconds" ) );
        const far_future = Math.round( now.add({ years:1 }).since( epoch ).total( "microseconds" ) );
        const utc_offset = Math.round( Temporal.Now.zonedDateTimeISO().offsetNanoseconds / 1_000_000_000 );
        const dst_offset = 0
        const tz_list    = [{ offset: utc_offset, validAt: 0 }];
        const dst_list   = [{ offset: dst_offset, validStarting: 0, validUntil: far_future }];
        for( const i in this._dataById )
        {
            const n = this._dataById[i];
            if( n.timeSync )
            {
                console.log("time sync",n.name)
                // Set TimeZone FIRST
                this.sendDeviceCommand( i, 0, MatterClusters.TimeSynchronization, "SetTimeZone", { timeZone:tz_list } );
                // Set DST Offset SECOND
                this.sendDeviceCommand( i, 0, MatterClusters.TimeSynchronization, "SetDSTOffset", { dstOffset:dst_list } );
                // Set UTC Time LAST
                this.sendDeviceCommand( i, 0, MatterClusters.TimeSynchronization, "SetUTCTime", { utcTime:utc, granularity:4 } );
            }
        }
    }
}

// Export

module.exports = MatterData;
