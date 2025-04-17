module.exports = function(RED) {

    function BtHomeNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.devices      = JSON.parse( config.devices ?? "{}" );
        this.contextStore = config.contextStore ?? "none";
        this.data         = {};
        node.status( "" );
        if( node.contextStore !== "none" )
        {
            node.flowcontext.get( "bthome", node.contextStore, function(err,value)
            {
                if( err )
                {
                    node.error( err );
                }
                else
                {
                    console.log( "context read", value );
                    if( value !== undefined )
                    {
                        node.data = value;
                    }
                }
            } );
        }

        node.on('input', function(msg,send,done) {
            console.log(node.data)
            node.data[msg.topic] = msg.payload;
            if( node.contextStore !== "none" )
            {
                node.flowcontext.set( "bthome", node.data, node.contextStore );
            }
            send( {topic:"bthome",payload:node.data} )
            done();
        });
    }

    RED.nodes.registerType("bthome",BtHomeNode);
}
