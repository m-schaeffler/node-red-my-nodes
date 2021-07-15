module.exports = function(RED) {
    function lorakeys(n) {
        RED.nodes.createNode(this,n);
        var keys = n.keys;
    }
    RED.nodes.registerType( "lorawan-keys", lorakeys );
}
