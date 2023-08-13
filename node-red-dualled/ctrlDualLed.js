module.exports = function(RED) {

    function CtrlDualLedNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        const dualLed   = RED.nodes.getNode( config.dualLed );
        const temp_warm = Number( dualLed.temp_warm );
        const temp_cold = Number( dualLed.temp_cold );
        const topicWarm = config.topicWarm;
        const topicCold = config.topicCold;

        node.on('input', function(msg,send,done) {

            function setItem(key,value)
            {
                if( value !== undefined && item[key] !== value )
                {
                    item[key] = value;
                }
            }

            let item    = context.get( msg.topic ) ?? { turn:"off", brightness:50, temp:4500 };
            switch( typeof msg.payload )
            {
                case "number":
                case "string":
                    switch( msg.payload )
                    {
                        case 1:
                        case "1":
                        case "on":     setItem( "turn", "on" ); break;
                        case 0:
                        case "0":
                        case "off":    setItem( "turn", "off" ); break;
                        case "toggle": setItem( "turn", item.turn=="on" ? "off" : "on" ); break;
                        case "trigger":break;
                    }
                    break;
                case "boolean":
                    setItem( "turn", msg.payload ? "on" : "off" );
                    break;
                case "object":
                    setItem( "turn",       msg.payload?.turn );
                    setItem( "temp",       msg.payload?.temp );
                    setItem( "brightness", msg.payload?.brightness );
                    break;
            }
            context.set( msg.topic, item );

            let warmMsg = msg;
            warmMsg.payload = msg.payload.transition!==undefined ? {transition:msg.payload.transition} : {};
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
            warmMsg.topic += topicWarm;
            coldMsg.topic += topicCold;

            node.status({ fill: item.turn=="on"?"green":"gray", shape: "dot", text: warmMsg.payload.brightness+" / "+coldMsg.payload.brightness });
            send( [ warmMsg, coldMsg ] );
            done();
        });
    }

    RED.nodes.registerType("ctrlDualLed",CtrlDualLedNode);
}
