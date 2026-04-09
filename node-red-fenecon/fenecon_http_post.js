module.exports = function(RED) {

    function FeneconHttpPostNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems    = RED.nodes.getNode( config.fems );
        this.topic   = config.topic ?? "";
        this.retries = Number( config.retries ?? 0 );
        this.counter = 0;
        this.stats   = { ok:0, error:0, exception:0, retries:0 };
        node.status( "" );

        async function doPostRequest(msg,send,done)
        {
            node.counter++;
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
                if( e.name === "TimeoutError" && node.counter <= node.retries )
                {
                    node.log( "Timeout-Error #"+node.counter );
                    node.stats.retries++;
                    node.status( {
                        fill:  "yellow",
                        shape: "dot",
                        text:  e.name
                    } );
                    await doPostRequest( msg, send, done );
                }
                else
                {
                    node.stats.exception++;
                    node.status( {
                        fill:  "red",
                        shape: "dot",
                        text:  e.name
                    } );
                    done( e );
                }
            }
        }

        node.on('input', function(msg,send,done) {
            node.counter = 0;
            node.fems.httpMutex.withLock( async function(){
                await doPostRequest( msg, send, done );
            });
        });
    }

    RED.nodes.registerType( "feneconHttpPost", FeneconHttpPostNode );
}
