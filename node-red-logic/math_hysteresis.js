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
                    msg.payload = Number( value );
                    let data   = context.get( "data" ) ?? {};
                    let status = { fill:data[msg.topic]?.status??"gray", shape:"dot", text:msg.payload.toPrecision(4) };

                    if( ! isNaN( msg.payload ) )
                    {
                        const last = data[msg.topic]?.edge;

                        function sendMsg(edge)
                        {
                            status.fill = edge=="rising" ? "green" : "gray";
                            data[msg.topic] = { edge:edge, status:status.fill };
                            context.set( "data", data );
                            msg.edge = edge;
                            send( msg );
                        }

                        if( msg.payload > node.threshold_rise && last != 'rising' )
                        {
                            if( ++node.cntRise >= node.consecutive )
                            {
                                sendMsg( 'rising' );
                                node.cntRise = 0;
                            }
                            else
                            {
                                status.fill = "yellow";
                            }
                            node.cntFall = 0;
                        }
                        else if( msg.payload < node.threshold_fall && last != 'falling' )
                        {
                            if( ++node.cntFall >= node.consecutive )
                            {
                                sendMsg( 'falling' );
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
