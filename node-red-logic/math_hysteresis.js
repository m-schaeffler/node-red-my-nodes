module.exports = function(RED) {

    function HysteresisEdgeNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node    = this;
        var context = this.context();
        this.property       = config.property ?? "payload";
        this.propertyType   = config.propertyType ?? "msg";
        this.threshold_rise = config.threshold_raise;
        this.threshold_fall = config.threshold_fall;
        this.consecutive    = Number( config.consecutive ?? 1 );
        this.outputRise     = config.outputRise ?? true;
        this.outputRiseType = config.outputRiseType ?? "bool";
        this.outputFall     = config.outputFall ?? false;
        this.outputFallType = config.outputFallType ?? "bool";
        this.showState      = Boolean( config.showState );
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
        if( this.outputRiseType === "json" )
        {
            this.outputRise = JSON.parse( this.outputRise );
        }
        if( this.outputType === "json" )
        {
            this.outputFall = JSON.parse( this.outputFall );
        }
        node.cntRise = 0;
        node.cntFall = 0;
        node.status( "" );

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
                    msg.value = Number( value );
                    let data   = context.get( "data" ) ?? {};
                    let status = { fill:data[msg.topic]?.status??"gray", shape:"dot", text:msg.value.toPrecision(4) };

                    if( ! isNaN( msg.value ) )
                    {
                        const last = data[msg.topic]?.edge;

                        function sendMsg(edge)
                        {
                            status.fill = edge ? "green" : "gray";
                            data[msg.topic] = { edge:edge, status:status.fill };
                            context.set( "data", data );
                            msg.payload = edge ? node.outputRise : node.outputFall;
                            msg.edge    = edge ? "rising" : 'falling';
                            send( msg );
                        }

                        if( msg.value > node.threshold_rise && last !== true )
                        {
                            if( ++node.cntRise >= node.consecutive )
                            {
                                sendMsg( true );
                                node.cntRise = 0;
                            }
                            else
                            {
                                status.fill = "yellow";
                            }
                            node.cntFall = 0;
                        }
                        else if( msg.value < node.threshold_fall && last !== false )
                        {
                            if( ++node.cntFall >= node.consecutive )
                            {
                                sendMsg( false );
                                node.cntFall = 0;
                            }
                            else
                            {
                                status.fill = "yellow";
                            }
                            node.cntRise = 0;
                        }
                        else
                        {
                            node.cntRise = 0;
                            node.cntFall = 0;
                        }
                    }
                    else
                    {
                        status.fill = "red";
                        status.text = "not a Number";
                    }

                    if( node.showState )
                    {
                        node.status( status );
                    }
                    done();
                } );
            }
        });
    }

    RED.nodes.registerType("hysteresisEdge",HysteresisEdgeNode);
}
