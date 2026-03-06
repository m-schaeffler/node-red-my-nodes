module.exports = function(RED) {

    function FeneconWebsocketNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems    = RED.nodes.getNode( config.fems );
        this.edge    = config.edge ?? "0";
        this.inlist  = JSON.parse( config.inlist ?? "[]" );
        this.risk    = Boolean( config.risk );
        this.timeout = Boolean( config.timeout );
        this.state      = "closed";
        this.socket     = null;
        this.timStartup = null;
        this.timRecv    = null;
        node.status( "" );

        function doSetState(state,color,text)
        {
            node.state = state;
            node.status( {
                fill:  color,
                shape: "dot",
                text:  text
            } );
            node.log( `new state: ${state}` );
            node.send( [
                null,
                null,
                { topic:"websocket", payload:state }
            ] );
        }

        function setStatus(state)
        {
            //console.log(state)
            doSetState( state, node.socket ? ( state == "connected" ? "green" : "yellow" ) : "gray", state );
        }

        function setError(error)
        {
            console.log("error "+error)
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
            node.timStartup = null;
            node.timRecv    = null;
            node.socket     = null;
            doSetState( "error", "red", error );
            node.error( error );
        }

        function sendEmsRequest(method,params)
        {
            const payload = {
                jsonrpc: "2.0",
                method:  method,
                params:  params,
                id:      crypto.randomUUID()
            };
            //console.log(payload)
            if( node.socket )
            {
                try
                {
                    node.socket.send( JSON.stringify( payload ) );
                }
                catch( e )
                {
                    setError( "e.message" );
                }
            }
            else
            {
                node.error( "websocket is closed" );
            }
        }

        function sendEdgeRequest(method,params)
        {
            sendEmsRequest( "edgeRpc", {
                edgeId:  node.edge,
                payload: {
                    jsonrpc: "2.0",
                    method:  method,
                    params:  params,
                    id:      crypto.randomUUID()
                }
            } );
        }

        node.on('input', function(msg,send,done) {
            switch( msg.topic )
            {
                case "open":
                    if( node.state != "connected" )
                    {
                        try
                        {
                            if( node.socket )
                            {
                                clearTimeout( node.timStartup );
                                node.socket.close();
                            }
                            node.socket = new WebSocket( `ws://${node.fems.hostname}:8085` );
                            node.socket.addEventListener( 'open',    wsConnected );
                            node.socket.addEventListener( 'message', wsReceived  );
                            node.socket.addEventListener( 'close',   wsClosed    );
                            node.socket.addEventListener( 'error',   wsError     );
                            setStatus( "opening" );
                            node.timStartup = setTimeout( wsTimeout, 1000 );
                        }
                        catch( e )
                        {
                            //console.log(e)
                            setError( e.message );
                        }
                    }
                    else
                    {
                        node.warn( 'already connected' );
                        setStatus( "connected" );
                    }
                    break;
                case "close":
                    if( node.socket )
                    {
                        clearTimeout( node.timStartup );
                        node.timStartup = null;
                        node.socket.close();
                        node.socket = null;
                        setStatus( "closing" );
                    }
                    else
                    {
                        node.warn( 'already closed' );
                        setStatus( "closed" );
                    }
                    break;
                default:
                    if( node.state != "connected" )
                    {
                        node.error( `cannot send in ${node.state} state` );
                    }
                    else if( node.risk !== true )
                    {
                        node.warn( 'cannot send without accepting the risk' );
                    }
                    else
                    {
                        //console.log(msg.topic,msg.payload)
                        const help = msg.topic.split( '/' );
                        const payload = {
                            componentId: help[0],
                            properties: [{
                                name:  help[1],
                                value: msg.payload
                            }]
                        };
                        //console.log("updateComponentConfig",payload);
                        sendEdgeRequest( "updateComponentConfig", payload );
                    }
            }
            done();
        });

        function wsConnected(event)
        {
            //console.log('WebSocket connection established!',event);
            setStatus( "authenticate" );
            sendEmsRequest( "authenticateWithPassword", { password: node.fems.password } );
        }

        function wsReceived(event)
        {
            //console.log('Message from server: ', event.data);
            const data = JSON.parse( event.data );
            switch( node.state )
            {
                case "authenticate":
                    setStatus( "subscribeEdges" );
                    sendEmsRequest( "subscribeEdges", { edges: [node.edge] } );
                    break;
                case "subscribeEdges":
                    setStatus( "getEdgeConfig" );
                    sendEdgeRequest( "getEdgeConfig", {} );
                    break;
                case "getEdgeConfig":
                    if( data?.result?.payload?.result?.components )
                    {
                        node.send( [
                            null,
                            { topic:"edgeConfig", payload:data.result.payload.result.components },
                            null
                        ] );
                    }
                    else
                    {
                        node.warn( data );
                    }
                    setStatus( "subscribeChannels" );
                    sendEdgeRequest( "subscribeChannels", { count:0, channels: node.inlist } );
                    break;
                case "subscribeChannels":
                    clearTimeout( node.timStartup );
                    node.timStartup = null;
                    if( node.timeout )
                    {
                        node.timRecv = setTimeout( wsTimeoutReceive, 10000 );
                    }
                    setStatus( "connected" );
                    break;
                case "connected":
                    if( data.params )
                    {
                        switch( data.params.payload.method )
                        {
                            case 'currentData':
                                //console.log(data.params.payload.params)
                                if( node.timRecv )
                                {
                                    node.timRecv.refresh();
                                }
                                node.send( [
                                    { topic:data.params.payload.method, payload:data.params.payload.params },
                                    null,
                                    null
                                ] );
                                break;
                            case "edgeConfig":
                                //console.log(data.params.payload.params.components)
                                node.send( [
                                    null,
                                    { topic:"edgeConfig", payload:data.params.payload.params.components },
                                    null
                                ] );
                                break;
                            default:
                                node.warn( "unknown method " + data.params.payload.method );
                        }
                    }
                    break;
                default:
                    node.error( "wsReceived: unkown state " + node.state );
            }
        }

        function wsError(event)
        {
            //console.error('WebSocket error:', event);
            if( node.socket )
            {
                setError( "websocket error" );
            }
        }

        function wsClosed(event)
        {
            //console.log('WebSocket connection closed:', event.code, event.reason);
            node.socket = null;
            setStatus( "closed" );
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
            node.timStartup = null;
            node.timRecv    = null;
        }

        function wsTimeout()
        {
            //console.log('WebSocket startup timeout');
            const help = node.socket;
            setError( "websocket startup timeout" );
            help.close();
        }

        function wsTimeoutReceive()
        {
            console.log('WebSocket receive timeout');
            const help = node.socket;
            //setError( "websocket receive timeout" );
            /*
            help.close();
            */
            node.warn("websocket receive timeout");
        }

        node.on('close', function() {
            if( node.socket )
            {
                node.socket.removeEventListener( 'open',    wsConnected );
                node.socket.removeEventListener( 'message', wsReceived  );
                node.socket.removeEventListener( 'close',   wsClosed    );
                node.socket.removeEventListener( 'error',   wsError     );
                node.socket.close();
            }
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
        });
    }

    RED.nodes.registerType( "feneconWebsocket", FeneconWebsocketNode );
}
