module.exports = function(RED) {

    function PwmInputNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.measureTime  = Number( config.measureTime ?? 3600 ) * 1000;
        this.showState    = Boolean( config.showState );
        this.data         = [];
        this.topic        = null;
        this.value        = null;
        this.last         = null;
        this.timCyclic    = setInterval( function() { node.emit("cyclic"); }, Math.max( this.measureTime/240, 1000 ) );
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

        context.get( "data", function(err,value)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                console.log( "context.get", value );
                if( value !== undefined )
                {
                    node.data = value;
                }
            }
        } );

        function setStatus(status)
        {
            if( node.showState )
            {
                node.status( status );
            }
        }

        function calcPwm(value)
        {
            if( node.topic )
            {
                const now = Date.now();
                node.data.push( { time: now, value: value } );
                context.set( "data", node.data );
                //console.log( node.data );
                const time_ges = now - node.data[0].time;
                let   time_on  = 0;
                let   last     = null;
                for( const i of node.data )
                {
                    if( last )
                    {
                        time_on += i.time - last;
                    }
                    last = i.value ? i.time : null;
                }
                //console.log(time_on+" / "+time_ges)
                if( time_ges > 0 )
                {
                    const payload = time_on / time_ges;
                    if( payload !== node.last )
                    {
                        node.last = payload
                        node.send( { topic: node.topic, payload: payload } );
                    }
                    setStatus( {
                        fill:  node.value ? "green" : "gray",
                        shape: "ring",
                        text:  (payload*100).toFixed(0) + "%"
                    } );
                }
                else
                {
                    setStatus( "-" );
                }
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
            getPayload( function(value)
            {
                let input;
                switch( value )
                {
                    case true:
                    case 1:
                    case "on":
                        input = true;
                        break;
                    case false:
                    case 0:
                    case "off":
                        input = false;
                        break;
                    default:
                        node.warn( "invalid value "+value );
                        done();
                        return;
                }
                node.topic = msg.topic;
                node.value = input;
                calcPwm( input );
                done();
            } );
        });

        node.on('cyclic', function() {
            //console.log( "pwm output cyclic "+Date.now() );
            const now = Date.now();
            while( node.data[0]?.time < now - node.measureTime )
            {
                node.data.shift();
            }
            calcPwm( node.value );
        });

        node.on('close', function() {
            clearInterval( node.timCyclic );
        });
    }

    RED.nodes.registerType("pwmInput",PwmInputNode);
}
