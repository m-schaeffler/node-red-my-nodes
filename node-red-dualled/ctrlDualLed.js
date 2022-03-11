module.exports = function(RED) {

    function CtrlDualLedNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        const dualLed   = RED.nodes.getNode( config.dualLed );
        const temp_warm = Number( dualLed.temp_warm );
        const temp_cold = Number( dualLed.temp_cold );

        node.on('input', function(msg,send,done) {
            let item = context.get( msg.topic ) ?? {};
            const transsition = msg.payload.transsition ?? 100;
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
                            item.turn = item.turn=="on" ? "off" : "on";
                            break;
                    }
                    break;
                case "boolean":
                    item.turn = msg.payload ? "on" : "off";
                    break;
                /* not usefull with topic as LED name
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
                    break;
                */
                case "object":
                    if( "turn" in msg.payload )
                    {
                        item.turn = msg.payload.turn;
                    }
                    if( "temp" in msg.payload )
                    {
                        item.temp = msg.payload.temp;
                    }
                    if( "brightness" in msg.payload )
                    {
                        item.brightness = msg.payload.brightness;
                    }
                    break;
            }
            context.set( msg.topic, item );

            let warmMsg = msg;
			warmMsg.payload = { transsition:transsition };
            if( "turn" in item )
			{
				warmMsg.payload.turn = item.turn;
			}
            let coldMsg = RED.util.cloneMessage( warmMsg );
			if( "brightness" in item && "temp" in item )
            {
                warmMsg.payload.brightness = Math.round( item.brightness*(temp_cold-item.temp) / (temp_cold-temp_warm) );
				coldMsg.payload.brightness = item.brightness - warmMsg.payload.brightness;
			}

            node.status({ fill: item.turn=="on"?"green":"gray", shape: "dot", text: warmMsg.payload.brightness+" / "+coldMsg.payload.brightness });
            
            send( [ warmMsg, coldMsg ] );
            done();
        });
    }

    RED.nodes.registerType("ctrlDualLed",CtrlDualLedNode);
}
