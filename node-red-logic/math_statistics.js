module.exports = function(RED) {

    function StatsNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.property     = config.property || "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.deltaTime    = Number( config.deltaTime ?? 60 )*1000;
        this.minData      = Number( config.minData ?? 1 );
        this.contextStore = config.contextStore ?? "none";
        this.showState    = Boolean( config.showState );
        if( this.propertyType === "jsonata" )
        {
            try {
                this.propertyPrepared = RED.util.prepareJSONataExpression( this.property, this );
            }
            catch (e) {
                node.error(RED._("debug.invalid-exp", {error: this.property}));
                return;
            }
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
            }
            else if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
                done();
            }
            else
            {
                function getPayload(callback)
                {
                    if( node.propertyPrepared )
                    {
                        RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                        {
                            if( err )
                            {
                                done( err.message );
                            }
                            else
                            {
                                callback( value );
                            }
                        } );
                    }
                    else
                    {
                        callback( RED.util.getMessageProperty( msg, node.property ) );
                    }
                }
                getPayload( function(value)
                {
                    const now = Date.now();
                    const payload = Number( value );
                    if( ! isNaN( payload ) )
                    {
                        let data = context.get( "data" ) ?? {};
                        let item = data[msg.topic] ?? [];
                        item.push( { time:now, value:payload } );
                        while( item[0].time < now - node.deltaTime )
                        {
                            item.shift();
                        }
                        data[msg.topic] = item;
                        context.set( "data", data );

                        if( item.length >= node.minData )
                        {
                            msg.stat = {
                                first: item[0].value,
                                last:  payload,
                                count: item.length,
                                min:   Number.MAX_SAFE_INTEGER,
                                max:   Number.MIN_SAFE_INTEGER };
                            let sum = 0;
                            for( const value of item )
                            {
                                sum += value.value;
                                if( value.value < msg.stat.min )
                                {
                                    msg.stat.min = value.value;
                                }
                                if( value.value > msg.stat.max )
                                {
                                    msg.stat.max = value.value;
                                }
                            }
                            msg.stat.average = sum/msg.stat.count;
                            let varianz = 0;
                            for( const value of item )
                            {
                                varianz += ( value.value - msg.stat.average ) ** 2;
                            }
                            msg.stat.deviation = Math.sqrt( varianz / msg.stat.count );
                            msg.stat.variation = msg.stat.deviation / msg.stat.average;
                            if( node.showState )
                            {
                                node.status({fill:"green",shape:"dot",text:`${msg.stat.count} / ${msg.stat.deviation.toPrecision(4)}`});
                            }
                            send( msg );
                        }
                        else
                        {
                            if( node.showState )
                            {
                                node.status({fill:"gray",shape:"dot",text:"to less data"});
                            }
                        }
                    }
                    else
                    {
                        if( node.showState )
                        {
                            node.status({fill:"red",shape:"dot",text:"payload is NaN"});
                        }
                    }
                    done();
                } );
            }
        });
    }

    RED.nodes.registerType("statistics",StatsNode);
}
