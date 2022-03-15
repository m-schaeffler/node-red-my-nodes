module.exports = function(RED) {

    function NumberNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property = config.property || "payload";

        node.on('input', function(msg,send,done) {
            msg.payload = Number( RED.util.getMessageProperty( msg, node.property ) );

            if( ! isNaN( msg.payload ) )
            {
                node.status( msg.payload );
                send( msg );
            }
            else
            {
                node.status( "not a Number" );
            }
            done();
        });
    }

    RED.nodes.registerType("tonumber",NumberNode);
}
