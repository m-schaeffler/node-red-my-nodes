const Matter = require( './matter.js' );

module.exports = function(RED) {

    function MatterServerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.host         = config.host ?? "";
        this.port         = config.port ?? 5580;
        this.statusPrefix = config.statusPrefix ? config.statusPrefix+'/' : "";
        this.eventPrefix  = config.eventPrefix  ? config.eventPrefix +'/' : "";
        this.contextVar   = config.contextVar   ?? "matter";
        this.contextStore = config.contextStore ?? "none";
        this.matter     = new Matter();
        this.state      = "closed";
        this.socket     = null;
        this.timStartup = null;
        this.timRecv    = null;
        this.flow       = this.context().flow;
        node.status( "" );
        if( node.contextStore !== "none" )
        {
            node.flowcontext.get( node.contextVar, node.contextStore, function(err,value)
            {
                if( err )
                {
                    node.error( err );
                }
                else
                {
                    //console.log( "context read", value );
                    if( value !== undefined )
                    {
                        //node.matter = value;
                    }
                }
            } );
        }

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
                { topic:"matter", payload:state }
            ] );
        }

        function setStatus(state)
        {
            //console.log("state "+state)
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

        function sendCommand(command,id="",args={})
        {
            //console.log("send command "+command+" "+id)
            const payload = {
                message_id: `${command}|${id}`,
                command:    command,
                args:       args
            };
            if( node.socket )
            {
                try
                {
                    node.socket.send( JSON.stringify( payload ) );
                }
                catch( e )
                {
                    setError( e.message );
                }
            }
            else
            {
                node.error( "websocket is closed" );
            }
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
                            node.socket = new WebSocket( `ws://${node.host}:${node.port}/ws` );
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
          console.log(node.matter._dataById);
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
                    else
                    {
                        console.log(msg.topic,msg.payload)
                        /*
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
                        */
                    }
            }
            done();
        });

        function wsConnected(event)
        {
            //console.log('WebSocket connection established!',event);
            setStatus( "waitForState" );
        }

        function wsReceived(event)
        {
            //console.log('Message from server: ', event.data);
            const data = JSON.parse( event.data );
            switch( node.state )
            {
                case "waitForState":
                    setStatus( "start_listening" );
                    sendCommand( "start_listening" );
                    break;
                case "start_listening":
                    if( data.result !== undefined && data.message_id == "start_listening|" )
                    {
                        clearTimeout( node.timStartup );
                        node.matter.storeNodes( data.result );
                        setStatus( "connected" );
                        node.matter.forAllIds( function(id){
                            sendCommand( "get_node_ip_addresses", id, {
                                node_id:      id,
                                prefer_cache: false,
                                scoped:       false
                            } );
                        } );
                    }
                    else
                    {
                        setError( "invalid answer" );
                    }
                    break;
                case "connected":
                    if( data.result !== undefined )
                    {
                        // command result
                        const [message,param] = data.message_id.split( "|" );
                        switch( message )
                        {
                            case "get_nodes":
                                node.matter.storeNodes( data.result );
                                break;
                            case "get_node_ip_addresses":
                                node.matter.storeIP( param, data.result );
                                break;
                        }
                    }
                    else if( data.error_code !== undefined )
                    {
                        // command error
                        node.error( `${data.message_id}: ${data.details}` );
                    }
                    else
                    {
                        // Event
                        switch( data.event )
                        {
                            case "attribute_updated":
                                node.matter.setAttribute( payload.data[0], payload.data[1], payload.data[2] );
                                break;
                            case "node_event":
                                //handleEvent( data.data );
                                break;
                            case "node_added":
                                node.warn( data.event );
                                // fall through
                            case "node_updated":
                                node.matter.storeNode( data.data );
                                break;
                            case "node_removed":
                                node.warn( data.event );
                                node.matter.deleteNode( data.data );
                                break;
                            case undefined:
                                node.error( "invalid message", data );
                                break;
                            default:
                                node.warn( "Event: " + data.event );
                        }
                    }
                    break;
                default:
                    node.error( "wsReceived: unkown state " + node.state );
            }
            node.matter.sendChanged( function(name,data){
                node.send( [
                    { topic: name, payload: data },
                    null,
                    null
                ] );
            } );
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
            if( node.state !== "error" )
            {
                setStatus( "closed" );
            }
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
            //console.log('WebSocket receive timeout');
            node.warn("websocket receive timeout");
            node.send( [
                null,
                null,
                { topic:"matter", payload:"timeout" }
            ] );
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

    RED.nodes.registerType( "matterServer", MatterServerNode );
}
