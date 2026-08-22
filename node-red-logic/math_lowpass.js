module.exports = function(RED) {
    var tools = require('./tools.js');

    function LowPassNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.topic          = config.topic ?? "";
        this.property       = config.property ?? "payload";
        this.propertyType   = config.propertyType ?? "msg";
        this.alpha          = Number( config.alpha ?? 0.5 );
        this.beta           = Number( config.beta ?? 0 );
        this.filterTime     = Number( config.filter ?? 0 ) * tools.timeUnits( config.filterUnit );
        this.filterValue    = Number( config.filterVal ?? 0 );
        this.filterLongTime = this.filterTime * Number( config.filterMul ?? 10 );
        this.zeroIsZero     = Boolean( config.zeroIsZero );
        this.round          = config.decimals ? Math.pow( 10, Number( config.decimals ) ) : null;
        this.showState      = Boolean( config.showState );
        this.data = {};
        this.last = {};
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

        function setStatus(color,text)
        {
            if( node.showState )
            {
                node.status({ fill:color, shape:"dot", text:text });
            }
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.data = {};
                node.last = {};
                node.status( "" );
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
                    if( node.topic )
                    {
                        msg.topic = node.topic;
                    }
                    const measurement = Number( value );
                    if( ! isNaN( measurement ) )
                    {
                        const now  = Date.now();
                        let   data = node.data[msg.topic];

                        // Filter
                        if( data == undefined || node.zeroIsZero && measurement === 0 )
                        {
                            node.data[msg.topic] = data = { estimate:measurement, derivative:0 };
                            context.set( "data", node.data );
                        }
                        else
                        {
                            const deltatime  = now - data.time;
                            const estimate   = data.estimate + data.derivative * deltatime;
                            const innovation = measurement - estimate;
                            data.derivative += node.beta * innovation / deltatime;
                            data.estimate    = estimate + node.alpha * innovation;
                        }
                        data.time = now;

                        msg.payload = node.round ? Math.round( data.estimate * node.round ) / node.round : data.estimate;

                        const help = node.last[msg.topic];
                        let   color;
                        if( help === undefined ||
                            ( help.time + node.filterTime < now && tools.distance( help.value, data.estimate ) >= node.filterValue ) ||
                            ( node.filterLongTime > 0 && help.time + node.filterLongTime < now  ) )
                        {
                            node.last[msg.topic] = { value:msg.payload, time:now };
                            send( msg );
                            color = "green";
                        }
                        else
                        {
                            color = "gray";
                        }
                        setStatus( color, tools.formatNumber(msg.payload)+" / "+tools.formatNumber(data.derivative) );
                    }
                    else
                    {
                        if( value !== undefined )
                        {
                            setStatus( "red", "payload is NaN" );
                            node.warn( `payload is NaN (${msg.topic}=${value})` );
                        }
                    }
                } );
            }
            done();
        });
    }

    RED.nodes.registerType("lowpass",LowPassNode);
}
