module.exports = function(RED) {

    function ReduceNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.topic    = config.topic;
        this.property = config.property || "payload";
        this.minMean  = Number( config.minMean );
        this.maxMean  = Number( config.maxMean );
        this.minData  = Number( config.minData );
        this.algo     = config.algo;

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                return null;
            }
            if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
            }
            else
            {
                const payload = Number( RED.util.getMessageProperty( msg, node.property ) );
                if( ! isNaN( payload ) )
                {
                    let data = context.get( "data" ) ?? {};
                    let item = data[msg.topic] ?? [];
                    item.push( payload )
                    data[msg.topic] = item;

                    msg.topic = node.topic;
                    msg.count = 0;
                    msg.data  = data;
                    switch( node.algo )
                    {
                        case "add":
                        case "mean": msg.payload = 0; break;
                        case "prod": msg.payload = 1; break;
                        case "min":  msg.payload = Number.MAX_SAFE_INTEGER; break;
                        case "max":  msg.payload = Number.MIN_SAFE_INTEGER; break;
                        default:     done( "invalid algo: "+node.algo ); return;
                    }
                    for( const key in data )
                    {
                        if( data[key].length >= node.minMean )
                        {
                            msg.count++;
                            while( data[key].length > node.maxMean )
                            {
                                data[key].shift();
                            }
                            const help = data[key].reduce( (accumulator,value)=>accumulator+value ) / data[key].length;
                            switch( node.algo )
                            {
                                case "add":
                                case "mean": msg.payload += help; break;
                                case "prod": msg.payload *= help; break;
                                case "min":  msg.payload  = Math.min( msg.payload, help ); break;
                                case "max":  msg.payload  = Math.max( msg.payload, help ); break;
                            }
                        }
                    }
                    context.set( "data", data );

                    if( msg.count >= node.minData )
                    {
                        switch( node.algo )
                        {
                            case "mean": msg.payload /= msg.count; break;
                        }
                        node.status({fill:"green",shape:"dot",text:msg.payload});
                        send( msg );
                    }
                    else
                    {
                        node.status({fill:"gray",shape:"dot",text:"to less data"});
                    }
                }
                else
                {
                    node.status({fill:"red",shape:"dot",text:"payload is NaN"});
                }
            }
            done();
        });
    }

    RED.nodes.registerType("reduce",ReduceNode);
}
