module.exports = function(RED) {

    function FeneconConnManNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.state      = "closed";
        this.timStartup = null;
        this.timRecv    = null;
        this.flow       = this.context().flow;
        node.status( "" );

        node.on('input', function(msg,send,done) {
            done();
        });

        node.on('close', function() {
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
        });
    }

    RED.nodes.registerType( "feneconConnMan", FeneconConnManNode );
}
