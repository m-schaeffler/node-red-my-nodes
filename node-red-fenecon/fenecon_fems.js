module.exports = function(RED) {
    function femsNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.hostname = config.hostname ?? "";
        this.user     = "owner";
        this.password = "owner";
        const auth    = "Basic " + Buffer.from( `${this.user}:${this.password}`, "utf-8" ).toString( "base64" );

        this.httpRequest = function(topic,payload=undefined) {
            let options = {
                headers: {
                    Authorization: auth
                },
                signal: AbortSignal.timeout( 1000 )
            };
            if( payload !== undefined )
            {
                options.method = "POST";
                options.body   = JSON.stringify( { value: payload } );
            }
            //console.log(options)
            return fetch( `http://${node.hostname}:80/rest/channel/${topic}`, options );
        }
    }
    RED.nodes.registerType( "feneconFems", femsNode );
}
