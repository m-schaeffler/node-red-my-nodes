module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );
    
    function lorawandecode(config)
    {
        RED.nodes.createNode( this, config );
        var   node = this;
        const keys = JSON.parse( config.keys );

        node.on('input',function(msg) {
            if( msg.payload !== undefined && msg.payload.data !== undefined && msg.payload.data.length > 1 )
            {
                const packet = lora_packet.fromWire( new Buffer( msg.payload.data, 'base64' ) );
                msg.payload = { rxpk:            msg.payload,
                                device_address:  packet.getBuffers().DevAddr.toString( 'hex' ),
                                frame_count:     packet.getFCnt(),
                                port:            packet.getFPort() };
                msg.topic = msg.payload.device_address;
                const key = keys[msg.payload.device_address];
                if( key )
                {
                    const nsw = Buffer.from( key.nsw, 'hex' );
                    if( lora_packet.verifyMIC( packet, nsw ) )
                    {
                        msg.payload.data = lora_packet.decrypt( packet, Buffer.from( key.asw, 'hex' ), nsw );
                        node.status( msg.topic );
                        node.send( msg );
                    }
                    else
                    {
                        node.error( "MIC check failed! Raw packet: "+packet );
                    }
                }
                else
                {
                    node.warn( "unknown deviceid: "+msg.payload.device_address );
                }
            }
            else
            {
                node.warn( "invalid message received" );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-decoder", lorawandecode );
};
