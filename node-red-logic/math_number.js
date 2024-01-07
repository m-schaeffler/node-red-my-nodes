module.exports = function(RED) {

    function NumberNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.showState    = config.showState;
        this.filter       = Boolean( config.filter );
        this.last         = null;
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
                return;
            }
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
                let status = { text:msg.payload };
                if( ! isNaN( msg.payload ) )
                {
                    if( node.filter )
                    {
                        status.shape = "dot";
                        if( msg.payload !== node.last )
                        {
                            node.last = msg.payload;
                            status.fill = "green";
                            send( msg );
                        }
                        else
                        {
                            status.fill = "gray";
                        }
                    }
                    else
                    {
                        send( msg );
                    }
                }
                else
                {
                    status.text = "not a Number";
                }
                if( node.showState )
                {
                    node.status( status );
                }
                done();
            } );
        });
    }

    RED.nodes.registerType("tonumber",NumberNode);
}
