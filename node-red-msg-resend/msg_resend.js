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

        function defaultStat()
        {
            return { interval: node.interval, maxCount: node.maxCount, timer: null };
        }

        function sendMsg(statistic)
        {
            let outputMsg = node.forceClone ? RED.util.cloneMessage( statistic.message ) : statistic.message;

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
                }
                if( msg.resend_max_count !== undefined )
                {
                    statistic.maxCount = Number( msg.resend_max_count ) ?? node.maxCount;
                }
                if( msg.payload !== undefined )
                {
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
                }
            }
            done();
        });

        node.on( "cyclic", function(stat) {
            //console.log("msg-resend cyclic "+stat.message.topic);
            sendMsg( stat );
            if( stat.maxCount > 0 && stat.counter >= stat.maxCount )
            {
                clearInterval( stat.timer );
                stat.timer = null;
            }
        } );

        node.on( "close", function() {
            //console.log("msg-resend close");
            for( const i in node.data )
            {
                clearInterval( node.data[i].timer );
            }
        } );
    }

    RED.nodes.registerType("msg-resend2",MsgResenderNode);
}
