module.exports = function(RED) {
    var tools = require('./tools.js');

    function TimeRelayNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property  = config.property || "payload";
        this.delay     = Number( config.delay ?? 0 );
        this.postrun   = Number( config.postrun ?? 0 );
        this.showState = Boolean( config.showState );
        this.last         = null;
        this.msg          = null;
        this.timerDelay   = null;
        this.timerPostRun = null;
        node.status( "" );

        function setStatus(color,text)
        {
            console.log( text );
            if( node.showState )
            {
                node.status( { text:text, shape:"dot", fill:color } );
            }
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            msg.payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );
            if( msg.payload !== null )
            {
                if( msg.payload !== node.last )
                {
                    node.last = msg.payload;
                    node.msg  = null;
                    if( msg.payload )
                    {
                        if( node.timerPostrun )
                        {
                            clearTimeout( node.timerPostrun );
                            node.timerPostrun = null;
                            send( msg );
                            setStatus( "green", "on (change of mind)" );
                        }
                        else
                        {
                            if( node.delay > 0 )
                            {
                                node.msg = msg;
                                node.timerDelay = setTimeout( function() { node.emit("sendOnMsg"); }, node.delay );
                                setStatus( "yellow", "startdelay" );
                            }
                            else
                            {
                                send( msg );
                                setStatus( "green", "on" );
                            }
                        }
                    }
                    else
                    {
                        if( node.timerDelay )
                        {
                            clearTimeout( node.timerDelay );
                            node.timerDelay = null;
                            send( msg );
                            setStatus( "gray", "off (change of mind)" );
                        }
                        else
                        {
                            if( node.postrun > 0 )
                            {
                                node.msg = msg;
                                node.timerPostrun = setTimeout( function() { node.emit("sendOffMsg"); }, node.postrun );
                                setStatus( "yellow", "postrun" );
                            }
                            else
                            {
                                send( msg );
                                setStatus( "gray", "off" );
                            }
                        }
                    }
                }
                else
                {
                    setStatus( msg.payload ? "green" : "gray", "filter" );
                }
            }
            else
            {
                console.log("error")
                setStatus( "red", "error" );
            }
            done();
        });

        node.on('sendOnMsg', function() {
            node.timerDelay = null;
            node.send( node.msg );
            node.msg = null;
            setStatus( "green", "on" );
        });

        node.on('sendOffMsg', function() {
            node.timerPostrun = null;
            node.send( node.msg );
            node.msg = null;
            setStatus( "gray", "off" );
        });

        node.on('close', function() {
            clearTimeout( node.timerDelay );
            clearTimeout( node.timerPostrun );
        });
    }

    RED.nodes.registerType("timerelay",TimeRelayNode);
}
