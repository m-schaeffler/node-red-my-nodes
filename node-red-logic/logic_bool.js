module.exports = function(RED) {
    var tools = require('./tools.js');

    function BoolNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property = config.property || "payload";
        this.showState = config.showState;

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                return null;
            }
            msg.payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );
            if( msg.payload !== null )
            {
                if( node.showState )
                {
                    node.status( msg.payload );
                }
                send( msg );
            }
            else
            {
                if( node.showState )
                {
                    node.status( "error" );
                }
            }
            done();
        });
    }

    RED.nodes.registerType("tobool",BoolNode);
}
