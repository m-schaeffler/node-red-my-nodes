module.exports = function(RED)
{

    function HourMeterNode(config)
    {
        RED.nodes.createNode(this,config);
        this.config       = config;
        this.topic        = config.topic ?? "";
        this.cycle        = Number( config.cycle ?? 0 );
        this.contextStore = config.contextStore ?? "none";
        this.showState    = Boolean( config.showState );
        this.interval_id  = null;
        var node    = this;
        var context = this.context();
        node.status( "" );

        if( this.cycle > 0 )
        {
            function emitQuery()
            {
                node.emit( "input", {query:true} );
            }
            setTimeout( emitQuery, 75 );
            this.interval_id = setInterval( emitQuery, this.cycle*60*1000 );
        }

        node.on( 'input', function(msg,send,done)
        {
            let   data;
            const now = Date.now();

            function sendOutput(reason)
            {
                const out = data.counter/3600;
                if( node.showState )
                {
                    node.status( `${data.state} / ${out.toFixed(1)}` );
                }
                send( [
                    { topic:node.topic, payload:data.switchOn!==undefined, reason:reason },
                    { topic:node.topic, payload:out,                       reason:reason }
                ] );
            }

            if( msg.reset )
            {
                data = { counter:0 }
                context.set( "data", data, node.contextStore );
                sendOutput( "reset" );
            }
            else
            {
                data = context.get( "data", node.contextStore ) ?? { counter:0 };
                if( msg.set )
                {
                    const value = Number( msg.payload );
                    if( value >= 0 )
                    {
                        data.counter = msg.payload * 3600;
                        if( data.switchOn !== undefined )
                        {
                            data.switchOn = now;
                        }
                        context.set( "data", data, node.contextStore );
                        sendOutput( "set" );
                    }
                    else
                    {
                        done( `invalid set value: ${msg.payload}` )
                        return;
                    }
                }
                else
                {
                    if( msg.query )
                    {
                        if( data.switchOn !== undefined )
                        {
                            data.counter += (now - data.switchOn)/1000;
                            data.switchOn = now;
                        }
                        sendOutput( "query" );
                    }
                    else
                    {
                        data.state = msg.payload;
                        switch( msg.payload )
                        {
                            case true:
                            case 1:
                            case "1":
                            case "true":
                            case "on":
                            case "start":
                                if( data.switchOn === undefined )
                                {
                                    data.switchOn = now;
                                    sendOutput( "on" );
                                }
                                break;
                            case false:
                            case 0:
                            case "0":
                            case "false":
                            case "off":
                            case "stop":
                            case "disabled":
                                if( data.switchOn !== undefined )
                                {
                                    data.counter += (now - data.switchOn)/1000;
                                    delete data.switchOn;
                                    sendOutput( "off" );
                                }
                                break;
                            default:
                                node.warn( `invalid payload: ${msg.payload}` );
                        }
                        context.set( "data", data, node.contextStore );
                    }
                }
            }
            done();
        } );

        node.on('close', function() {
            clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType("hourmeter",HourMeterNode);
}
