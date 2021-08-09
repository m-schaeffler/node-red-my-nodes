module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );
    
    function lorawandecode(config)
    {
        RED.nodes.createNode( this, config );
        var   node    = this;
        const keyconf = RED.nodes.getNode( config.keys );

        node.on('input',function(msg) {
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
                    return;
                }
                msg.payload = { rxpk:            msg.payload,
                                device_address:  packet.getBuffers().DevAddr.toString( 'hex' ),
                                frame_count:     packet.getFCnt(),
                                port:            packet.getFPort() };
                const key = keyconf.getKey( msg.payload.device_address );
                if( key )
                {
                    const nsw = Buffer.from( key.nsw, 'hex' );
                    if( lora_packet.verifyMIC( packet, nsw ) )
                    {
                        msg.topic        = key.name;
                        msg.payload.type = key.type;
                        msg.payload.name = key.name;
                        msg.payload.data = [...lora_packet.decrypt( packet, Buffer.from( key.asw, 'hex' ), nsw )];
                        if( key.timeout )
                        {
                            msg.timeout = key.timeout;
                        }
                        node.status( msg.topic );
                        node.send( [msg,null] );
                    }
                    else
                    {
                        node.error( "MIC check failed! Raw packet: "+packet );
                    }
                }
                else
                {
                    node.warn( "unknown deviceid: "+msg.payload.device_address );
                    node.send( [null,msg] );
                }
            }
            else
            {
                node.error( "invalid message received" );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-decoder", lorawandecode );
};
