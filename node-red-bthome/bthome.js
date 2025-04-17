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
            console.log(node.data)
            node.data[msg.topic] = msg.payload;
            if( node.contextStore !== "none" )
            {
                node.flowcontext.set( node.contextVar, node.data, node.contextStore );
            }
            send( {topic:"bthome",payload:node.data} )
            done();
        });
    }

    RED.nodes.registerType("bthome",BtHomeNode);
}
