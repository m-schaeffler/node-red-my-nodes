module.exports = function(RED) {

    function NumberNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property = config.property ?? "payload";
        this.showState = config.showState;

        node.on('input', function(msg,send,done) {
            msg.payload = Number( RED.util.getMessageProperty( msg, node.property ) );

            if( ! isNaN( msg.payload ) )
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
                    node.status( "not a Number" );
                }
            }
            done();
        });
    }

    RED.nodes.registerType("tonumber",NumberNode);
}
