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
        this.timers       = {};
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
            node.status( {fill:"green", shape:"dot", text: node.byTopic ? `${outputMsg.topic}: ${statistic.counter}` : statistic.counter } );
	}

        node.on('started', function() {
            console.log( "msg-resend started" );
        });

        node.on('input', function(msg,send,done) {
            const topic     = node.byTopic ? msg.topic : "all_topics";
            let   data      = context.get( "data" ) ?? {};
            console.log("data");
            console.log(data);
            let   statistic = data[topic];
            if( statistic === undefined )
            {
                statistic = { interval: node.interval, maxCount: node.maxCount };
                data[topic] = statistic;
                context.set( "data", data );
            }

            /*
            // Programmatic control of resend interval using message parameter (which is stored per topic)
            if (msg.hasOwnProperty("resend_interval")) {
                if (!isNaN(msg.resend_interval) && isFinite(msg.resend_interval)) {
                    // The timer should be restarted when a new resend interval is specified
                    / *if (statistic.interval != msg.resend_interval * 1000) {
                        restartTimer = true;
                    } * /

                    statistic.interval = msg.resend_interval * 1000; // In milliseconds
                }
                else {
                    this.error("resend_interval is not a numeric value", msg);
                }
            }

            // Programmatic control of max.count using message parameter (which is stored per topic)
            if (msg.hasOwnProperty("resend_max_count")) {
                if (!isNaN(msg.resend_max_count) && isFinite(msg.resend_max_count)) {
                    statistic.maximumCount = msg.resend_max_count;
                }
                else {
                    this.error("resend_max_count is not a numeric value", msg);
                }
            }
            */

            if( msg.payload !== undefined )
            {
                statistic.counter = 0;
                statistic.message = msg;
                if( !node.firstDelayed )
                {
                    sendMsg( statistic );
                }
                //statistic.previousTimestamp = msgTimestamp;

                if( node.timers[topic] )
                {
                    console.log("msg-.resend clear timer "+topic);
                    clearInterval( node.timers[topic] );
                    //node.timers[topic] = null;
                }
                node.timers[topic] = setInterval( function(stat) {
                    console.log("timer")
                    node.emit( "cyclic", topic );
                /*
                    if (Date.now() - node.displayTimestamp > 500 ) {
                        node.status({});
                    }

                    if(statistic.maximumCount > 0 && statistic.counter >= statistic.maximumCount) {
                        // The maximum number of messages has been send, so stop the timer (for the last received input message).
                        clearInterval(statistic.timer);

                        // Reset the calculated values of the statistic, since those are not needed anymore.
                        // Keep the other values unchanged, because they might have been updated via input messages...
                        statistic.counter = 0
                        statistic.previousTimestamp = 0
                        statistic.timer = 0;

                        // Only update the node status if all messages (for all topics) have been resend
                        var runningStatsCount = 0;
                        for (var stat of node.statistics.values()) {
                            if (stat.timer != 0) {
                                runningStatsCount++;
                            }
                        }

                        if (runningStatsCount === 0) {
                            node.status({fill:"green",shape:"dot",text:"maximum reached"});
                        }

                        done();
                    }
                    else {
                        sendMsg(msg, node, statistic, send, done);
                    }
                    */
                }, statistic.interval, statistic );
/*
            // When being in pass-through mode, simply send the message to the output once (unless the msg has been forced to be resend already).
            // Don't send the message when it should be ignored.
            if (!statistic.resend_messages && !msg.resend_force && !ignoreMessage) {
                var outputMsg = msg;

                // When "force cloning" is enabled, the messages in pass-through mode should also be cloned!
                // Otherwise we get conflicts when using "msg.resend_last_msg" afterwards on these messages, because the messages might have been changed by other nodes...
                if (node.forceClone) {
                    outputMsg = RED.util.cloneMessage(msg);
                }

                send(outputMsg);
                done();
            }

            // Remember the last msg (per topic), except when it should be ignored for output
            if(!ignoreMessage) {
                statistic.message = msg;
            }
            */
            }
            done();
        });

        node.on( "cyclic", function(topic) {
            console.log("msg-resend cyclic "+topic);
            if( false )
            {}
            else
            {
                clearInterval( node.timers[topic] );
                node.timers[topic] = null;
            }
        } );

        node.on( "close", function() {
            console.log("msg-resend close");
            for( const i in node.timers )
            {
                clearInterval( node.timers[i] );
            }
        } );
    }

    RED.nodes.registerType("msg-resend2",MsgResenderNode);
}
