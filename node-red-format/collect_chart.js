module.exports = function(RED) {

    function CollectChartNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node     = this;
        var context  = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.topics       = JSON.parse( config.topics ?? "[]" );
        this.cyclic       = Number( config.cyclic ?? 60 );
        this.hours        = Number( config.hours ?? 24 );
        this.steps        = Boolean( config.steps );
        this.showState    = Boolean( config.showState );
        this.newData      = false;
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
        this.onceTimeout = setTimeout( function() { node.emit("started"); }, 500 );
        this.interval_id = setInterval( function() { node.emit("cyclic"); }, this.cyclic*1000 );
        node.status( "" );

        function newData()
        {
            node.warn( "resetting chart!" )
            let data = [];
            for( const t of node.topics )
            {
                data.push( { c:t } );
            }
            return data;
        }
        this.data = context.get( "data" ) ?? newData();

        function setStatus()
        {
            if( node.showState )
            {
                node.status( {
                    shape: "dot",
                    fill:  node.newData ? "green" : "gray",
                    text:  node.data.length - node.topics.length
                } );
            }
        }
        setStatus();

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            if( msg.reset )
            {
                node.data = newData();
                context.set( "data", node.data );
                setStatus();
                done();
                return;
            }
            function getPayload(callback)
            {
                if( node.propertyPrepared )
                {
                    RED.util.evaluateJSONataExpression( node.propertyPrepared, msg, function(err, value)
                    {
                        if( err )
                        {
                            done( RED._("debug.invalid-exp", {error: editExpression}) );
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
                const number = Number( value );
                if( ! isNaN( number ) )
                {
                    const now = Date.now();
                    if( node.steps )
                    {
                        let last = context.get( "last" ) ?? {};
                        const lv = last[msg.topic];
                        if( lv !== undefined && lv != number )
                        {
                            data.push( {
                                c: msg.topic,
                                t: now - 100,
                                v: last[msg.topic]
                            } );
                        }
                        last[msg.topic] = number;
                        context.set( "last", last );
                    }
                    node.data.push( {
                        c: msg.topic,
                        t: now,
                        v: number
                    } );
                    node.newData = true;
                    context.set( "data", node.data );
                }
                setStatus();
                done();
            } );
        });

        node.on('started', function() {
            console.log( "collect chart started" );
            node.send( { payload:node.data, init:true } );
        });

        this.cycleCounter = 0;
        node.on('cyclic', function() {
            node.cycleCounter++;
            console.log( "collect chart cyclic "+node.cycleCounter+" "+node.newData );
            if( node.cycleCounter >= 10 )
            {
                node.cycleCounter = 0;
            }
            if( node.newData )
            {
                node.send( { payload:node.data } );
                node.newData = false;
            }
            setStatus();
        });

        node.on('close', function() {
            clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType("collectChart",CollectChartNode);
}
