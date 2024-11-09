module.exports = function(RED) {

    function DebounceNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.time         = Number( config.time ?? 1 );
        this.filter       = Boolean( config.filter );
        this.byTopic      = Boolean( config.bytopic );
        this.state        = { fill:"gray", shape:"dot", text:"-" };
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
            return { timer: null };
        }

        node.on('started', function() {
            console.log( "debounce started" );
            context.set( "data", node.data );
        });

        node.on('input', function(msg,send,done) {
            console.log( "debounce input" );
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
                    if( msg.payload !== undefined &&
                        ( ! node.filter || msg.payload !== statistic.lastSent )  )
                    {
                        statistic.message = msg;
                        if( ! statistic.timer )
                        {
                            statistic.timer = setTimeout( function(stat) { node.emit( "cyclic", stat ); }, node.time, statistic );
                        }
                        node.state.fill = "yellow";
                    }
                    node.status( node.state );
                    done();
                } );
            }
        });

        node.on( "cyclic", function(stat) {
            console.log("debounce cyclic "+stat.message.topic);
            stat.timer    = null;
            stat.lastSent = stat.message.payload;
            node.send( stat.message );
            node.state.fill = "green";
            node.state.text = stat.message.payload;
            node.status( node.state );
            node.state.fill = "gray";
        } );

        node.on( "close", function() {
            console.log("debounce close");
            for( const i in node.data )
            {
                clearTimeout( node.data[i].timer );
            }
        } );
    }

    RED.nodes.registerType("debounce",DebounceNode);
}
