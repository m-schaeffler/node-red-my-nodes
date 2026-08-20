module.exports = function(RED) {
    var tools = require('./tools.js');

    function KalmanNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node      = this;
        var context   = this.context();
        this.topic             = config.topic ?? "";
        this.property          = config.property ?? "payload";
        this.propertyType      = config.propertyType ?? "msg";
        this.control           = config.control ?? 0;
        this.controlType       = config.controlType ?? "num";
        this.processNoise      = Number( config.processNoise ?? 1 );
        this.measurementNoise  = Number( config.measurementNoise ?? 1 );
        this.stateVector       = Number( config.stateVector ?? 1 );
        this.controlVector     = Number( config.controlVector ?? 0 );
        this.measurementVector = Number( config.measurementVector ?? 1 );
        this.adaptionCount     = Number( config.adaptionCount ?? 0 );
        this.contextStore      = config.contextStore ?? "";
        this.filterTime        = Number( config.filter ?? 0 ) * tools.timeUnits( config.filterUnit );
        this.filterValue       = Number( config.filterVal ?? 0 );
        this.filterLongTime    = this.filterTime * Number( config.filterMul ?? 10 );
        this.zeroIsZero        = Boolean( config.zeroIsZero );
        this.round             = config.decimals ? Math.pow( 10, Number( config.decimals ) ) : null;
        this.showState         = Boolean( config.showState );
        this.data       = {};
        this.last       = {};
        this.adaptation = {};
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
                    const now  = Date.now();
                    for( const i in value )
                    {
                        value[i].time         = now;
                        value[i].processNoise = node.processNoise;
                    }
                    node.data = value;
                }
            }
        } );

        function setStatus(color,text)
        {
            node.status({ fill:color, shape:"dot", text:text });
        }

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
            }
            else if( msg.reset || msg.topic==="init" )
            {
                node.data = {};
                node.last = {};
                context.set( "data", node.data, node.contextStore );
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
                    if( ! isNaN( payload ) )
                    {
                        const control = RED.util.evaluateNodeProperty( node.control, node.controlType, node, msg );
                        if( ! isNaN( control ) )
                        {
                            node.data[msg.topic] ??= {};
                            const data = node.data[msg.topic];
                            const now  = Date.now();

                            function kalmanFilter(measurement,control)
                            {
                                if( data.estimate === undefined )
                                {
                                    data.estimate       = measurement / node.measurementVector;
                                    data.covariance     = node.measurementNoise / node.measurementVector**2;
                                    data.processNoise   = node.processNoise;
                                }
                                else
                                {
                                    // measurement time
                                    const deltaTime     = ( now - data.time ) / 1000;
                                    const stateVector   = 1 + ( node.stateVector - 1 ) * deltaTime;
                                    const controlVector = node.controlVector * deltaTime;
                                    // prediction
                                    const predX         = stateVector * data.estimate + controlVector * control;
                                    const predCov       = stateVector**2 * data.covariance + node.processNoise;
                                    // innovation
                                    const innovation    = measurement - node.measurementVector * predX;
                                    // adaptation
                                    if( node.adaptionCount )
                                    {
                                    delete data.adaptation
                                        const adaptation = node.adaptation[msg.topic] ?? [];
                                        adaptation.push( innovation );
                                        if( adaptation.length > node.adaptionCount )
                                        {
                                            adaptation.shift();
                                            const mean     = adaptation.reduce( (a,b) => a + b, 0 ) / adaptation.length;
                                            const variance = adaptation.reduce( (a,b) => a + ( b - mean ) ** 2, 0) / ( adaptation.length - 1 );
                                            data.r = Math.max( variance, 1e-6 );
                                            data.rt2 = ( variance + node.processNoise ) / 2;
                                        }
                                        node.adaptation[msg.topic] = adaptation;
                                    }
                                    // kalman gain
                                    const gain          = predCov * node.measurementVector / ( predCov * node.measurementVector**2 + node.measurementNoise );
                                    // correction
                                    data.estimate       = predX + gain * innovation;
                                    data.covariance     = ( 1 - gain * node.measurementVector ) * predCov;
                                }
                                data.time = now;
                                return data.estimate;
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
                                data.estimate = 0;
                                sendValue( 0 );
                            }
                            else
                            {
                                let   value = kalmanFilter( payload, control );
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
                            context.set( "data", node.data, node.contextStore );
                        }
                        else
                        {
                            setStatus( "red", "control is NaN" );
                            node.warn( `control is NaN (${msg.topic}=${control})` );
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
