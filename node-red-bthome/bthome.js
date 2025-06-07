const Crypto  = require( 'node:crypto' );
const Tools   = require( './tools.js' );
const Rawdata = require( "./rawdata.js" );
const BtEvent = require( "./btevent.js" );

module.exports = function(RED) {

    function BtHomeNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.devices      = JSON.parse( config.devices ?? "{}" );
        this.counterMode  = config.counterMode ?? "none";
        this.statusPrefix = config.statusPrefix ? config.statusPrefix+'/' : "";
        this.eventPrefix  = config.eventPrefix  ? config.eventPrefix +'/' : "";
        this.contextVar   = config.contextVar   ?? "bthome";
        this.contextStore = config.contextStore ?? "none";
        this.data         = {};
        this.statistics   = { ok:0, dup:0, old:0, err:0 };
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
                    //console.log( "context read", value );
                    if( value !== undefined )
                    {
                        node.data = value;
                    }
                }
            } );
            node.flowcontext.set( node.contextVar+"-stat", node.statistics );
        }
        for( const mac in node.devices )
        {
            const device = node.devices[mac];
            try
            {
                device.key = Tools.key2bytes( device.key );
            }
            catch( e )
            {
                node.log( mac + e.message );
                device.key = null;
            }
        }

        node.on('input', function(msg,send,done) {
            if( ! Array.isArray( msg.payload.data ) )
            {
                node.statistics.err++;
                done( "msg.payload.data must be an Array!" );
                return;
            }

            function checkMsg()
            {
                if( name === undefined )
                {
                    throw new Error( "unknown BT-Home " + msg.payload.addr );
                }
                else if( version !== 2 )
                {
                    throw new Error( "wrong BT-Home version " + version );
                }
                else if( encrypted && !node.devices[msg.payload.addr].key )
                {
                    throw new Error( name + " encryption key needed" );
                }
                else if( (!encrypted) && node.devices[msg.payload.addr].key )
                {
                    throw new Error( name + " encrypted messages needed" );
                }
            }

            function decryptMsg()
            {
                const mac        = Tools.mac2bytes( msg.payload.addr );
                const ciphertext = Buffer.from( rawdata.slice( 0, -8 ) );
                const counter    = rawdata.slice( -8, -4 );
                const counterInt = counter[0] | (counter[1]<<8) | (counter[2]<<16) | (counter[3]<<24);
                switch( node.counterMode )
                {
                    case "rising":
                        if( counterInt > ( item.lastCounter ?? -1 ) )
                        {
                            item.lastCounter = counterInt;
                        }
                        else
                        {
                            throw new Error( "bthome "+msg.payload.gateway+" "+name+" "+counterInt+" <= "+item.lastCounter );
                        }
                        break;
                    case "time":
                        const deltaTime = msgTime - counterInt*1000;
                        if( deltaTime > 30000 || deltaTime < -15000 )
                        {
                            throw new Error( "bthome "+msg.payload.gateway+" "+name+" "+(new Date(counterInt*1000))+" "+deltaTime );
                        }
                        break;
                }
                const mic        = Buffer.from( rawdata.slice( -4 ) );
                const nonce      = Buffer.from( mac.concat( Tools.uuid16, dib, counter ) );
                const decipher   = Crypto.createDecipheriv( "aes-128-ccm", node.devices[msg.payload.addr].key, nonce, { authTagLength: 4 } );
                decipher.setAuthTag( mic );
                rawdata = Array.from( decipher.update( ciphertext ) );
                decipher.final();
            }

            function setData(name,value)
            {
                if( item.data === undefined )
                {
                    item.data = {};
                }
                item.data[name] = value;
            }

            function decodeMsg()
            {
                rawdata = new Rawdata( rawdata );
                while( rawdata.length() > 0 )
                {
                    const id = rawdata.getUInt8();
                    switch( id )
                    {
                        case 0x00:
                            pid = rawdata.getUInt8();
                            break;
                        case 0x01:
                            item.battery = rawdata.getUInt8();
                            break;
                        case 0x05:
                            setData( "lux", rawdata.getUInt24() * 0.01 );
                            break;
                        case 0x21:
                            events.pushEvent( "motion", rawdata.getEnum( ["","motion"] ) );
                            break;
                        case 0x2C:
                            setData( "vibration", Boolean( rawdata.getUInt8() ) );
                            break;
                        case 0x2D:
                            let state = rawdata.getUInt8();
                            if( item.typeId === 0x0202 )
                            {
                                state = Boolean( state );
                            }
                            setData( "state", state );
                            break;
                        case 0x2E:
                            setData( "humidity", rawdata.getUInt8() );
                            break;
                        case 0x3A:
                            events.pushEvent( "button", rawdata.getEnum( ["","S","SS","SSS","L"] ) );
                            break;
                        case 0x3C:
                            {
                                const e = rawdata.getEnum( ["","Left","Right"] );
                                const d = rawdata.getUInt8();
                                events.pushEvent( "dimmer", e != "" ? e+d : "" );
                            }
                            break;
                        case 0x3F:
                            // 3 axis to be implemented
                            setData( "tilt", rawdata.getInt16() * 0.1 );
                            break;
                        case 0x40:
                            setData( "distance", rawdata.getUInt16() );
                            break;
                        case 0x45:
                            setData( "temperature", rawdata.getInt16() * 0.1 );
                            break;
                        case 0x60:
                            setData( "channel", rawdata.getUInt8() );
                            break;
                        case 0xF0:
                            item.typeId = rawdata.getUInt16();
                            break;
                        case 0xF1:
                            item.version = {
                                sub:   rawdata.getUInt8(),
                                patch: rawdata.getUInt8(),
                                minor: rawdata.getUInt8(),
                                major: rawdata.getUInt8()
                            };
                            break;
                        case 0xF2:
                            item.version = {
                                patch: rawdata.getUInt8(),
                                minor: rawdata.getUInt8(),
                                major: rawdata.getUInt8()
                            };
                            break;
                        default:
                            node.warn( "unknown BT-Home id " + id );
                            rawdata.reset();
                    }
                }
            }

            function checkPid()
            {
                if( pid < item.pid && pid > 10 /*&& pid > item.pid - 10*/ )
                {
                    // veraltete Nachricht und nicht reboot
                    node.statistics.old++;
                    node.warn( `old ble message ${name} from ${msg.payload.gateway} dropped, ${pid} < ${item.pid}` );
                    return false;
                }
                if( msg.payload.gateway )
                {
                    item.gw[msg.payload.gateway] = {
                        time: msgTime,
                        rssi: msg.payload.rssi ?? null
                    };
                }
                if( pid !== null && pid !== item.pid )
                {
                    node.statistics.ok++;
                    return true;
                }
                else
                {
                    node.statistics.dup++;
                    return false;
                }
            }

            function newMessage()
            {
                item.time      = msgTime;
                item.pid       = pid;
                item.encrypted = encrypted;
                if( node.contextStore !== "none" )
                {
                    node.flowcontext.set( node.contextVar, node.data, node.contextStore );
                }
                node.status( name );
                send( [
                    item.data ? { topic:node.statusPrefix+name, payload:item.data } : null,
                    events.eventMessages( name )
                ] );
            }

            const name      = node.devices[msg.payload.addr]?.topic;
            const msgTime   = msg.payload.time ?? Date.now()
            const dib       = msg.payload.data[0];
            let   rawdata   = msg.payload.data.slice( 1 );
            const encrypted = Boolean( dib & 0x1 );
            const version   = dib >> 5;
            let   pid       = null;
            const events    = new BtEvent( node.eventPrefix );
            let   item      = node.data[name];

            try
            {
                checkMsg();
                if( item == undefined )
                {
                    item = { pid: null, typeId: null, gw: {} };
                    node.data[name] = item;
                }
                if( encrypted )
                {
                    decryptMsg();
                }
                decodeMsg();
                if( checkPid() )
                {
                    newMessage();
                }
                done();
            }
            catch( e )
            {
                node.statistics.err++;
                done( e.message );
            }
        });
    }

    RED.nodes.registerType( "bthome", BtHomeNode );
}
