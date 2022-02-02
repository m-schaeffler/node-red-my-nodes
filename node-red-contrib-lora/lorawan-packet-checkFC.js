module.exports = function(RED)
{
    function lorawancheckFC(config)
    {
        RED.nodes.createNode( this, config );
        var node    = this;
        var context = this.context();

        node.on('input',function(msg,send,done) {
            let dupMsg  = null;
            let errMsg  = null;
            let counter = context.get( "counter" ) ?? { ok:0, nok:0, miss:0, dup:0 };
            let data    = context.get( "data" ) ?? {};
            const item  = data[msg.topic];

            if( ( item === undefined )                || // new sensor
                ( item+1 == msg.payload.frame_count ) || // normal msg
                ( msg.payload.frame_count == 0 ) )       // rebooted sensor or roll over
            {
                counter.ok++;
                data[msg.topic] = msg.payload.frame_count;
            }
            else if( item+1 < msg.payload.frame_count )  // missing farme
            {
                counter.miss++;
                errMsg = { topic:"LoRa missing frame", payload:`${msg.topic}: missing Frame; latest ${msg.payload.frame_count}, before ${item}`, lora:msg.payload };
                msg.missing = msg.payload.frame_count - item - 1;
                data[msg.topic] = msg.payload.frame_count;
            }
            else if( item == msg.payload.frame_count )   // same frame => deduplication
            {
                counter.dup++;
                dupMsg = msg;
                msg    = null;
                dupMsg.duplicate = true;
            }
            else                                         // error message
            {
                counter.nok++;
                errMsg = { topic:"LoRa error", payload:`${msg.topic}: invalid Frame counter ${msg.payload.frame_count} last good ${item}`, lora:msg.payload };
                msg    = null;
            }

            context.set( "counter", counter );
            context.set( "data", data );
            node.status( `${counter.ok} / ${counter.dup} / ${counter.miss} / ${counter.nok}` );
            send( [msg,dupMsg,errMsg] );
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-checkFC", lorawancheckFC );
};
