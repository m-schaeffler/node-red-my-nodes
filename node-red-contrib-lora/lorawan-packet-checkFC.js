module.exports = function(RED)
{
    function lorawancheckFC(config)
    {
        RED.nodes.createNode( this, config );
        var node    = this;
        var counter = { ok:0, nok:0, miss:0, dup:0 };
        var data    = {}

        node.on('input',function(msg,send,done) {
            let errMsg  = null;
            let missMsg = null;
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
                missMsg = {topic:"LoRa missing frame", payload:`${msg.topic}: missing Frame; latest ${msg.payload.frame_count}, before ${item}`};
                data[msg.topic] = msg.payload.frame_count;
            }
            else if( (item == msg.payload.frame_count) && (msg.payload.frame_count < item+25) )
            {
                // same frame => deduplication
                counter.dup++;
                msg = null;
            }
            else
            {
                counter.nok++;
                errMsg = {topic:"LoRa error", payload:`${msg.topic}: invalid Frame counter ${msg.payload.frame_count} last good ${item}`};
                msg    = null;
            }

            node.status( `${counter.ok} / ${counter.dup} / ${counter.miss} / ${counter.nok}` );
            send( [msg,errMsg,missMsg] );
            done();
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-checkFC", lorawancheckFC );
};
