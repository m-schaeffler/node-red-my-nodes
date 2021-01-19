module.exports = function(RED) {

    function NoOperationNode(config) {
        RED.nodes.createNode(this,config);
        this.config = config;
        var node = this;
        node.on('input', function(msg) {
            node.send(msg);
        });
    }

    RED.nodes.registerType("nooperation",NoOperationNode);
}
