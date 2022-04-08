module.exports = function(RED) {

    function FallingEdgeNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property  = config.property ?? "payload";
        this.threshold = config.threshold;
        this.showState = config.showState;

        node.on('input', function(msg,send,done) {
            if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
            }
            else
            {
                msg.payload = Number( RED.util.getMessageProperty( msg, node.property ) );
                let status = { fill:"gray", shape:"dot", text:msg.payload };

                if( ! isNaN( msg.payload ) )
                {
                    let   data = context.get( "data" ) ?? {};
                    const last = data[msg.topic] ?? Number.MIN_SAFE_INTEGER;
                    if( msg.payload < this.threshold && this.threshold <= last )
                    {
                        status.fill = "green";
                        msg.edge = "falling";
                        send( msg );
                    }
                    data[msg.topic] = msg.payload;
                    context.set( "data", data );
                }
                else
                {
                    status.fill = "red";
                    status.text = "not a Number";
                }

                if( node.showState )
                {
                    node.status( status );
                }
            }
            done();
        });
    }

    RED.nodes.registerType("fallingEdge",FallingEdgeNode);
}
