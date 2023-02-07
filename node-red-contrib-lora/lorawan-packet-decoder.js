module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );

    function lorawandecode(config)
    {
        RED.nodes.createNode( this, config );
        var node     = this;
        var context  = this.context();
        var flow     = this.context().flow;
        this.keyconf = RED.nodes.getNode( config.keys );
        this.txdelay = parseInt( config.txdelay );

        node.on('input',function(msg,send,done) {
            if( msg.payload !== undefined && msg.payload.data !== undefined && msg.payload.data.length >= 7 )
            {
                if( msg.payload.time === undefined )
                {
                    msg.payload.time = Date.now();
                }
                const packet = lora_packet.fromWire( new Buffer( msg.payload.data, 'base64' ) );
                if( packet.getBuffers().DevAddr === undefined )
                {
                    //node.error("DevAddr === undefined");
                    done();
                    return;
                }
                msg.payload = {
                    rxpk:           msg.payload,
                    device_address: packet.getBuffers().DevAddr.toString( 'hex' ),
                    frame_count:    packet.getFCnt(),
                    port:           packet.getFPort(),
                    mtype:          packet.getMType(),
                    confirmed:      packet.isConfirmed()
                };
                const key = node.keyconf.getKey( msg.payload.device_address );
                if( key )
                {
                    const nsw = Buffer.from( key.nsw, 'hex' );
                    let counters = context.get( "counters" ) ?? {};
                    let countMsb = counters?.[msg.payload.device_address] ?? 0;
                    let countBuf = undefined;
                    while( countMsb <= 1000 )
                    {
                        countBuf = Buffer.from( [countMsb&0xFF,(countMsb&0xFF00)>>8] );
                        if( lora_packet.verifyMIC( packet, nsw, null, countBuf ) )
                        {
                            break;
                        }
                        countMsb++;
                        countBuf = undefined;
                    }
                    if( countBuf !== undefined )
                    {
                        counters[msg.payload.device_address] = countMsb;
                        context.set( "counters", counters );
                        let sendMsgs     = flow.get( "sendqueue" )?.[msg.payload.device_address];
                        const sendMsg    = Array.isArray( sendMsgs ) ? sendMsgs.shift() : null;
                        let confirmMsg   = null;
                        let restartMsg   = null;
                        msg.topic        = key.name;
                        msg.payload.type = key.type;
                        msg.payload.name = key.name;
                        msg.payload.frame_count += countMsb<<16;
                        msg.payload.data = [...lora_packet.decrypt( packet, Buffer.from( key.asw, 'hex' ), nsw, countBuf )];
                        if( key.delta )
                        {
                            msg.payload.delta = key.delta;
                        }
                        if( key.timeout )
                        {
                            msg.timeout = key.timeout;
                        }
                        if( msg.payload.confirmed || sendMsg )
                        {
                            confirmMsg = {
                                topic:  msg.topic,
                                payload:{
                                    device_address:msg.payload.device_address,
                                    tmst:          ( msg.payload.rxpk.tmst + node.txdelay ) >>> 0, // 1s delay [µs] as UInt32
                                    rfch:          msg.payload.rxpk.rfch,
                                    freq:          msg.payload.rxpk.freq,
                                    modu:          msg.payload.rxpk.modu,
                                    datr:          msg.payload.rxpk.datr,
                                    codr:          msg.payload.rxpk.codr,
                                    data:          sendMsg ? sendMsg : [],
                                    port:          msg.payload.port,
                                    ack:           msg.payload.confirmed
                                }
                            };
                        }
                        node.status( msg.topic );
                        send( [msg,null,confirmMsg,restartMsg] );
                        done();
                    }
                    else
                    {
                        done( "MIC check failed! Raw packet: "+packet );
                    }
                }
                else
                {
                    //node.warn( "unknown deviceid: "+msg.payload.device_address );
                    send( [null,msg,null,null] );
                    done();
                }
            }
            else
            {
                done( "invalid message received" );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-decoder", lorawandecode );
};
