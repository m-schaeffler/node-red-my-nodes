module.exports = function(RED) {
    var color_convert = require( 'color-convert' );

    function MatterShellySimNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.status( "" );

        node.on('input', function(msg,send,done) {
            let msgs = [];

            function sendCommand(command,data=null)
            {
                msgs.push( {
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
                        msgs = [];
                        sendCommand( "onoff.off" );
                        break;
                    case "toggle":
                        sendCommand( "onoff.toggle" );
                        break;
                    default:
                        node.error( "invalid value "+value );
                }
                return null;
            }

            switch( msg.payload.command.toLowerCase() )
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
                            if( msg.payload.data.brightness !== undefined )
                            {
                                sendCommand( "levelcontrol.movetolevel", {
                                    level:          Math.round( msg.payload.data.brightness * 2.54 ),
                                    transitionTime: Math.round( ( msg.payload.data.transition ?? 0 ) / 100 )
                                } );
                            }
                            if( msg.payload.data.temp !== undefined )
                            {
                                sendCommand( "colorcontrol.movetocolortemperature", {
                                    colorTemperatureMireds: Math.round( 1_000_000 / msg.payload.data.temp ),
                                    transitionTime:         Math.round( ( msg.payload.data.transition ?? 0 ) / 100 )
                                } );
                            }
                            if( msg.payload.data.rgb !== undefined )
                            {
                                const rgb = msg.payload.data.rgb;
                                const [hue,saturation,brightness] = color_convert.rgb.hsv.raw( rgb.red ?? rgb[0], rgb.green ?? rgb[1], rgb.blue ?? rgb[2] );
                                sendCommand( "colorcontrol.movetohueandsaturation", {
                                    hue:            Math.round( hue        / 360 * 254 ),
                                    saturation:     Math.round( saturation / 100 * 254 ),
                                    transitionTime: Math.round( ( msg.payload.data.transition ?? 0 ) * 10 )
                                } );
                                sendCommand( "levelcontrol.movetolevel", {
                                    level:          Math.round( brightness / 100 * 254 ),
                                    transitionTime: Math.round( ( msg.payload.data.transition ?? 0 ) * 10 )
                                } );
                            }
                            if( msg.payload.data.turn !== undefined )
                            {
                                setBoolean( msg.payload.data.turn );
                            }
                            if( msg.payload.data.on !== undefined )
                            {
                                setBoolean( msg.payload.data.on );
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
                    msgs = msg;
            }
            send( [msgs] );
            done();
        });
    }

    RED.nodes.registerType( "matterShellySim", MatterShellySimNode );
}
