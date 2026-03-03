module.exports = function(RED) {
    function femsNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.hostname = config.hostname ?? "";
        this.auth     = `Basic ${Buffer.from( "owner:owner", "utf-8" ).toString( "base64" )}`;

        this.options = function() {
            return {
                headers: {
                    Authorization: node.auth
                },
                signal: AbortSignal.timeout( 1000 )
            };
        }

    }
    RED.nodes.registerType( "feneconFems", femsNode );
}
