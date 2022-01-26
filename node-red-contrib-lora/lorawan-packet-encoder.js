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
        const storeName = config.storeName;

        node.on('input',function(msg,send,done) {
            let counter = context.get( "frameCounter", storeName ) ?? 0;
            if( ++counter > 0xFFFF )
            {
                counter = 0;
            }
            context.set( "frameCounter", counter, storeName );
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
                send( { topic:key.name, payload:{ txpk:txpk } } );
            }
            else
            {
                node.warn( "unknown deviceid: "+msg.payload.device_address );
            }
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-encoder", lorawanencode );
};
