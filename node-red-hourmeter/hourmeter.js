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
            this.interval_id = setInterval( function()
            {
                node.emit( "input", {query:true} );
            }, this.cycle*60*1000 );
        }

        function nodeStatus(str)
        {
            if( node.showState )
            {
                node.status( str );
            }
        }

        node.on( 'input', function(msg,send,done)
        {
            if( msg.reset )
            {
                context.set( "data", null, node.contextStore );
                nodeStatus( "-" );
                send( [ { topic:this.topic, payload:false }, { topic:this.topic, payload:0 } ] );
            }
            else
            {
                const now    = Date.now();
                let   data   = context.get( "data", node.contextStore ) ?? { counter:0 };
                let   output = false;
                if( ( !msg.query ) && ( msg.payload !== undefined ) )
                {
                    if( msg.payload !== data.state )
                    {
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
                                    output = "on";
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
                                    output = "off";
                                }
                                break;
                        }
                        data.state = msg.payload;
                        context.set( "data", data, node.contextStore );
                    }
                }
                else
                {
                    if( data.switchOn !== undefined )
                    {
                        data.counter += (now - data.switchOn)/1000;
                        data.switchOn = now;
                    }
                    output = "query";
                }
                const out = data.counter/3600;
                nodeStatus( `${data.state} / ${out.toFixed(1)}` );
                if( output )
                {
                    send( [
                        { topic:this.topic, payload:data.switchOn!==undefined, reason:output },
                        { topic:this.topic, payload:out, reason:output }
                    ] );
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
