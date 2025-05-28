module.exports = function(RED) {

    function ThermostatNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context()
        this.topic      = config.topic ?? "thermostat";
        this.nominal    = Number( config.nominal ?? 20 );
        this.cycleTime  = Number( config.cycleTime ?? 600 );
        this.cycleCount = Number( config.cycleCount ?? 1 );
        this.data       = { running:0 };
        this.timerHeat  = null;
        this.timerCycle = null;
        initData();
        node.status( "" );
        context.get( "data", function(err,value)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                console.log( "context read", value );
                if( value !== undefined )
                {
                    node.data = value;
                    node.data.running = 0;
                }
            }
        } );
        setTimeout( function() { node.emit("started"); }, 250 );

        function initData()
        {
            node.data.nominal    = node.nominal;
            node.data.cycleTime  = node.cycleTime;
            node.data.cycleCount = node.cycleCount;
        }

        function sendOutput()
        {
            node.send( [
                { topic: node.topic, payload: Boolean( node.data.running ) },
                { topic: node.topic, payload: Boolean( node.data.running % 2 ) && !node.data.block }
            ] );
            setStatus();
        }

        function setStatus()
        {
            node.status( {
                fill:  node.data.running ? "green" : "gray",
                shape: "dot",
                text:  node.data.temperature
            } );
        }

        function stopHeating()
        {
            node.data.running = 0;
            clearTimeout( node.timerHeat );
            clearTimeout( node.timerCycle );
            sendOutput();
        }

        function startHeating()
        {
            node.data.running = 1;
            sendOutput();
        }

        node.on('started', function() {
            sendOutput();
        } );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
            }
            else if( msg.reset || msg.topic==="init" )
            {
                initData();
                if( node.data.running )
                {
                    stopHeating();
                }
            }
            else if( false )
            {
                if( ! node.data.running )
                {
                    startHeating();
                }
            }
            else
            {
                if( msg.payload?.block !== undefined )
                {
                    node.data.block = msg.payload.block;
                    if( node.data.running )
                    {
                        sendOutput();
                    }
                }
                if( msg.payload?.temperature !== undefined )
                {
                    node.data.temperature = msg.payload.temperature;
                    setStatus();
                }
                if( msg.payload?.nominal !== undefined )
                {
                    node.data.nominal = msg.payload.nominal;
                }
                if( msg.payload?.cycleTime !== undefined )
                {
                    node.data.cycleTime = msg.payload.cycleTime;
                }
                if( msg.payload?.cycleCount !== undefined )
                {
                    node.data.cycleCount = msg.payload.cycleCount;
                }
            }
            context.set( "data", node.data );
            done();
        });

        node.on('close', function() {
            clearTimeout( node.timerHeat );
            clearTimeout( node.timerCycle );
        });
    }

    RED.nodes.registerType( "thermostat", ThermostatNode );
}
