module.exports = function(RED) {

    function FeneconHttpPutNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems = RED.nodes.getNode( config.fems );

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType( "feneconHttpPut", FeneconHttpPutNode );
}
