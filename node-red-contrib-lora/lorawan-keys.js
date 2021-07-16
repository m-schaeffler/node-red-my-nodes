module.exports = function(RED) {
    function lorakeys(n) {
        RED.nodes.createNode(this,n);
        var keys = JSON.parse( n.keys );

        this.getKey = function(devaddr) {
            return keys[devaddr];
        };
    }
    RED.nodes.registerType( "lorawan-keys", lorakeys );
}
