module.exports = function(RED) {
    var tools = require('./tools.js');

    function KalmanNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.topic            = config.topic || "";
        this.property         = config.property || "payload";
        this.propertyType     = config.propertyType ?? "msg";
        this.processNoise     = Number( config.processNoise ?? 1 );
        this.measurementNoise = Number( config.measurementNoise ?? 1 );
        this.stateVector      = Number( config.stateVector ?? 1 );
        this.controlVector    = Number( config.controlVector ?? 0 );
        this.measurementVector= Number( config.measurementVector ?? 1 );
        this.contextStore     = config.contextStore ?? "none";
        this.filterTime       = Number( config.filter ?? 0 ) * tools.timeUnits( config.filterUnit );
        this.filterValue      = Number( config.filterVal ?? 0 );
        this.filterLongTime   = this.filterTime * Number( config.filterMul ?? 10 );
        this.zeroIsZero       = Boolean( config.zeroIsZero );
        this.round            = config.decimals ? Math.pow( 10, Number( config.decimals ) ) : null;
        this.showState        = Boolean( config.showState );
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

        function setStatus(color,text)
        {
            node.status({ fill:color, shape:"dot", text:text });
        }

        function kalmanFilter(value,control)
        {
            return value;
        }

        node.on('input', function(msg,send,done) {
            console.log(msg)
            if( msg.invalid )
            {
                done();
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.data = {};
                node.last = {};
                if( node.contextStore != "none" )
                {
                    context.set( "data", node.data, node.contextStore );
                }
                node.status( "" );
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
                    if( node.topic )
                    {
                        msg.topic = node.topic;
                    }
                    const payload = Number( value );
                    console.log( " 1",payload)
                    if( ! isNaN( payload ) )
                    {
                        const now = Date.now();
                        node.data[msg.topic] ??= { estimation:null, covariance: null };

                        function sendValue(value)
                        {
                            console.log( " s",value)
                            msg.payload = value;
                            node.last[msg.topic] = {value:value,time:now};
                            setStatus( "green", tools.formatNumber(value) );
                            send( msg );
                        }

                        if( node.zeroIsZero && payload === 0 )
                        {
                            node.data[msg.topic].extimation = 0;
                            sendValue( 0 );
                        }
                        else
                        {
                            let   value = kalmanFilter( payload, 0, node.data[msg.topic] );
                            console.log(" 2", value)
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
                                setStatus( "gray", `${item.length} / ${tools.formatNumber(value)}` );
                            }
                        }
                        if( node.contextStore != "none" )
                        {
                            context.set( "data", node.data, node.contextStore );
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
                    done();
                } );
            }
        });
    }

    RED.nodes.registerType("kalman",KalmanNode);
}
