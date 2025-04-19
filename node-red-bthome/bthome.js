const Crypto  = require('node:crypto');
const Rawdata = require("./rawdata.js");
const BtEvent = require("./btevent.js");

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
                        node.log( mac + " keylength must be 16 bytes" );
                    }
                    break;
                default:
                    device.key = Buffer.from( device.key );
            }
        }

        node.on('input', function(msg,send,done) {
            if( ! Array.isArray( msg.payload.data ) )
            {
                node.error( "msg.payload.data must be an Array!" );
                node.trace("msg processed");
                done();
                return;
            }

            function checkMsg()
            {
                if( name === undefined )
                {
                    node.error( "unknown BT-Home " + msg.payload.addr );
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

            function checkPid()
            {
                if( pid < item.pid && pid > 10 && pid > item.pid - 10 )
                {
                    // veraltete Nachricht und nicht reboot
                    node.warn( `old ble message (${name}) dropped, ${msg.payload.pid} < ${item.data?.pid}` );
                    return false;
                }
                if( msg.payload.gateway )
                {
                    item.gw[msg.payload.gateway] = {
                        time: msg.payload.time ?? Date.now(),
                        rssi: msg.payload.rssi ?? null
                    };
                }
                return pid !== null && pid !== item.pid;
            }

            function newMessage()
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

            const name      = node.devices[msg.payload.addr]?.topic;
            const dib       = msg.payload.data[0];
            let   rawdata   = msg.payload.data.slice( 1 );
            const encrypted = Boolean( dib & 0x1 );
            const version   = dib >> 5;
            let   pid       = null;
            const events    = new BtEvent();
            let   item      = node.data[name];

            if( checkMsg() )
            {
                if( encrypted )
                {
                    decyrptMsg();
                    done();return;
                }
                if( item == undefined )
                {
                    item = { pid: null, gw: {} };
                    node.data[name] = item;
                }
                decodeMsg();
                if( checkPid() )
                {
                    newMessage();
                }
            }
            node.trace("msg processed");
            done();
        });
    }

    RED.nodes.registerType("bthome",BtHomeNode);
}
