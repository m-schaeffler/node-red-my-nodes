module.exports = function(RED) {
    var tools = require('./tools.js');

    function BoolNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property  = config.property || "payload";
        this.showState = config.showState;
        this.filter    = Boolean( config.filter );
        this.last      = null;

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return null;
            }
            msg.payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );
            let status = { text:msg.payload ?? "error" };
            if( msg.payload !== null )
            {
                if( node.filter )
                {
                    status.shape = "dot";
                    if( msg.payload !== node.last )
                    {
                        node.last = msg.payload;
                        status.fill = "green";
                        send( msg );
                    }
                    else
                    {
                        status.fill = "gray";
                    }
                }
                else
                {
                    send( msg );
                }
            }
            if( node.showState )
            {
                node.status( status );
            }
            done();
        });
    }

    RED.nodes.registerType("tobool",BoolNode);
}
