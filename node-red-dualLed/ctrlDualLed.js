module.exports = function(RED) {

    function CtrlDualLedNode(config) {
        RED.nodes.createNode(this,config);
        this.config = config;
        var node = this;

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType("ctrlDualLed",CtrlDualLedNode);
}
