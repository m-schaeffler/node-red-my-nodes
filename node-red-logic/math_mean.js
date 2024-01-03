module.exports = function(RED) {

    function MeanNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.property = config.property || "payload";
        this.deltaTime= Number( config.deltaTime )*1000;
        this.minData  = Number( config.minData );
        this.filter   = Number( config.filter ?? 0 )*1000;
        this.zeroIsZero = config.zeroIsZero ?? false;

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return null;
            }
            if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                context.set( "last", {} );
                node.status( "" );
            }
            else
            {
                const now     = Date.now();
                const payload = Number( RED.util.getMessageProperty( msg, node.property ) );
                if( ! isNaN( payload ) )
                {
                    let last = context.get( "last" ) ?? {};
                    let data = context.get( "data" ) ?? {};
                    let item = data[msg.topic] ?? [];
                    item.push( { time:now, value:payload } );
                    while( item[0].time < now - this.deltaTime )
                    {
                        item.shift();
                    }
                    data[msg.topic] = item;
                    context.set( "data", data );

                    function sendValue(value)
                    {
                        msg.payload = value;
                        last[msg.topic] = now;
                        context.set( "last", last );
                        node.status({fill:"green",shape:"dot",text:`${item.length} / ${msg.payload.toPrecision(4)}`});
                        send( msg );
                    }

                    if( this.zeroIsZero && payload === 0 )
                    {
                        sendValue( 0 );
                    }
                    else if( item.length >= this.minData )
                    {
                        let sum = 0;
                        for( const value of item )
                        {
                            sum += value.value;
                        }
                        if( (last[msg.topic]??0)+this.filter < now )
                        {
                            sendValue( sum/item.length );
                        }
                        else
                        {
                            node.status({fill:"gray",shape:"dot",text:`${item.length} / ${msg.payload.toPrecision(4)}`});
                        }
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

    RED.nodes.registerType("mean",MeanNode);
}
