module.exports = function(RED) {

    function ThermostatNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context()
        this.topic      = config.topic ?? "";
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
                    data.block = msg.payload.block;
                }
                if( msg.payload?.temperature !== undefined )
                {
                    data.temperature = msg.payload.temperature;
                }
                if( msg.payload?.nominal !== undefined )
                {
                    data.nominal = msg.payload.nominal;
                }
                if( msg.payload?.cycleTime !== undefined )
                {
                    data.cycleTime = msg.payload.cycleTime;
                }
                if( msg.payload?.cycleCount !== undefined )
                {
                    data.cycleCount = msg.payload.cycleCount;
                }
                if( ! data.running )
                {
                    startHeating();
                }
            }
            context.set( "data", data );
            node.status( { fill:data.running?"green":"gray", shape:"dot", text:data.temperature } );
            send( sendOutput() );
            done();
        });

        node.on('close', function() {
            //clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType( "thermostat", ThermostatNode );
}
