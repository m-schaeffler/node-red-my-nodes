module.exports = function(RED) {

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
                                const r = ( rgb.red   ?? rgb[0] ) / 255;
                                const g = ( rgb.green ?? rgb[1] ) / 255;
                                const b = ( rgb.blue  ?? rgb[2] ) / 255;
                                const max = Math.max( r, g, b );
                                const min = Math.min( r, g, b );
                                const delta = max - min;
                                let hue;
                                switch( max )
                                {
                                    case min:
                                        hue = 0;
                                        break;
                                    case r:
                                        hue = 60 * ( (g-b)/delta );
                                        break;
                                    case g:
                                        hue = 60 * ( (b-r)/delta + 2 );
                                        break;
                                    case b:
                                        hue = 60 * ( (r-g)/delta + 4 );
                                        break;
                                }
                                if( hue < 0 )
                                {
                                    hue += 360;
                                }
                                const saturation = max == 0 ? 0 : delta / max;
                                const brightness = max;
                                sendCommand( "colorcontrol.movetohueandsaturation", {
                                    hue:            Math.round( hue / 360 * 254 ),
                                    saturation:     Math.round( saturation * 254 ),
                                    transitionTime: Math.round( ( msg.payload.data.transition ?? 0 ) * 10 )
                                } );
                                sendCommand( "levelcontrol.movetolevel", {
                                    level:          Math.round( brightness * 254 ),
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
