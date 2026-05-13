module.exports = function(RED) {

    function FormatBoolNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.topic        = config.topic || "";
        this.falseValue   = RED.util.evaluateNodeProperty( config.falseValue ?? 0, config.falseValueType ?? "num" );
        this.trueValue    = RED.util.evaluateNodeProperty( config.trueValue ?? 1, config.trueValueType ?? "num" );
        this.timeout      = Number( config.timeout ?? 0 );
        {
            const type = config.timeoutValueType ?? "last";
            this.timeoutValue = type !== "last" ? RED.util.evaluateNodeProperty( config.timeoutValue ?? "", type ) : null;
        }
        this.showState    = Boolean( config.showState );
        this.filter       = Boolean( config.filter );
        this.interval_id  = null;
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
        switch( config.timeoutUnit ?? "secs" )
        {
            case "secs":
                this.timeout *= 1000;
                break;
            case "mins":
                this.timeout *= 1000 * 60;
                break;
            case "hours":
                this.timeout *= 1000 * 60 * 60;
                break;
            default:
                // "msecs" so no conversion needed
        }
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            function sendMsg()
            {
                clearInterval( node.interval_id );
                node.last = msg.payload;
                send( msg );
                if( node.timeout > 0 )
                {
                    node.interval_id = setInterval( function(t) { node.emit("cyclic",t); }, node.timeout, msg.topic );
                }
            }
            function getPayload(callback)
            {
                if( node.propertyPrepared )
                {
                    RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                    {
                        if( err )
                        {
                            //done( err.message );
                            node.error( err.message );
                            callback( null );
                        }
                        else
                        {
                            callback( value === undefined ? null : value );
                        }
                    } );
                }
                else
                {
                    try
                    {
                        callback( RED.util.getMessageProperty( msg, node.property ) );
                    }
                    catch( err )
                    {
                        node.error( err.message );
                        callback( null );
                    }
                }
            }
            getPayload( function(value)
            {
                let status = {};
                msg.payload = value ? node.trueValue : node.falseValue;
                if( node.topic )
                {
                    msg.topic = node.topic;
                }
                if( node.filter )
                {
                    status.shape = "dot";
                    if( msg.payload !== node.last )
                    {
                        status.fill = "green";
                        sendMsg();
                    }
                    else
                    {
                        status.fill = "gray";
                    }
                }
                else
                {
                    sendMsg();
                }
                if( node.showState )
                {
                    status.text = msg.payload;
                    node.status( status );
                }
                done();
            } );
        });

        node.on('cyclic', function(topic) {
            //console.log( "collect chart cyclic "+topic+" "+node.last );
            node.send( {
                topic:   topic,
                payload: node.timeoutValue ?? node.last
            } );
        });

        node.on('close', function() {
            clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType("formatBool",FormatBoolNode);
}
