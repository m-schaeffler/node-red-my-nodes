module.exports = function(RED) {

    function InitGlobal(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.name          = config.name ?? "name";
        this.value         = config.value ?? "value";
        this.valueStr      = this.value;
        this.valueType     = config.valueType ?? "str";
        this.globalContext = this.context().global ?? this.context(); // Unit-Tests!
        node.status( "" );
        switch( node.valueType )
        {
            case "num":
                node.value = Number( node.value );
                break;
            case "bool":
                node.value = Boolean( node.value );
                break;
            case "json":
                node.value = JSON.parse( node.value );
                break;
        }
        node.log( "init "+node.name+" constructed ("+node.value+":"+node.valueType+")" );
        node.globalContext.get( node.name, function(err,value)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                node.log( "init "+node.name+" global.get="+value );
                if( value === undefined )
                {
                    node.globalContext.set( node.name, node.value, function(err)
                    {
                        if( err )
                        {
                            node.error( err );
                        }
                        else
                        {
                            node.log( "init "+node.name+" global.set sucessfull" );
                            node.status( node.valueStr );
                        }
                    } );
                }
                else
                {
                    node.status( value );
                }
            }
        } );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                node.log("invalid message")
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.globalContext.set( node.name, node.value );
                node.status( node.valueStr );
            }
            else
            {
                node.globalContext.set( node.name, msg.payload );
                node.status( msg.payload );
            }
            done();
        });
    }

    RED.nodes.registerType("init-global",InitGlobal);
}
