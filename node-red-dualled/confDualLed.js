module.exports = function(RED) {
    function ConfDualLedNode(n) {
        RED.nodes.createNode(this,n);
        var temp_warm = n.temp_warm;
        var temp_cold = n.temp_cold;
    }
    RED.nodes.registerType( "confDualLed", ConfDualLedNode );
}
