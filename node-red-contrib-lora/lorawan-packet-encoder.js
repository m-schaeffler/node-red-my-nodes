module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );

    function lorawanencode(config)
    {
        RED.nodes.createNode( this, config );
        var   node    = this;
        var   context = this.context();
        const keyconf = RED.nodes.getNode( config.keys );
        const power   = parseInt( config.power );

        node.on('input',function(msg,send,done) {
            let counter = "framecounter" in msg ? msg.framecounter : context.get( "frameCounter" ) ?? 0;
            if( "payload" in msg )
            {
                if( ++counter > 0xFFFF )
                {
                    counter = 0;
                }
                if( ! Buffer.isBuffer( msg.payload.data ) )
                {
                    msg.payload.data = Buffer.from( msg.payload.data );
                }
                const lora = {
                    MType:   "Unconfirmed Data Down",
                    DevAddr: Buffer.from(msg.payload.device_address,"hex"),
                    FCnt:    counter,
                    FPort:   msg.payload.port,
                    FCtrl:   {
                        ACK:      msg.payload?.ack      ?? false,
                        FPending: msg.payload?.fpending ?? false
                    },
                    payload: msg.payload.data
                };
                //node.warn( lora );
                const key = keyconf.getKey( msg.payload.device_address );
                if( key )
                {
                    const packet = lora_packet.fromFields( lora, Buffer.from( key.asw, 'hex' ), Buffer.from( key.nsw, 'hex' ));
                    const data   = packet.getPHYPayload();
                    let   txpk   = {
                        //tmst: msg.payload.tmst,
                        freq: msg.payload?.freq ?? 869.525,
                        rfch: msg.payload?.rfch ?? 1,
                        powe: power,
                        modu: msg.payload?.modu ?? "LORA",
                        datr: msg.payload?.datr ?? "SF7BW125",
                        codr: msg.payload?.codr ?? "4/5",
                        ipol: true,
                        size: data.length,
                        data: data.toString('Base64')
                    };
                    if( "tmst" in msg.payload )
                    {
                        txpk.tmst = msg.payload.tmst;
                    }
                    else
                    {
                        txpk.imme = true;
                    }
                    node.status( key.name );
                    send( [ { topic:key.name, payload:{ txpk:txpk } }, { topic:"FrameCounter", payload:counter }  ] );
                }
                else
                {
                    node.warn( "unknown deviceid: "+msg.payload.device_address );
                }
            }
            context.set( "frameCounter", counter );
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-encoder", lorawanencode );
};
