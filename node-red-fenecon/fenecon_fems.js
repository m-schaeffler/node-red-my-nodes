module.exports = function(RED) {
    function femsNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.hostname = config.hostname ?? "";
        this.auth     = `Basic ${Buffer.from( "owner:owner", "utf-8" ).toString( "base64" )}`;

        this.httpUrl = function(topic) {
            return `http://${node.hostname}:80/rest/channel/${topic}`;
        }

        this.httpOptions = function(payload=null) {
            let result = {
                headers: {
                    Authorization: node.auth
                },
                method: payload ? "POST" : "GET",
                signal: AbortSignal.timeout( 1000 )
            };
            if( payload )
            {
                result.body = JSON.stringify( { value: payload } );
            }
            return result;
        }

    }
    RED.nodes.registerType( "feneconFems", femsNode );
}
