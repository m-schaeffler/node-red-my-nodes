module.exports = function(RED) {
    var tools = require('./tools.js');

    function TimeRelayNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property  = config.property || "payload";
        this.delay     = Number( config.delay ?? 0 );
        this.postrun   = Number( config.postrun ?? 0 );
        this.minOn     = Number( config.minOn ?? 0 );
        this.maxOn     = Number( config.maxOn ?? 0 );
        this.showState = Boolean( config.showState );
        this.last         = null;
        this.msg          = null;
        this.timerDelay   = null;
        this.timerPostRun = null;
        this.timerMinOn   = null;
        this.timerMaxOn   = null;
        node.status( "" );

        function setStatus(color,text)
        {
            console.log( text );
            if( node.showState )
            {
                node.status( { text:text, shape:"dot", fill:color } );
            }
        }

        function doswitch()
        {
            node.send( node.msg );
            if( node.msg.payload )
            {
                if( node.minOn )
                {
                    node.timerMinOn = setTimeout( function() { node.emit("minOn"); }, node.minOn );
                }
                if( node.maxOn )
                {
                    node.timerMaxOn = setTimeout( function() { node.emit("maxOn"); }, node.maxOn );
                }
            }
            else
            {
                clearTimeout( node.timerMinOn );
                clearTimeout( node.timerMaxOn );
                node.timerMinOn = null;
                node.timerMaxOn = null;
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
                    node.msg = msg;
                    if( msg.payload )
                    {
                        if( node.timerPostrun )
                        {
                            clearTimeout( node.timerPostrun );
                            node.timerPostrun = null;
                            doswitch();
                            setStatus( "green", "on (change of mind)" );
                        }
                        else
                        {
                            if( node.delay > 0 )
                            {
                                node.timerDelay = setTimeout( function() { node.emit("sendOnMsg"); }, node.delay );
                                setStatus( "yellow", "startdelay" );
                            }
                            else
                            {
                                doswitch();
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
                            doswitch();
                            setStatus( "gray", "off (change of mind)" );
                        }
                        else
                        {
                            if( node.postrun > 0 )
                            {
                                node.timerPostrun = setTimeout( function() { node.emit("sendOffMsg"); }, node.postrun );
                                setStatus( "yellow", "postrun" );
                            }
                            else if( node.timerMinOn )
                            {
                                setStatus( "yellow", "minimal on" );
                            }
                            else
                            {
                                doswitch();
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
            doswitch();
            setStatus( "green", "on" );
        });

        node.on('sendOffMsg', function() {
            node.timerPostrun = null;
            doswitch();
            setStatus( "gray", "off" );
        });

        node.on('minOn', function() {
            node.timerMinOn = null;
            if( ! node.msg.payload )
            {
                doswitch();
                setStatus( "gray", "off (min time)" );
            }
        });

        node.on('maxOn', function() {
            node.timerMaxOn  = null;
            node.last        = false;
            node.msg.payload = false;
            doswitch();
            setStatus( "gray", "off (max time)" );
        });

        node.on('close', function() {
            clearTimeout( node.timerDelay );
            clearTimeout( node.timerPostrun );
            clearTimeout( node.timerMinOn );
            clearTimeout( node.timerMaxOn );
        });
    }

    RED.nodes.registerType("timerelay",TimeRelayNode);
}
