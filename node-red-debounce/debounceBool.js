module.exports = function(RED) {

    function DebounceBoolNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.time         = {
            true:  Number( config.timeTrue  ?? 1 ),
            false: Number( config.timeFalse ?? 1 )
        };
        this.restart      = Boolean( config.restart );
        this.byTopic      = Boolean( config.bytopic );
        this.state        = config.showState ? { fill:"gray", shape:"ring", text:"-" } : null;
        this.data         = {};
        if( this.propertyType === "jsonata" )
        {
            try {
                this.propertyPrepared = RED.util.prepareJSONataExpression( this.property, this );
            }
            catch (e) {
                node.error(RED._("debug.invalid-exp", {error: this.property}));
                return;
            }
        }
        switch( config.timeTrueUnit ?? "secs" )
        {
            case "secs":
                this.time.true *= 1000;
                break;
            case "mins":
                this.time.true *= 1000 * 60;
                break;
            case "hours":
                this.time.true *= 1000 * 60 * 60;
                break;
            default:
                // "msecs" so no conversion needed
        }
        switch( config.timeFalseUnit ?? "secs" )
        {
            case "secs":
                this.time.false *= 1000;
                break;
            case "mins":
                this.time.false *= 1000 * 60;
                break;
            case "hours":
                this.time.false *= 1000 * 60 * 60;
                break;
            default:
                // "msecs" so no conversion needed
        }
        setTimeout( function() { node.emit("started"); }, 100 );
        node.status( "" );

        function defaultStat()
        {
            return { timer: null, message: null };
        }

        function sendMsg(msg,shape)
        {
            node.data[node.byTopic ? msg.topic : "all_topics"].last = msg.payload;
            node.send( msg );
            if( node.state )
            {
                node.state.fill  = "green";
                node.state.shape = shape;
                node.state.text  = msg.payload;
                node.status( node.state )
            }
        }

        function statusColor(color)
        {
            if( node.state )
            {
                node.state.fill  = color;
                node.state.shape = "dot";
                node.status( node.state );
            }
        }

        function statusRing()
        {
            if( node.state )
            {
                node.state.shape = "ring";
                node.status( node.state );
            }
        }

        node.on('started', function() {
            //console.log( "debounce started" );
            context.set( "data", node.data );
        });

        node.on('input', function(msg,send,done) {
            //console.log( "debounce input" );
            //console.log( node.data );
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
                    clearTimeout( statistic.timer );
                    node.data[topic] = defaultStat();
                }
                else
                {
                    for( const i in node.data )
                    {
                        clearTimeout( node.data[i].timer );
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
                    if( value !== undefined )
                    {
                        const lastReceived = statistic.message?.payload;
                        const debounceTime = msg.debounceMs ?? node.time[!statistic.last];
                        //console.log(msg.payload,statistic.last,debounceTime)
                        msg.payload = Boolean( value );
                        statistic.message = msg;
                        if( ! statistic.timer )
                        {
                            if( statistic.last === undefined || msg.payload === statistic.last )
                            {
                                sendMsg( msg, "dot" );
                            }
                            else
                            {
                                statusColor( "yellow" );
                                statistic.timer = setTimeout( function(stat) { node.emit( "cyclic", stat ); }, debounceTime, statistic );
                            }
                        }
                        else
                        {
                            if( node.restart && msg.payload !== lastReceived )
                            {
                                clearTimeout( statistic.timer );
                                statistic.timer = setTimeout( function(stat) { node.emit( "cyclic", stat ); }, debounceTime, statistic );
                            }
                        }
                    }
                    else
                    {
                        statusColor( "gray" );
                    }
                    done();
                } );
            }
        });

        node.on( "cyclic", function(stat) {
            //console.log("debounce cyclic "+stat.message.topic);
            stat.timer = null;
            if( stat.message )
            {
                sendMsg( stat.message, "ring" );
                stat.message = null;
            }
            else
            {
                statusRing();
            }
        } );

        node.on( "close", function() {
            //console.log("debounce close");
            for( const i in node.data )
            {
                clearTimeout( node.data[i].timer );
            }
        } );
    }

    RED.nodes.registerType("debounceBool",DebounceBoolNode);
}
