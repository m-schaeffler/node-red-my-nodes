module.exports = function(RED) {

    function MatterConnManNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.restart   = Number( config.restart ?? 5 ) * 1000;
        this.state      = "init";
        this.timStart   = null;
        this.timRestart = null;
        node.status( "" );
        node.timStart = setTimeout( started, 750 );

        function openConnection()
        {
            //console.log("    openConnection")
            node.log("    openConnection");
            node.send( { topic: "open" } );
        }

        function checkState()
        {
            let color;
            //console.log("  checkState",node.state)
            switch( node.state )
            {
                case "init":
                    openConnection();
                    color = "gray";
                    break;
                case "connected":
                    clearTimeout ( node.timRestart );
                    node.timRestart = null;
                    color = "green";
                    break;
                case "closed":
                case "error":
                    node.timRestart = setTimeout( restart, 2 * node.restart );
                    color = "red";
                    break;
                default:
                    color = "yellow";
            }

            node.status({ fill: color, shape: "dot", text: node.state });
        }

        node.on('input', function(msg,send,done) {
            //console.log("input", msg.payload)
            node.log( msg.payload );
            node.state =  msg.payload;
            checkState();
            done();
        });

        function started() {
            //console.log("started")
            node.timStart  = null;
            checkState();
        }

        function restart() {
            //console.log("restart")
            openConnection();
            node.timRestart = setTimeout( restart, node.restart );
        }

        node.on('close', function() {
            clearTimeout ( node.timStart   );
            clearTimeout ( node.timRestart );
        });
    }

    RED.nodes.registerType( "matterConnMan", MatterConnManNode );
}
