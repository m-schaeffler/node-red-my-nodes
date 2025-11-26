module.exports = function(RED) {

    function FormatPwmOutput(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.cyclic       = Number( config.cyclicTime ?? 60 ) * 1000;
        this.showState    = Boolean( config.showState );
        this.topic        = null;
        this.onTime       = null;
        this.timOn        = null;
        this.timCyclic    = null;
        this.state        = { shape: "dot" };
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
        node.status( "" );

        function sendMsg(value)
        {
            node.send( { topic:node.topic, payload:value } );
            if( value && node.onTime )
            {
                node.timOn = setTimeout( function() { sendMsg(false); }, node.onTime );
            }
            if( node.showState )
            {
                node.state.fill = value ? "green" : "gray";
                node.status( node.state );
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
            function setPwm(value)
            {
                if( value == 0 || value == 1 )
                {
                    node.onTime = null;
                    clearInterval( node.timCyclic );
                    node.timCyclic = null;
                    sendMsg( value == 1 );
                }
                else
                {
                    node.onTime = this.cyclic * value;
                    if( ! node.timCyclic )
                    {
                        node.timCyclic = setInterval( function() { node.emit("cyclic"); }, this.cyclic );
                        sendMsg( true );
                    }
                }
            }
            getPayload( function(value)
            {
                const number = Number( value );
                node.status.text = Math.round( number*100 ) + "%";
                if( ! ( Number.isNaN( number ) ) )
                {
                    node.topic = msg.topic;
                    if( number <= 0 )
                    {
                        setPwm( 0 );
                    }
                    else if( number >= 1 )
                    {
                        setPwm( 1 );
                    }
                    else
                    {
                        setPwm( number );
                    }
                }
                else
                {
                    node.state.fill = "red";
                    node.state.text = "not a Number";
                    node.status( node.state );
                }
                done();
            } );
        });

        node.on('cyclic', function() {
            console.log( "pwm output cyclic" );
            sendMsg( true );
        });

        node.on('close', function() {
            clearInterval( node.timOn );
            clearInterval( node.timCyclic );
        });
    }

    RED.nodes.registerType("pwmOutput",FormatPwmOutput);
}
