module.exports = function(RED) {
    function femsNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.hostname = config.hostname;
    }
    RED.nodes.registerType( "feneconFems", femsNode );
}
