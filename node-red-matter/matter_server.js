const Types = require( './types.js' );

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
        this.data       = {};
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
                        node.data = value;
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

        function sendCommand(command,args={})
        {
            const payload = {
                message_id: command,
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
                    if( data.result !== undefined )
                    {
                        setStatus( "connected" );
                    }
                    else
                    {
                        setError( "invalid answer" );
                    }
                    break;
                case "connected":
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
