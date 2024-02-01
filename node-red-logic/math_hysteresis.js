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
        this.initial        = config.initial ?? "none";
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
                    let status = { fill:"gray", shape:"dot", text:msg.payload };

                    if( ! isNaN( msg.payload ) )
                    {
                        let   data = context.get( "data" ) ?? {};
                        const last = data[msg.topic];

                        function sendMsg(edge)
                        {
                            status.fill = "green";
                            data[msg.topic].edge = edge;
                            msg.edge = edge;
                            send( msg );
                        }

                        if( last )
                        {
                            if( msg.payload > node.threshold_rise && node.threshold_rise >= last.value && last.edge != 'rising' )
                            {
                                if( ++cntRise >= this.consecutive )
                                {
                                    sendMsg( 'rising' );
                                    node.cntRise = 0;
                                }
                                node.cntFall = 0;
                            }
                            else if( msg.payload < node.threshold_fall && node.threshold_fall <= last.value && last.edge != 'falling' )
                            {
                                if( ++cntFall >= this.consecutive )
                                {
                                    sendMsg( 'falling' );
                                    node.cntFall = 0;
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
                            data[msg.topic] = {};
                            if( ['any','rising'].includes(node.initial) && msg.payload > node.threshold_rise )
                            {
                                sendMsg( 'rising' );
                            }
                            else if( ['any','falling'].includes(node.initial) && msg.payload < node.threshold_fall )
                            {
                                sendMsg( 'falling' );
                            }
                        }
                        data[msg.topic].value = msg.payload;
                        context.set( "data", data );
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
