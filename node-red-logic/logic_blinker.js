module.exports = function(RED) {
    var tools = require('./tools.js');

    function BlinkerNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property    = config.property || "payload";
        this.onTime      = Number( config.onTime  ?? 1 ) * tools.timeUnits( config.onTimeUnit  );
        this.offTime     = Number( config.offTime ?? 1 ) * tools.timeUnits( config.offTimeUnit );
        this.firstType   = config.outputFirstType ?? "bool";
        this.lastType    = config.outputLastType ?? "bool";
        this.outputFirst = RED.util.evaluateNodeProperty( config.outputFirst ?? "true",  this.firstType );
        this.outputOn    = RED.util.evaluateNodeProperty( config.outputOn    ?? "true",  config.outputOnType  ?? "bool" );
        this.outputOff   = RED.util.evaluateNodeProperty( config.outputOff   ?? "false", config.outputOffType ?? "bool" );
        this.outputLast  = RED.util.evaluateNodeProperty( config.outputLast  ?? "false", this.lastType );
        this.filter      = Boolean( config.filter );
        this.showState   = Boolean( config.showState );
        this.timerOn     = null;
        this.timerOff    = null;
        this.last        = null;
        node.status( "" );

        function setStatus(color,text)
        {
            if( node.showState )
            {
                node.status( { text:text, shape:"dot", fill:color } );
            }
        }

        function sendFirst()
        {
            clearTimeout( node.timerOn  );
            clearTimeout( node.timerOff );
            switch( node.firstType )
            {
                case "nul":
                    break;
                case "msg":
                    node.send( node.msg );
                    break;
                default:
                    let msg = RED.util.cloneMessage( node.msg );
                    msg.payload = node.outputFirst;
                    node.send( msg );
            }
            setStatus( "green", "first" );
            node.timerOn  = null;
            node.timerOff = setTimeout( sendOff, node.onTime );
        }

        function sendOn()
        {
            node.msg.payload = node.outputOn;
            node.send( node.msg );
            setStatus( "green", "on" );
            node.timerOn  = null;
            node.timerOff = setTimeout( sendOff, node.onTime );
        }

        function sendOff()
        {
            node.msg.payload = node.outputOff;
            node.send( node.msg );
            setStatus( "gray", "off" );
            node.timerOn  = setTimeout( sendOn, node.offTime );
            node.timerOff = null;
        }

        function sendLast()
        {
            clearTimeout( node.timerOn  );
            clearTimeout( node.timerOff );
            node.timerOn  = null;
            node.timerOff = null;
            switch( node.lastType )
            {
                case "nul":
                    break;
                case "msg":
                    node.send( node.msg );
                    break;
                default:
                    let msg = RED.util.cloneMessage( node.msg );
                    msg.payload = node.outputLast;
                    node.send( msg );
            }
            setStatus( "gray", "last" );
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
                if( !node.filter || node.state !== node.last )
                {
                    node.last      = node.state;
                    node.msg       = msg;
                    node.msg.state = node.state;
                    if( node.state )
                    {
                        sendFirst();
                    }
                    else
                    {
                        sendLast();
                    }
                }
            }
            else
            {
                setStatus( "red", "error" );
            }
            done();
        });

        node.on('close', function() {
            clearTimeout( node.timerOn  );
            clearTimeout( node.timerOff );
        });
    }

    RED.nodes.registerType("blinker",BlinkerNode);
}
