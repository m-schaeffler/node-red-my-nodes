module.exports = function(RED) {
    var tools = require('./tools.js');

    function BoolNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property = config.property || "payload";

        node.on('input', function(msg,send,done) {
            msg.payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );

            node.status( msg.payload );
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("tobool",BoolNode);
}
