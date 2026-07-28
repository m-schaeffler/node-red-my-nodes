// Matter Enums

class ColorModeEnum {
    static 0 = "HueSaturation";
    static 1 = "XY";
    static 2 = "Temperature";
}
Object.freeze(ColorModeEnum);

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

// Events

class EventSwitchCluster {
    static 0 = "Changed";
    static 1 = "Pressed";
    static 2 = "LongPress";
    static 3 = "S";
    static 4 = "L";
    static 5 = "MultiPressOngoing";
    static 6 = "MultiPress";
}
Object.freeze(EventSwitchCluster);

// LUTs

class MatterClusters {
    static onoff               = 0x0006;
    static levelcontrol        = 0x0008;
    static timesynchronization = 0x0038;
    static rvcrunmode          = 0x0054;
    static rvccleanmode        = 0x0055;
    static rvcoperationalstate = 0x0061;
    static windowcovering      = 0x0102;
    static servicearea         = 0x0150;
    static colorcontrol        = 0x0300;
}
Object.freeze(MatterClusters);

// MatterData

class MatterData {
    constructor(sendCallback,dataCallback,eventCallback,onlineCallback)
    {
        this.sendCommandCallback = sendCallback;
        this.dataCallback        = dataCallback;
        this.eventCallback       = eventCallback;
        this.onlineCallback      = onlineCallback;
        this.clear();
    }

    clear()
    {
        this._dataById = {};
        this._namesLut = {};
    }

    _doSetAttribute(id,attr,value)
    {
        let item    = this._dataById[id];
        let changed = false;
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
                changed = true;
            }

            function setColorValue(name,value)
            {
                item.data[endpoint].color ??= { mode:null };
                item.data[endpoint].color[name] = value;
                changed = true;
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
                case "59": // Switch
                    switch( attribute )
                    {
                        case "1": // CurrentPosition
                            setDataValue( "input", value );
                            break;
                        case "65532": // FeatureMap
                            setDataValue( "inputType", value & 0x01 ? "switch" : "button" );
                            break;
                    }
                    break;
                case "69": // BooleanState
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
                case "768": // ColorControl
                    switch( attribute )
                    {
                        case "0": // CurrentHue
                            setColorValue( "hue", value * 360 / 254 );
                            break;
                        case "1": // CurrentSaturation
                            setColorValue( "saturation", value / 254 );
                            break;
                        case "3": // CurrentX
                            setColorValue( "x", value / 65536 );
                            break;
                        case "4": // CurrentY
                            setColorValue( "y", value / 65536 );
                            break;
                        case "7": // ColorTemperatureMireds
                            setColorValue( "temp", 1_000_000 / value );
                            break;
                        case "8": // ColorMode
                            setColorValue( "mode", ColorModeEnum[value] );
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
        return changed;
    }

    setAttribute(id,attr,value)
    {
        const n = this._dataById[id];
        n.time = Temporal.Now.instant().epochMilliseconds;
        if( this._doSetAttribute( id, attr, value ) )
        {
            for( const e in n.data )
            {
                this.dataCallback( n.internal[e].name, n.data[e] );
            }
        }
    }

    handleEvent(data)
    {
        switch( data.cluster_id )
        {
            case 40:  // BasicInformation
            case 51:  // GeneralDiagnostics
            case 56:  // TimeSynchronization
            case 145: // ElectricalEnergyMeasurement
                break;
            case 59: // Switch
                const name = this._dataById[data.node_id].internal[data.endpoint_id].name;
                switch( data.event_id )
                {
                    case 0: // SwitchLatched
                    case 1: // InitialPress
                    case 2: // LongPress
                        this.eventCallback( name, EventSwitchCluster[data.event_id], { pos: data.data.newPosition } );
                        break;
                    case 3: // ShortRelease
                    case 4: // LongRelease
                        this.eventCallback( name, EventSwitchCluster[data.event_id], { pos: data.data.previousPosition } );
                    	break;
                    case 5: // MultiPressOngoing
                        this.eventCallback( name, EventSwitchCluster[data.event_id], { pos: data.data.newPosition, count: data.data.currentNumberOfPressesCounted  } );
                        break;
                    case 6: // MultiPressComplete
                        this.eventCallback( name, EventSwitchCluster[data.event_id], { pos: data.data.previousPosition, count: data.data.totalNumberOfPressesCounted  } );
                        break;
                }
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
        help.location = n.attributes["0/40/6"];
        help.name     = help.label || help.model;
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
        for( const a in n.attributes )
        {
            this._doSetAttribute( n.node_id, a, n.attributes[a] );
        }
        this.onlineCallback( help.name, help.online );
        for( const e in help.data )
        {
            this.dataCallback( help.internal[e].name, help.data[e] );
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
            this.onlineCallback( this._dataById[id].name, false );
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

        switch( command.toLowerCase() )
        {
            case "levelcontrol.movetolevel":
                data.optionsMask     ??= 0x00;
                data.optionsOverride ??= 0x00;
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.levelcontrol, "MoveToLevel", data );
                break;
            case "colorcontrol.movetohueandsaturation":
                data.optionsMask     ??= 0x00;
                data.optionsOverride ??= 0x00;
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.colorcontrol, "MoveToHueAndSaturation", data );
                break;
            case "colorcontrol.movetocolor":
                data.optionsMask     ??= 0x00;
                data.optionsOverride ??= 0x00;
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.colorcontrol, "MoveToColor", data );
                break;
            case "colorcontrol.movetocolortemperature":
                data.optionsMask     ??= 0x00;
                data.optionsOverride ??= 0x00;
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.colorcontrol, "MoveToColorTemperature", data );
                break;
            case "rvc.clean":
                if( data != null )
                {
                    this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.servicearea, "SelectAreas", { newAreas: convertAreas( data ) } );
                }
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.rvcrunmode, "ChangeToMode", { newMode: 1 } );
                break;
            case "rvc.stop":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.rvcrunmode, "ChangeToMode", { newMode: 0 });
                break;
            case "rvc.selectareas":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.servicearea, "SelectAreas", { newAreas: convertAreas( data ) } );
                break;
            case "windowcovering.gotolift":
                this.sendDeviceCommand( id.node, id.endpoint, MatterClusters.windowcovering, "GoToLiftPercentage", { liftPercent100thsValue: (100-data)*100 } );
                break;
            default:
              {
                const [cluster,subcommand] = command.split( '.' );
                if( MatterClusters[cluster] )
                {
                    this.sendDeviceCommand( id.node, id.endpoint, MatterClusters[cluster], subcommand, data ?? {} );
                }
                else
                {
                    throw new Error( "cluster not implemented "+cluster );
                }
              }
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
                this.sendDeviceCommand( i, 0, MatterClusters.timesynchronization, "SetTimeZone", { timeZone:tz_list } );
                // Set DST Offset SECOND
                this.sendDeviceCommand( i, 0, MatterClusters.timesynchronization, "SetDSTOffset", { dstOffset:dst_list } );
                // Set UTC Time LAST
                this.sendDeviceCommand( i, 0, MatterClusters.timesynchronization, "SetUTCTime", { utcTime:utc, granularity:4 } );
            }
        }
    }
}

// Export

module.exports = MatterData;
