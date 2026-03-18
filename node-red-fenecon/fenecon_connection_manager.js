module.exports = function(RED) {

    function FeneconConnManNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.cyclic    = Number( config.cyclic ?? 15 ) * 1000;
        this.state     = "init";
        this.timStart  = null;
        this.timCyclic = null;
        this.flow      = this.context().flow;
        node.status( "" );
        node.flow.set( "wsAlive", Date.now(), function(err)
        {
            if( err )
            {
                node.error( err );
            }
        } );
        node.timStart = setTimeout( started, 500 );

        function openConnection()
        {
            //console.log("    openConnection")
            node.log("    openConnection");
            node.send( { topic: "open" } );
        }

        function checkState()
        {
            let delta = Date.now() - node.flow.get( "wsAlive" );
            let color;
            //console.log("  checkState",node.state,delta)
            switch( node.state )
            {
                case "connected":
                    color = "green";
                    break;
                case "init":
                    openConnection();
                    color = "gray";
                    delta = 0;
                    break;
                case "closed":
                case "error":
                    if( delta > 4*node.cyclic )
                    {
                        openConnection();
                    }
                    color = "red";
                    delta = 0;
                    break;
                default:
                    color = "yellow";
            }

            if( delta > 8*node.cyclic )
            {
                node.error( "Fenecon timeout" );
                openConnection();
                color = "red";
            }
            else if( delta > node.cyclic )
            {
                node.warn( "Fenecon timeout" );
                color = "yellow";
            }

            node.status({ fill: color, shape: "dot", text: delta });
        }

        node.on('input', function(msg,send,done) {
            //console.log("input", msg.payload)
            node.log( msg.payload );
            node.state =  msg.payload;
            node.flow.set( "wsAlive", Date.now() );
            checkState();
            done();
        });

        function started() {
            //console.log("started")
            node.timStart  = null;
            node.timCyclic = setInterval( cyclic, node.cyclic );
            checkState();
        }

        function cyclic() {
            //console.log("cyclic")
            checkState();
        };

        node.on('close', function() {
            clearTimeout ( node.timStart );
            clearInterval( node.timCyclic );
        });
    }

    RED.nodes.registerType( "feneconConnMan", FeneconConnManNode );
}
