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
            let   family;
            msg.ping = {
                family: null,
                ip:     null
            };
            switch( typeof msg.payload )
            {
                case "undefined":
                    msg.ping.host = node.host;
                    msg.ping.port = node.port;
                    family        = node.family;
                    break;
                case "string":
                  {
                    const help = msg.payload.split( ':' );
                    msg.ping.host = help[0];
                    msg.ping.port = Number( help?.[1] ?? node.port );
                    family        = node.family;
                  }
                    break;
                case "object":
                    msg.ping.host = msg.payload.host ?? node.host;
                    msg.ping.port = Number( msg.payload.port ?? node.port );
                    family        = Number( msg.payload.family ?? node.family );
                    break;
                default:
                    done( "unknown type of payload: "+msg.payload );
                    return;
            }
            if( ! msg.ping.host )
            {
                done( "invalid host: "+msg.ping.host );
                return;
            }
            if( ! ( msg.ping.port > 0 && msg.ping.port <= 0xFFFF && Number.isInteger( msg.ping.port ) ) )
            {
                //console.log("invalid port: "+msg.ping.port)
                done( "invalid port: "+msg.ping.port );
                return;
            }
            if( ! ( family === 0 || family === 4 || family === 6 ) )
            {
                //console.log("invalid family: "+family)
                done( "invalid family: "+family );
                return;
            }

            function sendResult(result,color)
            {
                msg.payload = result;
                send( msg );
                const index = node.openSockets.indexOf( socket );
                if( index > -1 )
                {
                    node.openSockets.splice( index, 1 );
                }
                node.status( {
                    fill:  color,
                    shape: "dot",
                    text:  msg.ping.host
                } );
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
                sendResult( Date.now() - start, "green" );
            }

            function socketError(event)
            {
                let color;
                console.log("socketError",event.code)
                msg.ping.error = event.message || `${msg.ping.host}: errno ${event.code}`;
                if( event.errno === -113 )
                {
                    color = "gray";
                }
                else
                {
                    node.error( msg.ping.error );
                    color = "red";
                }
                sendResult( false, color );
            }

            socket.addListener( "connectionAttempt", socketConnectionAttempt );
            socket.addListener( "connect", socketConnect );
            socket.addListener( "error", socketError );

            const start = Date.now();
            node.openSockets.push( socket );
            socket.connect( {
                family: family,
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

    RED.nodes.registerType( "tcPing", TcPingNode );
}
