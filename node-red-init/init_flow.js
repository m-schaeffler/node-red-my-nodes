module.exports = function(RED) {

    function InitFlowNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.name        = config.name ?? "name";
        this.value       = config.value ?? "value";
        this.valueType   = config.valueType ?? "str";
        this.datacontext = config.global ? this.context().global : this.context().flow;
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

        function writeLog(a,b="")
        {
            node.log( `init ${node.name} ${a} ${b}` );
        }

        function setStatus(value)
        {
            //let status = typeof value == "object" ? JSON.stringify(value) : value.toString();
            let status = JSON.stringify( value );
            if( status.length >= 17 )
            {
                status = status.slice( 0, 15 ) + "...";
            }
            node.status( status );
        }

        writeLog( "constructed", `(${JSON.stringify(node.value)}:${node.valueType})` );
        node.datacontext.get( node.name, function(err,value)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                writeLog( "flow.get", value );
                if( value === undefined )
                {
                    node.datacontext.set( node.name, node.value, function(err)
                    {
                        if( err )
                        {
                            node.error( err );
                        }
                        else
                        {
                            writeLog( "flow.set sucessfull" );
                            setStatus( node.value );
                        }
                    } );
                }
                else
                {
                    setStatus( value );
                }
            }
        } );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                writeLog( "invalid message" );
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.datacontext.set( node.name, node.value );
                setStatus( node.value );
            }
            else
            {
                node.datacontext.set( node.name, msg.payload );
                setStatus( msg.payload );
            }
            done();
        });
    }

    RED.nodes.registerType( "init-flow", InitFlowNode );
}
