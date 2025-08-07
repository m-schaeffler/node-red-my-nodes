const Crypto  = require( 'node:crypto' );
const Tools   = require( './tools.js' );
const Rawdata = require( "./rawdata.js" );
const BtEvent = require( "./btevent.js" );

class TypeIds {
    static bluDW     = 0x0202;
    static bluRemote = 9;
}
Object.freeze( TypeIds );

module.exports = function(RED) {

    function BtHomeNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.devices      = JSON.parse( config.devices ?? "{}" );
        this.counterMode  = config.counterMode  ?? "none";
        this.statusPrefix = config.statusPrefix ? config.statusPrefix+'/' : "";
        this.eventPrefix  = config.eventPrefix  ? config.eventPrefix +'/' : "";
        this.contextVar   = config.contextVar   ?? "bthome";
        this.contextStore = config.contextStore ?? "none";
        this.batteryState = Boolean( config.batteryState );
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
            if( msg.resync )
            {
                for( const t in node.data )
                {
                    node.data[t].pid = null;
                }
                if( node.contextStore !== "none" )
                {
                    node.flowcontext.set( node.contextVar, node.data, node.contextStore );
                }
                done();
                return;
            }
            if( ! Array.isArray( msg.payload?.data ) )
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

            function decodeMsg()
            {
                let counter = {};

                function setData(name,value)
                {
                    if( item.data === undefined )
                    {
                        item.data = {};
                    }
                    switch( counter[name] )
                    {
                        case undefined:
                            counter[name] = 1;
                            item.data[name] = value;
                            break;
                        case 1:
                            item.data[name] = [ item.data[name] ];
                            // fall through
                        case 2:
                        case 3:
                        case 4:
                            counter[name]++;
                            item.data[name].push( value );
                            break;
                    }
                }

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
                            if( node.batteryState )
                            {
                                setData( "battery", rawdata.getUInt8() );
                                delete item.battery;
                            }
                            else
                            {
                                item.battery = rawdata.getUInt8();
                                delete item.data?.battery;
                            }
                            break;
                        case 0x04:
                            setData( "pressure", rawdata.getUInt24() * 0.01 );
                            break;
                        case 0x05:
                            setData( "lux", rawdata.getUInt24() * 0.01 );
                            break;
                        case 0x08:
                            setData( "dewpoint", rawdata.getInt16() * 0.01 );
                            break;
                        case 0x0C:
                            if( node.batteryState )
                            {
                                setData( "voltage", rawdata.getUInt16() * 0.001 );
                                delete item.voltage;
                            }
                            else
                            {
                                item.voltage = rawdata.getUInt16() * 0.001;
                                delete item.data?.voltage;
                            }
                            break;
                        case 0x20:
                            setData( "moisture", Boolean( rawdata.getUInt8() ) );
                            break;
                        case 0x21:
                            events.pushEvent( "motion", rawdata.getEnum( ["","motion"] ) );
                            break;
                        case 0x2C:
                            setData( "vibration", Boolean( rawdata.getUInt8() ) );
                            break;
                        case 0x2D:
                          {
                            let state = rawdata.getUInt8();
                            if( item.typeId === TypeIds.bluDW )
                            {
                                state = Boolean( state );
                            }
                            setData( "state", state );
                            break;
                          }
                        case 0x2E:
                            setData( "humidity", rawdata.getUInt8() );
                            break;
                        case 0x3A:
                            events.pushEvent( "button", rawdata.getEnum( ["","S","SS","SSS","L"] ) );
                            break;
                        case 0x3C:
                          {
                            const dimmer = rawdata.getUInt8();
                            const data   = rawdata.getUInt8();
                            events.pushEvent( "dimmer", "dimmer", dimmer==1 ? data : -data );
                            break;
                          }
                        case 0x3F:
                            setData( "tilt", rawdata.getInt16() * 0.1 );
                            break;
                        case 0x40:
                          {
                            const distance = rawdata.getUInt16();
                            setData( "distance", distance != 0 ? distance : null );
                            break;
                          }
                        case 0x44:
                            setData( "wind", rawdata.getUInt16() * 0.01 );
                            break;
                        case 0x45:
                            setData( "temperature", rawdata.getInt16() * 0.1 );
                            break;
                        case 0x46:
                            setData( "uv", rawdata.getUInt8() * 0.1 );
                            break;
                        case 0x59:
                            setData( "count", rawdata.getInt8() );
                            break;
                        case 0x5E:
                            setData( "direction", rawdata.getUInt16() * 0.01 );
                            break;
                        case 0x5F:
                            setData( "precipitation", rawdata.getUInt16() * 0.1 );
                            break;
                        case 0x60:
                            setData( "channel", rawdata.getUInt8() + 1 );
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
                if( item.typeId === TypeIds.bluRemote && item.data?.tilt )
                {
                    events.pushEvent( "rotation", "rotation", item.data.tilt );
                    delete item.data.tilt;
                }
            }

            function checkPid()
            {
                if( pid < item.pid && pid > 10 /*&& pid > item.pid - 10*/ )
                {
                    // veraltete Nachricht und nicht reboot
                    node.statistics.old++;
                    node.warn( `old ble message ${name} dropped, ${pid} < ${item.pid}` );
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
                    events.eventMessages( name, item.data?.channel ?? null )
                ] );
            }

            const name      = node.devices[msg.payload.addr]?.topic;
            const msgTime   = msg.payload.time ?? Date.now()
            const dib       = msg.payload.data[0];
            let   rawdata   = msg.payload.data.slice( 1 );
            const encrypted = Boolean( dib & 0x1 );
            const version   = dib >> 5;
            let   pid       = null;
            let   item      = node.data[name];
            let   events;

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
                events = new BtEvent( node.eventPrefix, item );
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
