module.exports = function(RED) {

    function FeneconHttpPostNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems = RED.nodes.getNode( config.fems );
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            try
            {
                const response = await fetch(
                    node.fems.httpUrl( msg.topic ),
                    node.fems.httpOptions( msg.payload )
                );
                console.log(response);
                if( response.ok )
                {
                    node.status( {
                        fill:  "green",
                        shape: "dot",
                        text:  response.statusText
                    } );
                    done();
                }
                else
                {
                    const result = await response.text();
                    console.log(result);
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
                console.log(e);
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
