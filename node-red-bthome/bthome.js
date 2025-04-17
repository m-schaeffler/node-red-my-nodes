module.exports = function(RED) {

    function BtHomeNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.devices = JSON.parse( config.devices ?? "{}" );
        node.status( "" );

        node.on('input', function(msg,send,done) {
            done();
        });
    }

    RED.nodes.registerType("msg-resend2",BtHomeNode);
}
