module.exports = function(RED) {
    var tools = require('./tools.js');

    function BlinkerNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property    = config.property || "payload";
        this.onTime      = Number( config.onTime    ?? 1 ) * tools.timeUnits( config.onTimeUnit );
        this.pauseTime   = Number( config.pauseTime ?? 1 ) * tools.timeUnits( config.pauseTimeUnit );
        this.outputOn    = RED.util.evaluateNodeProperty( config.outputOn    ?? "true", config.outputOnType    ?? "bool" );
        this.outputPause = RED.util.evaluateNodeProperty( config.outputPause ?? "false",config.outputPauseType ?? "bool" );
        this.outputOff   = RED.util.evaluateNodeProperty( config.outputOff   ?? "false",config.outputOffType   ?? "bool" );
        this.showState   = Boolean( config.showState );
        this.timerOn     = null;
        this.timerPause  = null;
        node.status( "" );

        function setStatus(color,text)
        {
            //console.log( text );
            if( node.showState )
            {
                node.status( { text:text, shape:"dot", fill:color } );
            }
        }

        function sendOn()
        {
            node.msg.payload = node.outputOn;
            node.send( node.msg );
            setStatus( "gren", "on" );
            node.timerOn    = null;
            node.timerPause = setTimeout( sendPause, node.onTime );
        }

        function sendPause()
        {
            node.msg.payload = node.outputPause;
            node.send( node.msg );
            setStatus( "gray", "pause" );
            node.timerOn    = setTimeout( sendOn, node.pauseTime );
            node.timerPause = null;
        }

        function sendOff()
        {
            clearTimeout( node.timerOn    );
            clearTimeout( node.timerPause );
            node.timerOn    = null;
            node.timerPause = null;
            node.msg.payload = node.outputOff;
            node.send( node.msg );
            setStatus( "gray", "off" );
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            node.state = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );
            if( node.state !== null )
            {
                if( node.state !== node.last )
                {
                    node.last      = node.state;
                    node.msg       = msg;
                    node.msg.state = node.state;
                    if( node.state )
                    {
                        sendOn();
                    }
                    else
                    {
                        sendOff();
                    }
                }
            }
            else
            {
                //console.log("error")
                setStatus( "red", "error" );
            }
            done();
        });

        node.on('close', function() {
            clearTimeout( node.timerOn    );
            clearTimeout( node.timerPause );
        });
    }

    RED.nodes.registerType("blinker",BlinkerNode);
}
