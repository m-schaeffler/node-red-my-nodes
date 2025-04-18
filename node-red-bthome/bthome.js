class Rawdata {
    constructor(input)
    {
        this._data = input;
    }
    _utoi(num,bits)
    {
        const mask = 1 << ( bits - 1 );
        return num & mask ? num - ( 1 << bits ) : num;
    }
    getUInt8()
    {
        return this._data.shift();
    }
    getInt8()
    {
        return this._utoi( this.getUInt8(), 8 );
    }
    getUInt16()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        return 0xffff & ( ( b << 8 ) | a );
    }
    getInt16()
    {
        return this._utoi( this.getUInt16(), 16 );
    }
    getUInt24()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        const c = this._data.shift();
        return 0xffffff & ( ( c << 16 ) | ( b << 8 ) | a );
    }
    getInt24()
    {
        return this._utoi( this.getUInt24(), 24 );
    }
    getUInt32()
    {
        const a = this._data.shift();
        const b = this._data.shift();
        const c = this._data.shift();
        const d = this._data.shift();
        return 0xffffffff & ( ( d << 24 ) | ( c << 16 ) | ( b << 8 ) | a );
    }
    getInt32()
    {
        return this._utoi( this.getUInt32(), 32 );
    }
    getEnum(values)
    {
        return values[this.getUInt8()] ?? "";
    }
}

class BtEvent {
    constructor()
    {
        this._events = {};
    }
    pushEvent(type,event)
    {
        switch( typeof this._events[type] )
        {
            case "undefined":
                this._events[type] = event;
                break;
            case "string":
                this._events[type] = [this._events[type]];
                // fall through
            case "object":
                this._events[type].push( event );
                break;
        }
    }
    eventMessages()
    {
        let result = [];
        for( const t in this._events )
        {
            const event = this._events[t];
            if( typeof event == "string" )
            {
                if( event )
                {
                    result.push( { topic: `Event/${name}/${event}`, payload: { type: t, event: event } } );
                }
            }
            else
            {
                for( const i in event )
                {
                    if( event[i] )
                    {
                        const index = Number( i ) + 1;
                        result.push( { topic: `Event/${name}/${index}/${event[i]}`, payload: { type: t, id: index, event: event[i] } } );
                    }
                }
            }
        }
    }
}

module.exports = function(RED) {

    function BtHomeNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.devices      = JSON.parse( config.devices ?? "{}" );
        this.contextVar   = config.contextVar ?? "bthome";
        this.contextStore = config.contextStore ?? "none";
        this.data         = {};
        node.status( "" );
        if( node.contextStore !== "none" )
        {
            node.flowcontext.get( node.contextVar, node.contextStore, function(err,value)
            {
                if( err )
                {
                    node.error( err );
                }
                else
                {
                    console.log( "context read", value );
                    if( value !== undefined )
                    {
                        node.data = value;
                    }
                }
            } );
        }
        for( const mac in node.devices )
        {
            const device = node.devices[mac];
            switch( typeof device.key )
            {
                case "undefined":
                    break;
                case "string":
                    if( device.key.length == 32 )
                    {
                        const buf = Buffer.alloc( 16 );
                        for( let i=0; i<16 ; i++ )
                        {
                            buf[i] = Number.parseInt( device.key.slice( i*2, i*2 + 2 ), 16 );
                        }
                        device.key = buf;
                    }
                    else
                    {
                        device.key = Buffer.alloc( 16 );
                        console.log( mac + " keylength must be 16 bytes" );
                    }
                    break;
                default:
                    device.key = Buffer.from( device.key );
            }
        }

        node.on('input', function(msg,send,done) {

            function checkMsg()
            {
                if( name === undefined )
                {
                    node.error( "unknown BT-Home " + msg.payload.addr );
                }
                else if( ! Array.isArray( msg.payload.data ) )
                {
                    node.error( "msg.payload.data must be an Array!" );
                }
                else if( version !== 2 )
                {
                    node.error( "wrong BT-Home version " + version );
                }
                else if( encrypted && !node.devices[msg.payload.addr].key )
                {
                    node.error( name + " encryption key needed" );
                }
                else if( (!encrypted) && node.devices[msg.payload.addr].key )
                {
                    node.error( name + " encrypted messages needed" );
                }
                else
                {
                    return true;
                }
                return false;
            }

            function decryptMsg()
            {
                console.log("encrypted");
            }

            function decodeMsg()
            {
                rawdata = new Rawdata( rawdata );
            }

            const name      = node.devices[msg?.payload.addr].topic;
            const dib       = msg.payload.data[0];
            let   rawdata   = msg.payload.data.slice( 1 );
            const encrypted = Boolean( dib & 0x1 );
            const version   = dib >> 5;
            if( checkMsg() )
            {
                if( encrypted )
                {
                    decyrptMsg();
                    done();return;
                }
                let pid    = null;
                let events = new BtEvent();
                let item   = node.data[name];
                if( item == undefined )
                {
                    item = { pid: null, gw: {} };
                    node.data[name] = item;
                }
                decodeMsg();
                checkPid();
                if( pid !== item.pid )
                {
                    if( node.contextStore !== "none" )
                    {
                        node.flowcontext.set( node.contextVar, node.data, node.contextStore );
                    }
                    send( [
                        item.data ? { topic:name, payload:item.data } : null,
                        null
                    ] );
                }
            }
            done();
        });
    }

    RED.nodes.registerType("bthome",BtHomeNode);
}
