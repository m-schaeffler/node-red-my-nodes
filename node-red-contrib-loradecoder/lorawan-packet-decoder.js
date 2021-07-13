module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );
    
    function lorawandecode(config)
    {
        RED.nodes.createNode( this, config );
        var node = this;

        node.on('input',function(msg) {
            if( msg.payload !== undefined && msg.payload.data !== undefined && msg.payload.data.length > 1 )
            {
                const NwkSKey = new Buffer(config.nsw, 'hex');
                const AppSKey = new Buffer(config.asw, 'hex');
                let packet = lora_packet.fromWire( new Buffer( msg.payload.data, 'base64' ) );
                msg.payload = { rxpk:            msg.payload,
                                device_address:  packet.getBuffers().DevAddr.toString( 'hex' ),
                                frame_count:     packet.getFCnt(),
                                port:            packet.getFPort() };
                msg.topic = msg.payload.device_address;
                if( lora_packet.verifyMIC( packet, NwkSKey ) )
                {
                    msg.payload.data = lora_packet.decrypt( packet, AppSKey, NwkSKey );
                    //msg.payload.buffers = packet.getBuffers();
                    node.status( msg.topic );
                    node.send( msg );
                }
                else
                {
                    this.error( "Network Key issue! Raw packet: "+packet );
                    node.send( null );
                }
            }
            else
            {
                node.send( null );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-decoder", lorawandecode );
};
