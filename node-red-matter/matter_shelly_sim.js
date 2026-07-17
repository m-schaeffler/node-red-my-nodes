module.exports = function(RED) {

    function MatterShellySimNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.status( "" );

        node.on('input', function(msg,send,done) {
            function sendCommand(command,data=null)
            {
                send( {
                    topic:   msg.topic,
                    payload: {
                        command: command,
                        data:    data
                    }
                } );
            }

            function setBoolean(value)
            {
                switch( value )
                {
                    case 1:
                    case "1":
                    case "on":
                    case true:
                    case "true":
                        sendCommand( "onoff.on" );
                        break;
                    case 0:
                    case "0":
                    case "off":
                    case false:
                    case "false":
                    case "disabled":
                        sendCommand( "onoff.off" );
                        break;
                    case "toggle":
                        sendCommand( "onoff.toggle" );
                        break;
                    default:
                        node.error( "invalid value "+value );
                }
            }

            switch( msg.payload.command )
            {
                case "relay":
                case "switch":
                case "output":
                case "light":
                    switch( typeof msg.payload.data )
                    {
                        case "boolean":
                        case "number":
                        case "string":
                            setBoolean( msg.payload.data );
                            break;
                        case "object":
                            for( const i in msg.payload.data )
                            {
                                switch( i )
                                {
                                    case "turn":
                                        setBoolean( msg.payload.data.turn );
                                        break;
                                    case "on":
                                        setBoolean( msg.payload.data.on );
                                        break;
                                    case "brightness":
                                        sendCommand( "levelcontrol.movetolevel", { level: Math.round(msg.payload.data.brightness*2.54), transitionTime: msg.payload.data.transition ?? null, optionsMask: 0x00, optionsOverride: 0x00 } );
                                        break;
                                    case "transition":
                                        break;
                                    default:
                                        node.error( "invalid attribute " + i );
                                }
                            }
                            break;
                    }
                    break;
                case "roller":
                case "cover":
                    switch( msg.payload.data )
                    {
                        case "open":
                            sendCommand( "windowcovering.open" );
                            break;
                        case "close":
                            sendCommand( "windowcovering.close" );
                            break;
                        case "stop":
                            sendCommand( "windowcovering.stop" );
                            break;
                    }
                    break;
                case "position":
                    sendCommand( "windowcovering.gotolift", msg.payload.data );
                    break;
                default:
                    send( msg );
            }
            done();
        });
    }

    RED.nodes.registerType( "matterShellySim", MatterShellySimNode );
}
