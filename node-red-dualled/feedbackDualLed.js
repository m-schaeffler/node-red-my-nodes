module.exports = function(RED) {

    function FeedbackDualLedNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        const temp_warm = Number( config.temp_warm );
        const temp_cold = Number( config.temp_cold );
        const i_warm    = config.indx_warm;
        const i_cold    = config.indx_cold;

        node.on('input', function(msg,send,done) {
            const x_warm = msg.payload.brightness[i_warm];
            const x_cold = msg.payload.brightness[i_cold];

            msg.payload.output     = msg.payload.output[i_warm];
            msg.payload.brightness = x_warm + x_cold;
            msg.payload.temp       = temp_warm + (temp_cold-temp_warm)/(x_warm+x_cold)*x_cold;
            msg.payload.power      = msg.payload.power [i_warm] + msg.payload.power [i_cold];
            msg.payload.energy     = msg.payload.energy[i_warm] + msg.payload.energy[i_cold];

            node.status({ fill:msg.payload.output=="on"?"green":"gray", shape:"dot", text:`${msg.payload.brightness} / ${msg.payload.temp}` });
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("feedbackDualLed",FeedbackDualLedNode);
}
