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

//

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
    }

    setAttribute(id,attr,value)
    {
        this._dataById[id].time = Temporal.Now.instant().epochMilliseconds;
        this._doSetAttribute( id, attr, value );
        this._changed[id] = true;
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
}

// Export

module.exports = MatterData;
