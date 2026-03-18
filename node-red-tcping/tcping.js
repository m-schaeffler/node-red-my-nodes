const Net = require( 'net' );

module.exports = function(RED) {

    function TcPingNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.host   = config.host ?? "";
        this.port   = Number( config.port ?? 80 );
        this.family = Number( config.family ?? 0 );
        this.openSockets = [];
        node.status( "" );

        node.on('input', async function(msg,send,done) {
                const socket = new Net.Socket();
                node.openSockets.push( socket );
                msg.ping = {
                    host:   node.host,
                    port:   node.port,
                    family: null,
                    ip:     null
                };

                function sendResult(result)
                {
                    msg.payload = result;
                    send( msg );
                    const index = node.openSockets.indexOf( socket );
                    if( index > -1 )
                    {
                        node.openSockets.splice( index, 1 );
                    }
                    done();
                }

                function socketConnectionAttempt(ip,port,family)
                {
                    console.log("socketConnectionAttempt",ip,port,family)
                    msg.ping.ip     = ip;
                    msg.ping.family = family;
                }

                function socketConnect()
                {
                    console.log("socketConnect")
                    socket.end();
                    sendResult( Date.now() - start );
                }

                function socketError(event)
                {
                    console.log("socketError",event.message)
                    msg.ping.error = event.message;
                    sendResult( false );
                }

                socket.addListener( "connectionAttempt", socketConnectionAttempt );
                socket.addListener( "connectionAttemptFailed", socketConnectionAttemptFailed );
                socket.addListener( "connectionAttemptTimeout", socketConnectionAttemptTimeout );
                socket.addListener( "connect", socketConnect );
                socket.addListener( "close", socketClose );
                socket.addListener( "error", socketError );
                const start  = Date.now();
                socket.connect( {
                    family: node.family,
                    host:   msg.ping.host,
                    port:   msg.ping.port
                } );
        });

        node.on('close', function() {
            for(const i of node.openSockets )
            {
                console.log("close",i.connecting)
                i.destroy();
            }
        });
    }

    function socketConnectionAttemptFailed(event)
    {
        console.log("socketConnectionAttemptFailed",event)
    }

    function socketConnectionAttemptTimeout(event)
    {
        console.log("socketConnectionAttemptTimeout",event)
    }

    function socketClose(hadError)
    {
        console.log("socketClose",hadError)
    }

    RED.nodes.registerType( "tcPing", TcPingNode );
}
