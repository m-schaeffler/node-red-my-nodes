const Matter    = require( './matter.js' );
const SendQueue = require( './sendqueue.js' );

module.exports = function(RED) {

    function MatterServerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.flowcontext  = this.context().flow;
        this.host         = config.host ?? "";
        this.port         = config.port ?? 5580;
        this.statusPrefix = config.statusPrefix ? config.statusPrefix+'/' : "";
        this.eventPrefix  = config.eventPrefix  ? config.eventPrefix +'/' : "";
        this.contextVar   = config.contextVar ?? "";
        this.matter     = new Matter( sendCommand, handleEvent );
        this.queue      = new SendQueue();
        this.state      = "closed";
        this.timStartup = null;
        this.timRecv    = null;
        this.timReopen  = null;
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
                { topic:"matter", payload:state },
                null
            ] );
        }

        function setStatus(state)
        {
            //console.log("state "+state)
            doSetState( state, node.queue.isOpened() ? ( state == "connected" ? "green" : "yellow" ) : "gray", state );
        }

        function setError(error)
        {
            console.log("error "+error)
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
            node.queue.close();
            node.timStartup = null;
            node.timRecv    = null;
            doSetState( "error", "red", error );
            node.error( error );
        }

        function sendCommand(command,id="",args={})
        {
            //console.log("send command "+command+" "+id,args)
            try
            {
                node.queue.sendCommand( command, id, args );
            }
            catch( e )
            {
                setError( e.message );
            }
        }

        function handleEvent(name,event,data)
        {
            node.send( [
                null,
                { topic: `${node.eventPrefix}${name}/${event}`, payload: { event:event, ...data } },
                null,
                null
            ] );
        }

        node.on('input', function(msg,send,done) {

            function sendServerCommand(cmd,args={})
            {
                if( node.state == "connected" )
                {
                    sendCommand( cmd, args );
                }
                else
                {
                    node.error( `cannot send in ${node.state} state` );
                }
            }

            switch( msg.topic )
            {
                case "open":
                    if( node.state != "connected" )
                    {
                        try
                        {
                            if( node.queue.close() )
                            {
                                clearTimeout( node.timStartup );
                            }
                            clearTimeout( node.timReopen );
                            node.timReopen = null;
                            let socket = node.queue.open( `ws://${node.host}:${node.port}/ws` );
                            socket.addEventListener( 'open',    wsConnected );
                            socket.addEventListener( 'message', wsReceived  );
                            socket.addEventListener( 'close',   wsClosed    );
                            socket.addEventListener( 'error',   wsError     );
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
                    if( node.queue.close() )
                    {
                        clearTimeout( node.timStartup );
                        clearTimeout( node.timReopen );
                        node.timStartup = null;
                        node.timReopen  = null;
                        setStatus( "closing" );
                    }
                    else
                    {
                        node.warn( 'already closed' );
                        setStatus( "closed" );
                    }
                    break;
                case "get_nodes":
                    sendServerCommand( "get_nodes", { only_available: false } );
                    break;
                case "get_thread_border_routers":
                    sendServerCommand( "get_thread_border_routers" );
                    break;
                case "get_thread_diagnostics":
                    sendServerCommand( "get_thread_diagnostics", { force: true } );
                    break;
                case "timeSync":
                    if( node.state == "connected" )
                    {
                        node.matter.timeSync();
                    }
                    else
                    {
                        node.error( `cannot timesync in ${node.state} state` );
                    }
                    break;
                default:
                    if( node.state == "connected" )
                    {
                        try
                        {
                            node.matter.sendCommand( msg.topic, msg.payload.command, msg.payload.data );
                        }
                        catch(err)
                        {
                            node.error( err.message );
                        }
                    }
                    else
                    {
                        node.error( `cannot send in ${node.state} state` );
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
                        // command result
                        const [command,param] = node.queue.acknowledgeCommand( data.message_id );
                        if( command == "start_listening" )
                        {
                            clearTimeout( node.timStartup );
                            node.matter.storeNodes( data.result );
                            setStatus( "connected" );
                            node.matter.forAllIds( function(id){
                                sendCommand( "get_node_ip_addresses", id, {
                                    node_id:      id,
                                    prefer_cache: true,
                                    scoped:       false
                                } );
                            } );
                            if( node.contextVar )
                            {
                                node.flowcontext.set( node.contextVar, node.matter._dataById );
                            }
                        }
                        else
                        {
                            setError( "invalid answer" );
                        }
                    }
                    else
                    {
                        setError( "invalid answer" );
                    }
                    break;
                case "connected":
                    if( node.timRecv )
                    {
                        node.timRecv.refresh();
                    }
                    if( data.message_id !== undefined )
                    {
                        const [command,param] = node.queue.acknowledgeCommand( data.message_id );
                        if( data.result !== undefined )
                        {
                            // command result
                            switch( command )
                            {
                                case "get_nodes":
                                    node.matter.clear();
                                    node.matter.storeNodes( data.result );
                                    break;
                                case "get_node_ip_addresses":
                                    node.matter.storeIP( param, data.result );
                                    break;
                                case "device_command":
                                    //console.log(data.message_id);
                                    break;
                                case "get_thread_border_routers":
                                    node.warn(data.result);
                                    break;
                                case "get_thread_diagnostics":
                                    node.warn(data.result);
                                    break;
                            }
                        }
                        else
                        {
                            // command error
                            node.error( `${data.message_id}: ${data.details}` );
                        }
                    }
                    else
                    {
                        // Event
                        switch( data.event )
                        {
                            case "attribute_updated":
                                node.matter.setAttribute( data.data[0], data.data[1], data.data[2] );
                                break;
                            case "node_event":
                                node.matter.handleEvent( data.data );
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
                            case "server_shutdown":
                            	node.timRestart = setTimeout( wsRestart, 5000 );
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
                    { topic: node.statusPrefix+name, payload: data },
                    null,
                    null,
                    null
                ] );
            }, function(name){
                node.send( [
                    null,
                    null,
                    null,
                    { topic: name }
                ] );
            } );
        }

        function wsError(event)
        {
            //console.error('WebSocket error:', event);
            if( node.queue.isOpened() )
            {
                setError( "websocket error" );
            }
        }

        function wsClosed(event)
        {
            //console.log('WebSocket connection closed:', event.code, event.reason);
            node.queue.socket = null;
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
            setError( "websocket startup timeout" );
        }

        function wsTimeoutReceive()
        {
            //console.log('WebSocket receive timeout');
            node.warn("websocket receive timeout");
            node.send( [
                null,
                null,
                { topic:"matter", payload:"timeout" },
                null
            ] );
        }

        function wsRestart()
        {
            console.log('WebSocket restart');
            node.emit( "input", { topic: "open" } );
        }

        node.on('close', function() {
            if( node.queue.isOpened() )
            {
                node.queue.socket.removeEventListener( 'open',    wsConnected );
                node.queue.socket.removeEventListener( 'message', wsReceived  );
                node.queue.socket.removeEventListener( 'close',   wsClosed    );
                node.queue.socket.removeEventListener( 'error',   wsError     );
                node.queue.close();
            }
            clearTimeout( node.timStartup );
            clearTimeout( node.timRecv );
            clearTimeout( node.timReopen );
        });
    }

    RED.nodes.registerType( "matterServer", MatterServerNode );
}
