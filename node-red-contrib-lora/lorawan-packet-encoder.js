module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );

    function lorawanencode(config)
    {
        RED.nodes.createNode( this, config );
        var node     = this;
        var context  = this.context();
        this.keyconf = RED.nodes.getNode( config.keys );
        this.power   = parseInt( config.power );
        this.rfch    = config.rfch;

        node.on('input',function(msg,send,done) {
            let counters = context.get( "counters", "storeInFile" ) ?? {};
            switch( typeof( msg.framecounter ) )
            {
                case "undefined":
                    break;
                case "number":
                    context.set( "default", msg.framecounter );
                    break;
                case "object":
                    for( const i in msg.framecounter )
                    {
                        if( msg.framecounter[i] > counters[i]??0 )
                        {
                            counters[i] = msg.framecounter[i];
                        }
                    }
                    break;
                default:
                    node.error( "invalid type of framecouter: "+typeof( msg.framecounter ) );
            }
            if( "payload" in msg )
            {
                let counter = counters?.[msg.payload.device_address] ?? ( context.get( "default" ) ?? 0 );
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
                const key = node.keyconf.getKey( msg.payload.device_address );
                if( key )
                {
                    counters[msg.payload.device_address] = counter;
                    const packet = lora_packet.fromFields( lora, Buffer.from( key.asw, 'hex' ), Buffer.from( key.nsw, 'hex' ));
                    const data   = packet.getPHYPayload();
                    let   txpk   = {
                        //tmst: msg.payload.tmst,
                        freq: msg.payload?.freq ?? 869.525,
                        powe: node.power,
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
                    switch( this.rfch )
                    {
                       case "0": txpk.rfch = 0; break;
                       case "1": txpk.rfch = 1; break;
                       case "P": txpk.rfch = msg.payload.rfch; break;
                       case "N": break;
                    }
                    node.status( key.name );
                    send( [ { topic:key.name, payload:{ txpk:txpk } }, { topic:"framecounter", payload:counters } ] );
                }
                else
                {
                    node.warn( "unknown deviceid: "+msg.payload.device_address );
                }
            }
            context.set( "counters", counters, "storeInFile" );
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-encoder", lorawanencode );
};
