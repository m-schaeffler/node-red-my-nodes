module.exports = function(RED) {

    function CtrlDualLedNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        const temp_warm = Number( config.temp_warm );
        const temp_cold = Number( config.temp_cold );
        const transition_short = Number( config.transition_short );
        const transition_long  = Number( config.transition_long  );

        node.on('input', function(msg,send,done) {
            let data = context.get( "data" ) ?? { turn:"off", temp:4000, brightness:100 };
            let transition;
            switch( typeof msg.payload )
            {
                case "string":
                    switch( msg.payload )
                    {
                        case "on":
                        case "off":
                            data.turn = msg.payload;
                            break;
                        case "toggle":
                            data.turn = data.turn=="on" ? "off" : "on";
                            break;
                    }
                    transition = transition_short;
                    break;
                case "boolean":
                    data.turn = msg.payload ? "on" : "off";
                    transition = transition_short;
                    break;
                case "number":
                    switch( msg.topic )
                    {
                        case "temp":
                            data.temp = msg.payload;
                            break;
                        case "brightness":
                            data.brightness = msg.payload;
                            break;
                    }
                    transition = transition_long;
                    break;
                case "object":
                    if( "temp" in msg.payload )
                    {
                        data.temp = msg.payload.temp;
                    }
                    if( "brightness" in msg.payload )
                    {
                        data.brightness = msg.payload.brightness;
                    }
                    transition = transition_long;
                    break;
            }
            context.set( "data", data );

            const x_warm = Math.round( data.brightness*(temp_cold-data.temp) / (temp_cold-temp_warm) );
            const x_cold = data.brightness - x_warm;
            const retain = msg.retain ?? false;

            node.status({ fill: data.turn=="on"?"green":"gray", shape: "dot", text: x_warm+" / "+x_cold });
            send( [
                { topic:"warm LED", payload:{turn:data.turn,brightness:x_warm,transition:transition}, retain:retain },
                { topic:"cold LED", payload:{turn:data.turn,brightness:x_cold,transition:transition}, retain:retain }
            ] );
            done();
        });
    }

    RED.nodes.registerType("ctrlDualLed",CtrlDualLedNode);
}
