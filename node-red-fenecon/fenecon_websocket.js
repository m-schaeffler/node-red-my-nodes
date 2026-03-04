module.exports = function(RED) {

    function FeneconWebsocketNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.fems   = RED.nodes.getNode( config.fems );
        this.state  = "closed";
        this.socket = null;
        node.status( "" );

        function setStatus(state)
        {
            node.state = state;
            node.status( {
                fill:  node.socket ? "green" : "gray",
                shape: "dot",
                text:  state
            } );
        }

        function setError(error)
        {
            node.status( {
                fill:  "red",
                shape: "dot",
                text:  error
            } );
        }

        function doSend(payload)
        {
            if( node.socket )
            {
                node.socket.send( JSON.stringify( payload ) );
            }
            else
            {
                node.error( "websocket is closed" );
            }
        }

        function sendEmsRequest(method,params)
        {
            const uuid = crypto.randomUUID();
            const payload = {
                jsonrpc: "2.0",
                method:  method,
                params:  params,
                id:      uuid
            };
            console.log(payload)
            doSend( payload );
        }

        function sendEdgeRequest()
        {}

        node.on('input', function(msg,send,done) {
            switch( msg.topic )
            {
                case "open":
                    node.socket = new WebSocket( `ws://${node.fems.hostname}:8085` );
                    node.socket.addEventListener( 'open',    function(event) { node.emit("wsConnected",event); } );
                    node.socket.addEventListener( 'message', function(event) { node.emit("wsReceived", event); } );
                    node.socket.addEventListener( 'close',   function(event) { node.emit("wsClosed",   event); } );
                    node.socket.addEventListener( 'error',   function(event) { node.emit("wsError",    event); } );
                    setStatus( "opening" );
                    break;
                case "close":
                    node.socket.close();
                    node.socket = null;
                    setStatus( "closed" );
                    break;
            }
            done();
        });

        node.on('wsConnected', function(event) {
            console.log('WebSocket connection established!',event);
            setStatus( "connected" );
            sendEmsRequest( "authenticateWithPassword", { password: node.fems.password } );
        });

        node.on('wsReceived', function(event) {
            console.log('Message from server: ', event.data);
        });

        node.on('wsError', function(event) {
            console.error('WebSocket error:', event);
            setError( event.message );
        });

        node.on('wsClosed', function(event) {
            console.log('WebSocket connection closed:', event.code, event.reason);
            node.socket = null;
            setStatus( "closed" );
        });

        node.on('close', function() {
            if( node.socket )
            {
                node.socket.close();
            }
        });
    }

    RED.nodes.registerType( "feneconWebsocket", FeneconWebsocketNode );
}
