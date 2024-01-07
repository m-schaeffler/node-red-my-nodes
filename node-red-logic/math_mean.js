module.exports = function(RED) {

    function MeanNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.property     = config.property || "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.deltaTime    = Number( config.deltaTime )*1000;
        this.minData      = Number( config.minData );
        this.filter       = Number( config.filter ?? 0 )*1000;
        this.zeroIsZero   = config.zeroIsZero ?? false;
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
                context.set( "last", {} );
                node.status( "" );
                done();
            }
            else
            {
                const now = Date.now();
                function getPayload(callback)
                {
                    if( node.propertyPrepared )
                    {
                        RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                        {
                            if( err )
                            {
                                done( RED._("debug.invalid-exp", {error: editExpression}) );
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
                    msg.payload = Number( value );
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
                    done();
                } );
            }
        });
    }

    RED.nodes.registerType("mean",MeanNode);
}
