module.exports = function(RED) {
    function ConfDualLedNode(n) {
        RED.nodes.createNode(this,n);
        this.temp_warm = n.temp_warm;
        this.temp_cold = n.temp_cold;
    }
    RED.nodes.registerType( "confDualLed", ConfDualLedNode );
}
