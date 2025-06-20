module.exports = function(RED) {

    function MsgResenderNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.interval     = Number( config.interval ?? 1 );
        this.maxCount     = Number( config.maximum ?? 1 );
        this.forceClone   = Boolean( config.clone );
        this.firstDelayed = Boolean( config.firstDelayed );
        this.byTopic      = Boolean( config.bytopic );
        this.addCounters  = Boolean( config.addCounters );
        this.data         = {};
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
        context.get( "data", function(err,value)
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

        function defaultStat()
        {
            return { interval: node.interval, maxCount: node.maxCount, message: null, timer: null };
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
            node.status( {fill:statistic.counter!==statistic.maxCount?"green":"gray", shape:"dot", text: node.byTopic ? `${outputMsg.topic}: ${statistic.counter}` : statistic.counter } );
	}

        node.on('started', function() {
            //console.log( "msg-resend started" );
            context.set( "data", node.data );
            for( const i in node.data )
            {
                if( node.data[i].message && node.data[i].timer == null )
                {
                    console.log( "msg-resend restarting timer for "+i );
                    node.data[i].timer = setInterval( function(stat) { node.emit( "cyclic", stat ); }, node.data[i].interval, node.data[i] );
                }
            }
        });

        node.on('input', function(msg,send,done) {
            //console.log( "msg-resend input" );
            //console.log( node.data );
            const topic     = node.byTopic ? msg.topic : "all_topics";
            let   statistic = node.data[topic];
            if( statistic === undefined )
            {
                statistic = defaultStat();
                node.data[topic] = statistic;
            }

            if( msg.reset )
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
                    if( statistic.timer )
                    {
                        //console.log("msg-resend clear timer "+topic);
                        clearInterval( statistic.timer );
                        statistic.timer = null;
                    }
                    if( !node.firstDelayed )
                    {
                        sendMsg( msg, statistic );
                    }
                    if( node.firstDelayed || statistic.maxCount != 1 )
                    {
                        statistic.message = msg;
                        statistic.timer   = setInterval( function(stat) { node.emit( "cyclic", stat ); }, statistic.interval, statistic );
                    }
                }
            }
            done();
        });

        node.on( "cyclic", function(stat) {
            //console.log("msg-resend cyclic "+stat.message.topic);
            sendMsg( stat.message, stat );
            if( stat.maxCount > 0 && stat.counter >= stat.maxCount )
            {
                clearInterval( stat.timer );
                stat.timer   = null;
                stat.message = null;
            }
        } );

        node.on( "close", function() {
            //console.log("msg-resend close");
            for( const i in node.data )
            {
                clearInterval( node.data[i].timer );
                node.data[i].timer = null;
            }
        } );
    }

    RED.nodes.registerType("msg-resend2",MsgResenderNode);
}
