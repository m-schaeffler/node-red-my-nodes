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
            let data = context.get( "data" ) ?? {};
            let item = data[msg.topic] ?? { turn:"off", temp:4000, brightness:100 };
            let transition;
            switch( typeof msg.payload )
            {
                case "string":
                    switch( msg.payload )
                    {
                        case "on":
                        case "off":
                            item.turn = msg.payload;
                            break;
                        case "toggle":
                            item.turn = data.turn=="on" ? "off" : "on";
                            break;
                    }
                    transition = transition_short;
                    break;
                case "boolean":
                    item.turn = msg.payload ? "on" : "off";
                    transition = transition_short;
                    break;
                case "number":
                    switch( msg.topic )
                    {
                        case "temp":
                            item.temp = msg.payload;
                            break;
                        case "brightness":
                            item.brightness = msg.payload;
                            break;
                    }
                    transition = transition_long;
                    break;
                case "object":
                    if( "temp" in msg.payload )
                    {
                        item.temp = msg.payload.temp;
                    }
                    if( "brightness" in msg.payload )
                    {
                        item.brightness = msg.payload.brightness;
                    }
                    transition = transition_long;
                    break;
            }
            data[msg.topic] = item;
            context.set( "data", data );

            const x_warm = Math.round( item.brightness*(temp_cold-item.temp) / (temp_cold-temp_warm) );
            const x_cold = item.brightness - x_warm;

            let warmMsg = msg;
            let coldMsg = RED.util.cloneMessage( msg );
            warmMsg.payload = { turn:item.turn, brightness:x_warm, transition:transition };
            coldMsg.payload = { turn:item.turn, brightness:x_cold, transition:transition };

            node.status({ fill: item.turn=="on"?"green":"gray", shape: "dot", text: x_warm+" / "+x_cold });
            send( [ warmMsg, coldMsg ] );
            done();
        });
    }

    RED.nodes.registerType("ctrlDualLed",CtrlDualLedNode);
}
