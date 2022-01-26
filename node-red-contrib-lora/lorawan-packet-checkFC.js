module.exports = function(RED)
{
    function lorawancheckFC(config)
    {
        RED.nodes.createNode( this, config );
        var node    = this;
        var context = this.context();

        node.on('input',function(msg,send,done) {
            let dupMsg  = null;
            let missMsg = null;
            let errMsg  = null;
            let counter = context.get( "counter" ) ?? { ok:0, nok:0, miss:0, dup:0 };
            let data    = context.get( "data" ) ?? {};
            const item  = data[msg.topic];

            if( ( item === undefined ) ||                                                       // new sensor
                ((item+1 == msg.payload.frame_count) && (msg.payload.frame_count < item+25)) || // normal msg
                ((item > 0xFFFF - 25) && (msg.payload.frame_count<25)) ||                       // overflow
                ( msg.payload.frame_count == 0 ) )                                              // rebooted sensor
            {
                counter.ok++;
                data[msg.topic] = msg.payload.frame_count;
            }
            else if( (item < msg.payload.frame_count) && (msg.payload.frame_count < item+25) )
            {
                counter.miss++;
                missMsg = { topic:"LoRa missing frame", payload:`${msg.topic}: missing Frame; latest ${msg.payload.frame_count}, before ${item}` };
                msg.missing = msg.payload.frame_count - item - 1;
                data[msg.topic] = msg.payload.frame_count;
            }
            else if( (item == msg.payload.frame_count) && (msg.payload.frame_count < item+25) )
            {
                // same frame => deduplication
                counter.dup++;
                dupMsg = msg;
                msg    = null;
                dupMsg.duplicate = true;
            }
            else
            {
                counter.nok++;
                errMsg = { topic:"LoRa error", payload:`${msg.topic}: invalid Frame counter ${msg.payload.frame_count} last good ${item}` };
                msg    = null;
            }

            context.set( "counter", counter );
            context.set( "data", data );
            node.status( `${counter.ok} / ${counter.dup} / ${counter.miss} / ${counter.nok}` );
            send( [msg,dupMsg,missMsg,errMsg] );
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-checkFC", lorawancheckFC );
};
