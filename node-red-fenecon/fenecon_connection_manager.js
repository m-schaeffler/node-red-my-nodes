module.exports = function(RED) {

    function FeneconConnManNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.cyclic    = Number( config.cyclic ?? 15 ) * 1000;
        this.state     = "closed";
        this.timStart  = null;
        this.timCyclic = null;
        this.flow      = this.context().flow;
        node.status( "" );
        node.flow.set( "wsAlive_2", Date.now(), function(err)
        {
            if( err )
            {
                node.error( err );
            }
            else
            {
                console.log( "flow.set sucessfull" );
            }
        } );
        node.timStart = setTimeout( function() { node.emit("started"); }, 500 );

        function checkState()
        {
        }

        node.on('input', function(msg,send,done) {
            console.log("input", msg.payload)
            node.log( msg.payload );
            node.state =  msg.payload;
            node.flow.set( "wsAlive_2", Date.now() );
            checkState();
            done();
        });

        node.on('started', function() {
            console.log("started")
            node.timStart  = null;
            node.timCyclic = setInterval( function() { node.emit("cyclic"); }, node.cyclic );
            checkState();
        });

        node.on('cyclic', function() {
            console.log("cyclic")
            checkState();
        });

        node.on('close', function() {
            clearTimeout( node.timStart );
            clearTimeout( node.timCyclic );
        });
    }

    RED.nodes.registerType( "feneconConnMan", FeneconConnManNode );
}
