module.exports = function(RED) {

    function FeneconHttpGetNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems = RED.nodes.getNode( config.fems );

        node.on('input', async function(msg,send,done) {
            const url = `http://${node.fems.hostname}:80/rest/channel/${msg.topic}`;
            console.log(url);
            const response = await fetch( url, { headers: { Authorization: node.fems.auth } } );
            console.log(response);
            if( response.ok )
            {
                const result = await response.json();
                console.log(result);
                if( Array.isArray( result ) )
                {
                    msg.payload = {};
                    for( const i of result )
                    {
                        if( i.value !== undefined )
                        {
                            const t = i.address.split( "/" );
                            msg.payload[t[0]] ??= {};
                            msg.payload[t[0]][t[1]] = i.value;
                        }
                    }
                }
                else
                {
                    msg.payload = result.value;
                }
                send( msg );
                done();
            }
            else
            {
                const result = await response.text();
                console.log(result);
                done( `Response status: ${response.status} (${response.statusText})` );
            }
        });
    }

    RED.nodes.registerType( "feneconHttpGet", FeneconHttpGetNode );
}
