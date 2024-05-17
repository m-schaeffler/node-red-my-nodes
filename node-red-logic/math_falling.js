module.exports = function(RED) {
    var tools = require('./tools.js');

    function FallingEdgeNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.threshold    = Number( config.threshold );
        this.consecutive  = Number( config.consecutive ?? 1 );
        this.output       = config.output ?? "true";
        this.outputType   = config.outputType ?? "bool";
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
        switch( this.outputType )
        {
            case "num":
                this.output = Number( this.output );
                break;
            case "bool":
                this.output = tools.property2boolean( this.output );
                break;
            case "json":
                this.output = JSON.parse( this.output );
                break;
        }
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
                    let status = { fill:"gray", shape:"dot", text:msg.value };

                    if( ! isNaN( msg.value ) )
                    {
                        let   data = context.get( "data" ) ?? {};
                        const last = data[msg.topic] ?? Number.MIN_SAFE_INTEGER;
                        if( msg.value < node.threshold && node.threshold <= last )
                        {
                            if( ++node.cntFall >= node.consecutive )
                            {
                                status.fill = "green";
                                msg.payload = node.output;
                                msg.edge    = "falling";
                                send( msg );
                                data[msg.topic] = msg.value;
                                node.cntFall = 0;
                            }
                            else
                            {
                                status.fill = "yellow";
                            }
                        }
                        else
                        {
                            node.cntFall = 0;
                            data[msg.topic] = msg.value;
                        }
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
