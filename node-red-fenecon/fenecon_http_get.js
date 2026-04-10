module.exports = function(RED) {

    function FeneconHttpGetNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems     = RED.nodes.getNode( config.fems );
        this.topic    = config.topic ?? "";
        this.complete = Boolean( config.complete );
        this.retries  = Number( config.retries ?? 0 );
        this.counter = 0;
        this.stats    = { ok:0, error:0, exception:0, retries: 0 };
        node.status( "" );

        async function doGetRequest(msg,send,done)
        {
            node.counter++;
            try
            {
                const response = await node.fems.httpRequest( node.topic || msg.topic );
                //console.log(response);
                if( response.ok )
                {
                    const result = await response.json();
                    node.stats.ok++;
                    //console.log(result);
                    if( node.complete )
                    {
                        msg.payload = result;
                    }
                    else if( Array.isArray( result ) )
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
                    node.status( {
                        fill:  "green",
                        shape: "dot",
                        text:  response.statusText
                    } );
                    send( msg );
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
                    await doGetRequest( msg, send, done );
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
            node.fems.httpMutex.withLock( async function(){
                node.counter = 0;
                await doGetRequest( msg, send, done );
            });
        });
    }

    RED.nodes.registerType( "feneconHttpGet", FeneconHttpGetNode );
}
