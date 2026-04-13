module.exports = function(RED) {

    function MsgResenderNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.interval     = Number( config.interval ?? 1 );
        this.maxCount     = Number( config.maximum ?? 1 );
        this.contextStore = config.contextStore ?? "";
        this.forceClone   = Boolean( config.clone );
        this.firstDelayed = Boolean( config.firstDelayed );
        this.byTopic      = Boolean( config.bytopic );
        this.addCounters  = Boolean( config.addCounters );
        this.showState    = Boolean( config.showState );
        this.data         = {};
        this.timer        = {};
        switch( config.intervalUnit ?? "secs" )
        {
            case "secs":
                this.interval *= 1000;
                break;
            case "mins":
                this.interval *= 1000 * 60;
                break;
            case "hours":
                this.interval *= 1000 * 60 * 60;
                break;
            default:
                // "msecs" so no conversion needed
        }
        setTimeout( function() { node.emit("started"); }, 100 );
        node.status( "" );
        if( node.contextStore != "none" )
        {
            context.get( "data", node.contextStore, function(err,value)
            {
                if( err )
                {
                    node.error( err );
                }
                else
                {
                    //console.log( "context read", value );
                    if( value !== undefined )
                    {
                        node.data = value;
                    }
                }
            } );
        }

        function defaultStat()
        {
            return { interval: node.interval, maxCount: node.maxCount, message: null };
        }

        function sendMsg(message,statistic)
        {
            let outputMsg = node.forceClone ? RED.util.cloneMessage( message ) : message;

            statistic.counter++;
            if( node.addCounters )
            {
                outputMsg.counter = statistic.counter;
                outputMsg.max     = statistic.maxCount;
            }

            node.send( outputMsg );
            if( node.showState )
            {
                node.status( {fill:statistic.counter!==statistic.maxCount?"green":"gray", shape:"dot", text: node.byTopic ? `${outputMsg.topic}: ${statistic.counter}` : statistic.counter } );
            }
	}

        function storeContext()
        {
            if( node.contextStore != "none" )
            {
                context.set( "data", node.data, node.contextStore );
            }
        }

        node.on('started', function() {
            //console.log( "msg-resend started" );
            for( const i in node.data )
            {
                if( node.data[i].message && ! node.timer[i] )
                {
                    node.log( "msg-resend restarting timer for "+i );
                    node.timer[i] = setInterval( function(top) { node.emit( "cyclic", top ); }, node.data[i].interval, i );
                }
                delete node.data[i].timer;
            }
            storeContext();
        });

        node.on('input', function(msg,send,done) {
            //console.log( "msg-resend input" );
            //console.log( node.data );
            const topic     = node.byTopic ? msg.topic : "all_topics";
            let   statistic = node.data[topic];
            if( statistic === undefined )
            {
                statistic = defaultStat();
                if( topic )
                {
                    node.data [topic] = statistic;
                    node.timer[topic] = null;
                }
            }

            if( msg.reset )
            {
                if( topic )
                {
                    clearInterval( node.timer[topic] );
                    node.data [topic] = defaultStat();
                    node.timer[topic] = null;
                }
                else
                {
                    for( const i in node.data )
                    {
                        clearInterval( node.timer[i] );
                        node.data [i] = defaultStat();
                        node.timer[i] = null;
                    }
                }
                node.status( "" );
            }
            else
            {
                if( msg.resend_interval !== undefined )
                {
                    statistic.interval = Number( msg.resend_interval ) ?? node.interval;
                    delete msg.resend_interval;
                }
                if( msg.resend_max_count !== undefined )
                {
                    statistic.maxCount = Number( msg.resend_max_count ) ?? node.maxCount;
                    delete msg.resend_max_count;
                }
                if( msg.payload !== undefined )
                {
                    statistic.counter = 0;
                    if( node.timer[topic] )
                    {
                        //console.log("msg-resend clear timer "+topic);
                        clearInterval( node.timer[topic] );
                        node.timer[topic] = null;
                    }
                    if( !node.firstDelayed )
                    {
                        sendMsg( msg, statistic );
                    }
                    if( node.firstDelayed || statistic.maxCount != 1 )
                    {
                        statistic.message = msg;
                        node.timer[topic] = setInterval( function(top) { node.emit( "cyclic", top ); }, statistic.interval, topic );
                    }
                }
            }
            storeContext();
            done();
        });

        node.on( "cyclic", function(topic) {
            //console.log("msg-resend cyclic "+stat.message.topic);
            const stat = node.data[topic];
            sendMsg( stat.message, stat );
            if( stat.maxCount > 0 && stat.counter >= stat.maxCount )
            {
                clearInterval( node.timer[topic] );
                node.timer[topic] = null;
                stat.message = null;
            }
            storeContext();
        } );

        node.on( "close", function() {
            //console.log("msg-resend close");
            for( const i in node.data )
            {
                clearInterval( node.timer[i] );
                node.timer[i] = null;
            }
        } );
    }

    RED.nodes.registerType("msg-resend2",MsgResenderNode);
}
