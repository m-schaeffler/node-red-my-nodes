module.exports = function(RED) {

    function ThermostatNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context()
        this.topic      = config.topic ?? "thermostat";
        this.nominal    = Number( config.nominal ?? 20 );
        this.cycleTime  = Number( config.cycleTime ?? 600 );
        this.cycleCount = Number( config.cycleCount ?? 1 );
        this.data       = {};
        this.running    = 0;
        this.lastR      = null;
        this.lastO      = null;
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

        function sendOutput(force=false)
        {
            const active = Boolean( node.running );
            const output = Boolean( node.running % 2 ) && !node.data.block;
            console.log("  ",active,output)
            node.send( [
                force || active !== node.lastR ? { topic: node.topic, payload: active } : null,
                force || output !== node.lastO ? { topic: node.topic, payload: output } : null
            ] );
            node.status( {
                fill:  active ? ( output ? "green" : "yellow" ) : "gray",
                shape: "dot",
                text:  node.data.temperature + "°C"
            } );
            node.lastR = active;
            node.lastO = output;
        }

        function startCycle()
        {
            if( node.data.temperature < node.data.nominal-0.25 )
            {
                node.running++;
                let time = ( node.data.nominal - node.data.temperature + 0.4 ) / 5.0 * node.data.cycleTime;
                switch( node.running )
                {
                    case 1: time *= 1.4; break; // 1st cycle
                    case 3: time *= 1.2; break; // 2nd cycle
                }
                time = Math.min( time, node.data.cycleTime * 0.985 );
                console.log(time)
                node.timerHeat  = setTimeout( function(){ node.emit("stopHeater"); }, time                * 1000 );
                node.timerCycle = setTimeout( function(){ node.emit("newCycle"); },   node.data.cycleTime * 1000 );
            }
            else
            {
                node.running = 0;
            }
            sendOutput( true );
        }

        function startHeating()
        {
            if( ! node.running )
            {
                startCycle();
            }
        }

        function stopHeating()
        {
            if( node.running )
            {
                node.running = 0;
                clearTimeout( node.timerHeat );
                clearTimeout( node.timerCycle );
                node.timerHeat  = null;
                node.timerCycle = null;
                sendOutput( true );
            }
        }

        node.on('started', function() {
            sendOutput();
        } );

        node.on('stopHeater', function() {
            console.log('stopHeater');
            if( (++node.running)>>1 < node.data.cycleCount )
            {
                console.log("  weiter");
                sendOutput();
            }
            else
            {
                console.log("  stopp");
                stopHeating();
            }
        } );

        node.on('newCycle', function() {
            console.log('newCycle');
            startCycle();
            console.log(node.running)
        } );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
            }
            else if( msg.reset || msg.topic==="init" )
            {
                initData();
                stopHeating();
            }
            else
            {
                if( msg.payload?.block !== undefined )
                {
                    node.data.block = msg.payload.block;
                    sendOutput();
                }
                if( msg.payload?.temperature !== undefined )
                {
                    node.data.temperature = msg.payload.temperature;
                    sendOutput();
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
                switch( msg.payload?.trigger )
                {
                    case true:
                    case "on":
                        startHeating();
                        break;
                    case false:
                    case "off":
                        stopHeating();
                        break;
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
