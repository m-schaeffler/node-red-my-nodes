module.exports = function(RED) {

    function MsgSequenceNode(config) {
        RED.nodes.createNode(this,config);
        var node    = this;
        var context = this.context();
        this.interval     = Number( config.interval ?? 1 );
        this.outputs      = Number( config.outputs ?? 1 );
        this.contextStore = config.contextStore ?? "";
        this.forceClone   = Boolean( config.clone );
        this.byTopic      = Boolean( config.bytopic );
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
            return { interval: node.interval, message: null };
        }

        function sendMsg(message,statistic)
        {
            let outputMsg = [];
            for( let i = 0; i < statistic.counter; i++ )
            {
                outputMsg.push( null );
            }
            statistic.counter++;
            outputMsg.push( node.forceClone ? RED.util.cloneMessage( message ) : message );

            node.send( outputMsg );
            if( node.showState )
            {
                node.status( {fill:statistic.counter!==node.outputs?"green":"gray", shape:"dot", text: node.byTopic ? `${outputMsg.topic}: ${statistic.counter}` : statistic.counter } );
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
                if( node.data[i].message )
                {
                    node.log( "msg-resend restarting timer for "+i );
                    node.timer[i] = setInterval( function(top) { node.emit( "cyclic", top ); }, node.data[i].interval, i );
                }
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
                if( msg.payload !== undefined )
                {
                    statistic.counter = 0;
                    if( node.timer[topic] )
                    {
                        //console.log("msg-resend clear timer "+topic);
                        clearInterval( node.timer[topic] );
                        node.timer[topic] = null;
                    }
                    sendMsg( msg, statistic );
                    if( node.outputs > 1 )
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
            //console.log("msg-resend cyclic "+topic);
            const stat = node.data[topic];
            sendMsg( stat.message, stat );
            if( stat.counter >= node.outputs )
            {
                clearInterval( node.timer[topic] );
                node.timer[topic] = null;
                stat.message = null;
            }
            storeContext();
        } );

        node.on( "close", function() {
            //console.log("msg-resend close");
            for( const i in node.timer )
            {
                clearInterval( node.timer[i] );
                node.timer[i] = null;
            }
        } );
    }

    RED.nodes.registerType("msg-sequence",MsgSequenceNode);
}
