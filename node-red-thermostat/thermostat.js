module.exports = function(RED) {

    function ThermostatNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context()
        this.topic      = config.topic ?? "thermostat";
        this.nominal    = Number( config.nominal ?? 20 );
        this.cycleTime  = Number( config.cycleTime ?? 600 );
        this.cycleCount = Number( config.cycleCount ?? 1 );
        this.data       = { running:false };
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
            return [
                { topic: node.topic, payload: node.data.running },
                { topic: node.topic, payload: false }
            ];
        }

        function stopHeating()
        {
            node.data.running = false;
            node.send( sendOutput() );
        }

        function startHeating()
        {
            node.data.running = true;
        }

        node.on('started', function() {
            stopHeating();
        } );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
            }
            if( msg.reset || msg.topic==="init" )
            {
                initData();
                stopHeating();
            }
            else
            {
                if( msg.payload?.block !== undefined )
                {
                    node.data.block = msg.payload.block;
                }
                if( msg.payload?.temperature !== undefined )
                {
                    node.data.temperature = msg.payload.temperature;
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
                if( ! node.data.running && false )
                {
                    startHeating();
                }
            }
            context.set( "data", node.data );
            node.status( { fill:node.data.running?"green":"gray", shape:"dot", text:node.data.temperature } );
            send( sendOutput() );
            done();
        });

        node.on('close', function() {
            //clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType( "thermostat", ThermostatNode );
}
