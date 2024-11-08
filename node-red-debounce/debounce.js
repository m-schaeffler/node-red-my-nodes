module.exports = function(RED) {

    function DebounceNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.time         = Number( config.time ?? 0 );
        this.filter       = Boolean( config.filter );
        this.byTopic      = Boolean( config.bytopic );
        this.data         = {};
        switch( config.timeUnit ?? "secs" )
        {
            case "secs":
                this.time *= 1000;
                break;
            case "mins":
                this.time *= 1000 * 60;
                break;
            case "hours":
                this.time *= 1000 * 60 * 60;
                break;
            default:
                // "msecs" so no conversion needed
        }
        setTimeout( function() { node.emit("started"); }, 100 );
        node.status( "" );

        function defaultStat()
        {
            return { timer: null };
        }

        node.on('started', function() {
            console.log( "debounce started" );
            context.set( "data", node.data );
        });

        node.on('input', function(msg,send,done) {
            console.log( "debounce input" );
            console.log( node.data );
            const topic     = node.byTopic ? msg.topic : "all_topics";
            let   statistic = node.data[topic];
            if( statistic === undefined )
            {
                statistic = defaultStat();
                node.data[topic] = statistic;
            }

            if( msg.invalid )
            {
                done();
            }
            else if( msg.reset )
            {
                if( topic )
                {
                    clearInterval( statistic.timer );
                    node.data[topic] = defaultStat();
                }
                else
                {
                    for( const i in node.data )
                    {
                        clearInterval( node.data[i].timer );
                        node.data[i] = defaultStat();
                    }
                }
                done();
                node.status( "" );
            }
            else
            {
                function getPayload(callback)
                {
                    if( node.propertyPrepared )
                    {
                        RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                        {
                            if( err )
                            {
                                done( err.message );
                            }
                            else
                            {
                                callback( value );
                            }
                        } );
                    }
                    else
                    {
                        callback( RED.util.getMessageProperty( msg, node.property ) );
                    }
                }
                getPayload( function(value)
                {
                    console.log("    "+value);
                    msg.payload = value;
                    let status = { fill:"gray", shape:"dot", text:msg.payload };
                    if( msg.payload !== undefined &&
                        ( ! node.filter || msg.payload !== statistic.last )  )
                    {
                        status.fill = "green";
                        send( msg );
                        statistic.last = msg.payload;
                        /*
                    statistic.counter = 0;
                    statistic.message = msg;
                    if( statistic.timer )
                    {
                        //console.log("msg-resend clear timer "+topic);
                        clearInterval( statistic.timer );
                        statistic.timer = null;
                    }
                    if( !node.firstDelayed )
                    {
                        sendMsg( statistic );
                    }
                    if( node.firstDelayed || statistic.maxCount != 1 )
                    {
                        statistic.timer = setInterval( function(stat) { node.emit( "cyclic", stat ); }, statistic.interval, statistic );
                    }
                */
                    }
                    node.status( status );
                    done();
                } );
            }
        });
/*
        node.on( "cyclic", function(stat) {
            console.log("debounce cyclic "+stat.message.topic);
            sendMsg( stat );
            if( stat.maxCount > 0 && stat.counter >= stat.maxCount )
            {
                clearInterval( stat.timer );
                stat.timer = null;
            }
        } );
*/
        node.on( "close", function() {
            console.log("debounce close");
            for( const i in node.data )
            {
                clearInterval( node.data[i].timer );
            }
        } );
    }

    RED.nodes.registerType("debounce",DebounceNode);
}
