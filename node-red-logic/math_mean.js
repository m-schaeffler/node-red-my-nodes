module.exports = function(RED) {
    var myMath = require('my-math');

    function MeanNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.property     = config.property || "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.deltaTime    = Number( config.deltaTime ?? 60 )*1000;
        this.minData      = Number( config.minData ?? 1 );
        this.filterTime   = Number( config.filter ?? 0 )*1000;
        this.filterValue  = Number( config.filterVal ?? 0 );
        this.zeroIsZero   = Boolean( config.zeroIsZero );
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
        this.oldStatus = this.status;
        this.status = function(state)
        {
            if( node.showState )
            {
                node.oldStatus( state );
            }
        }
        node.oldStatus( "" );

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
                    const payload = Number( value );
                    if( ! isNaN( payload ) )
                    {
                        let last = context.get( "last" ) ?? {};
                        let data = context.get( "data" ) ?? {};
                        let item = data[msg.topic] ?? [];
                        item.push( { time:now, value:payload } );
                        while( item[0].time < now - node.deltaTime )
                        {
                            item.shift();
                        }
                        data[msg.topic] = item;
                        context.set( "data", data );

                        function sendValue(value,count)
                        {
                            msg.payload = value;
                            msg.count   = count;
                            last[msg.topic] = {value:value,time:now};
                            context.set( "last", last );
                            node.status({fill:"green",shape:"dot",text:`${item.length} / ${value.toPrecision(4)}`});
                            send( msg );
                        }

                        if( node.zeroIsZero && payload === 0 )
                        {
                            sendValue( 0, 1 );
                        }
                        else if( item.length >= node.minData )
                        {
                            let sum = 0;
                            for( const value of item )
                            {
                                sum += value.value;
                            }
                            const help  = last[msg.topic];
                            const value = sum/item.length;
                            if( help === undefined ||
                               ( help.time + node.filterTime < now && 
                                 myMath.distance( help.value, value ) >= node.filterValue )
                            {
                                sendValue( value, item.length );
                            }
                            else
                            {
                                node.status({fill:"gray",shape:"dot",text:`${item.length} / ${value.toPrecision(4)}`});
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
