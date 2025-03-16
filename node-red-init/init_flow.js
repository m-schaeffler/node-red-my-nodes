module.exports = function(RED) {

    function FormatInitFlow(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.name         = config.name ?? "";
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.flowContext  = this.context().flow;
        node.status( "" );
        node.log( "init "+node.name+" constructed ("+node.property+")" );
        node.flowContext.get( node.name, function(err,value)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                node.log( "init "+node.name+" flow.get="+value );
                if( value === undefined )
                {
                    node.flowContext.set( node.name, node.property, function(err)
                    {
                        if( err )
                        {
                            node.error( err );
                        }
                        else
                        {
                            node.log( "init "+node.name+" flow.set sucessfull" );
                        }
                    } );
                }
            }
        } );

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType("initFlow",FormatInitFlow);
}
