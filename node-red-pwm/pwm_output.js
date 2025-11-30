module.exports = function(RED) {

    function PwmOutputNode(config) {
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
        this.last         = null;
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

        function sendMsg(value,pwm=null)
        {
            //console.log( "pwm output sendMsg "+value+" "+node.onTime+" "+Date.now() );
            if( value !== node.last )
            {
                node.last = value;
                let help = { topic:node.topic, payload:value };
                if( pwm !== null )
                {
                    help.pwm = pwm;
                }
                node.send( help );
                if( value && node.onTime )
                {
                    node.timOn = setTimeout( function() { sendMsg(false); }, node.onTime );
                }
            }
            if( node.showState )
            {
                node.state.fill = value ? "green" : "gray";
                node.status( node.state );
            }
        }

        node.on('input', function(msg,send,done) {
            //console.log( "pwm output input "+Date.now() );
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
            getPayload( function(value)
            {
                const number = Number( value );
                node.state.text = Math.round( number*100 ) + "%";
                if( ! ( Number.isNaN( number ) ) )
                {
                    node.topic = msg.topic;
                    if( number <= 0 || number >= 1 )
                    {
                        clearInterval( node.timOn );
                        clearInterval( node.timCyclic );
                        node.onTime    = null;
                        node.timCyclic = null;
                        const help = number >= 1;
                        sendMsg( help, Number( help ) );
                    }
                    else
                    {
                        node.onTime = node.cyclic * number;
                        if( ! node.timCyclic )
                        {
                            node.timCyclic = setInterval( function() { node.emit("cyclic"); }, node.cyclic );
                            node.last      = null;
                            sendMsg( true, number );
                        }
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
            //console.log( "pwm output cyclic "+Date.now() );
            sendMsg( true );
        });

        node.on('close', function() {
            clearInterval( node.timOn );
            clearInterval( node.timCyclic );
        });
    }

    RED.nodes.registerType("pwmOutput",PwmOutputNode);
}
