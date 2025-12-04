module.exports = function(RED) {

    function Ws90Node(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.contextStore = config.contextStore ?? "none";
        this.refheight    = Number( config.refheight ?? 0 );
        this.storage      = {};
        node.status( "" );
        if( node.contextStore !== "none" )
        {
            node.context.get( "storage", node.contextStore, function(err,value)
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
                        node.storage = value;
                    }
                }
            } );
        }

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType( "ws90", Ws90Node );
}
