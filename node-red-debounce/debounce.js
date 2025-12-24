module.exports = function(RED) {

    function DebounceNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.time         = Number( config.time ?? 1 );
        this.block        = Boolean( config.block );
        this.filterIn     = Boolean( config.filter );
        this.filterOut    = Boolean( config.filterOut );
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
            return { timer: null, message: null };
        }

        function sendMsg(msg,shape)
        {
            let statistic = node.data[node.byTopic ? msg.topic : "all_topics"];
            if( ! node.filterOut || msg.payload !== statistic.lastOut )
            {
                statistic.lastOut = msg.payload;
                node.send( msg );
            }
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
                    msg.payload = value;
                    if( msg.payload !== undefined && ( ! node.filterIn || msg.payload !== statistic.lastIn ) )
                    {
                        const debounceTime = msg.debounceMs ?? node.time;
                        statistic.lastIn = msg.payload;
                        if( ! node.block )
                        {
                            statistic.message = msg;
                        }
                        if( ! statistic.timer )
                        {
                            if( node.block )
                            {
                                sendMsg( msg, "dot" );
                            }
                            else
                            {
                                statusColor( "yellow" );
                            }
                            statistic.timer = setTimeout( function(stat) { node.emit( "cyclic", stat ); }, debounceTime, statistic );
                        }
                        else
                        {
                            if( node.restart )
                            {
                                clearTimeout( statistic.timer );
                                statistic.timer = setTimeout( function(stat) { node.emit( "cyclic", stat ); }, debounceTime, statistic );
                            }
                            if( node.block )
                            {
                                statusColor( "red" );
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

    RED.nodes.registerType("debounce",DebounceNode);
}
