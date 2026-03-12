module.exports = function(RED) {

    function FeneconHttpPostNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems  = RED.nodes.getNode( config.fems );
        this.topic = config.topic ?? "";
        this.stats = { ok:0, error:0, exception:0 };
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            try
            {
                const response = await node.fems.httpRequest( node.topic || msg.topic, msg.payload );
                //console.log(response);
                if( response.ok )
                {
                    node.stats.ok++;
                    node.status( {
                        fill:  "green",
                        shape: "dot",
                        text:  response.statusText
                    } );
                    done();
                }
                else
                {
                    //const result = await response.text();
                    //console.log(result);
                    node.stats.error++;
                    node.status( {
                        fill:  "red",
                        shape: "dot",
                        text:  response.statusText
                    } );
                    done( `Response status: ${response.status} (${response.statusText})` );
                }
            }
            catch( e )
            {
                //console.log(e);
                node.stats.exception++;
                node.status( {
                    fill:  "red",
                    shape: "dot",
                    text:  e.name
                } );
                done( e );
            }
        });
    }

    RED.nodes.registerType( "feneconHttpPost", FeneconHttpPostNode );
}
