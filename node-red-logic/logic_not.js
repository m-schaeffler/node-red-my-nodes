module.exports = function(RED) {
    var tools = require('./tools.js');

    function NotNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property  = config.property || "payload";
        this.showState = Boolean( config.showState );
        this.filter    = Boolean( config.filter );
        this.last      = null;
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            msg.payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );
            let status = { text:msg.payload ?? "error" };
            if( msg.payload !== null )
            {
                msg.payload = ! msg.payload;
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

    RED.nodes.registerType("not",NotNode);
}
