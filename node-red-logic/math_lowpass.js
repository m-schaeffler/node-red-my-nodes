module.exports = function(RED) {
    var tools = require('./tools.js');

    function LowPassNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        //var context   = this.context();
        this.topic          = config.topic ?? "";
        this.property       = config.property ?? "payload";
        this.propertyType   = config.propertyType ?? "msg";
        this.alpha          = Number( config.alpha ?? 0.5 );
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
                    const payload = Number( value );
                    if( ! isNaN( payload ) )
                    {
                        const now = Date.now();

                        function lowPassFilter(measurement)
                        {
                            if( node.data[msg.topic] == undefined )
                            {
                                node.data[msg.topic] = measurement;
                            }
                            else
                            {
                                node.data[msg.topic] += node.alpha * ( measurement - node.data[msg.topic] );
                            }
                            return node.data[msg.topic];
                        }

                        function sendValue(value)
                        {
                            msg.payload = value;
                            node.last[msg.topic] = {value:value,time:now};
                            setStatus( "green", tools.formatNumber(value) );
                            send( msg );
                        }

                        if( node.zeroIsZero && payload === 0 )
                        {
                            node.data[msg.topic] = 0;
                            sendValue( 0 );
                        }
                        else
                        {
                            let   value = lowPassFilter( payload );
                            const help  = node.last[msg.topic];
                            if( help === undefined ||
                                ( help.time + node.filterTime < now && tools.distance( help.value, value ) >= node.filterValue ) ||
                                ( node.filterLongTime > 0 && help.time + node.filterLongTime < now  ) )
                            {
                                if( node.round )
                                {
                                    value = Math.round( value * node.round ) / node.round;
                                }
                                sendValue( value );
                            }
                            else
                            {
                                setStatus( "gray", tools.formatNumber(value) );
                            }
                        }
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
