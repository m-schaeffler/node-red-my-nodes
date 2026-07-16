module.exports = function(RED) {

    function MatterShellySimNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.status( "" );

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType( "matterShellySim", MatterShellySimNode );
}
