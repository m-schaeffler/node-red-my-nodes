module.exports = function(RED) {

    function ReduceNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";
        this.minMean  = Number( config.minMean );
        this.maxMean  = Number( config.maxMean );
        this.minData  = Number( config.minData );
        this.algo     = config.algo;

        node.on('input', function(msg,send,done) {
            const payload = Number( RED.util.getMessageProperty( msg, node.property ) );

            done();
        });
    }

    RED.nodes.registerType("reduce",ReduceNode);
}
