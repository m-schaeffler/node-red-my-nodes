module.exports = function(RED) {

    function FallingEdgeNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.threshold    = config.threshold;
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
                        const last = data[msg.topic] ?? Number.MIN_SAFE_INTEGER;
                        if( msg.payload < node.threshold && node.threshold <= last )
                        {
                            status.fill = "green";
                            msg.edge = "falling";
                            send( msg );
                        }
                        data[msg.topic] = msg.payload;
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

    RED.nodes.registerType("fallingEdge",FallingEdgeNode);
}
