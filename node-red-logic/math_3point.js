module.exports = function(RED) {
    var tools = require('./tools.js');

    const colors = {"1":"yellow","0":"gray","-1":"blue"};

    function ThreePointNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node    = this;
        var context = this.context();
        this.topic            = config.topic || "";
        this.property         = config.property ?? "payload";
        this.propertyType     = config.propertyType ?? "msg";
        this.thresholdUpRise  = Number( config.thresholdUpRise );
        this.thresholdUpFall  = Number( config.thresholdUpFall );
        this.thresholdLowRise = Number( config.thresholdLowRise );
        this.thresholdLowFall = Number( config.thresholdLowFall );
        this.output           = {
            "1":  RED.util.evaluateNodeProperty( config.outputUpper  ?? "+1", config.outputUpperType  ?? "num" ),
            "0":  RED.util.evaluateNodeProperty( config.outputMiddle ?? "0",  config.outputMiddleType ?? "num" ),
            "-1": RED.util.evaluateNodeProperty( config.outputLower  ?? "-1", config.outputLowerType  ?? "num" )
        };
        this.noInit           = Boolean( config.noInit );
        this.showState        = Boolean( config.showState );
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
        node.status( "" );

        function msgSetEdge(msg,edge)
        {
            msg.edge    = edge;
            msg.payload = node.output[edge];
        }

        node.on('input', function(msg,send,done) {
            let data = context.get( "data" ) ?? {};
            if( msg.invalid )
            {
                done();
            }
            else if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
                done();
            }
            else if( msg.query || msg.topic==="query" )
            {
                for( const i in data )
                {
                    let help = { topic: i, query: true };
                    msgSetEdge( help, data[i].edge );
                    send( help );
                }
                done();
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
                    msg.value = Number( value );
                    if( node.topic )
                    {
                        msg.topic = node.topic;
                    }
                    let status = { fill:data[msg.topic]?.status??"gray", shape:"dot", text:tools.formatNumber( msg.value ) };

                    if( ! isNaN( msg.value ) )
                    {
                        const last = data[msg.topic]?.edge;

                        function sendMsg(edge)
                        {
                            status.fill = colors[edge];
                            data[msg.topic] = { edge:edge, status:status.fill };
                            context.set( "data", data );
                            if( last !== undefined || ! node.noInit )
                            {
                                msgSetEdge( msg, edge );
                                msg.init = last === undefined;
                                send( msg );
                            }
                        }

                        if( msg.value > node.thresholdUpRise && last !== +1 )
                        {
                            sendMsg( +1 );
                        }
                        else if( node.thresholdLowRise < msg.value && msg.value < node.thresholdUpFall && last !== 0 )
                        {
                            sendMsg( 0 );
                        }
                        else if( msg.value < node.thresholdLowFall && last !== -1 )
                        {
                            sendMsg( -1 );
                        }
                    }
                    else
                    {
                        status.fill = "red";
                        status.text = "not a Number";
                    }

                    if( node.showState )
                    {
                        node.status( status );
                    }
                    done();
                } );
            }
        });
    }

    RED.nodes.registerType("threePoint",ThreePointNode);
}
