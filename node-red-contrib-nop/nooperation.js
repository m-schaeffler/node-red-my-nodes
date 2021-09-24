module.exports = function(RED) {

    function NoOperationNode(config) {
        RED.nodes.createNode(this,config);
        this.config = config;
        var node = this;
        node.on('input', function(msg,send,done) {
            send(msg);
            done();
        });
    }

    RED.nodes.registerType("nooperation",NoOperationNode);
}
