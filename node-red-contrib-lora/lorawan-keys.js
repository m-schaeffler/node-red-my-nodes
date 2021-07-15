module.exports = function(RED) {
    function lorakeys(conf) {
        RED.nodes.createNode(this,n);
        this.keys = conf.keys;
    }
    RED.nodes.registerType( "lorawan-keys", lorakeys );
}
