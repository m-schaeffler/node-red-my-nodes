module.exports = function(RED) {

    function CollectChartNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node     = this;
        var context  = this.context();
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.contextStore = config.contextStore ?? "none";
        this.topics       = JSON.parse( config.topics ?? "[]" );
        this.cyclic       = Number( config.cyclic ?? 60 );
        this.eraseCycles  = Number( config.eraseCycles ?? 10 );
        this.hours        = Number( config.hours ?? 24 );
        this.steps        = Boolean( config.steps );
        this.showState    = Boolean( config.showState );
        this.cycleJitter  = Number( config.cycleJitter ?? 2000 );
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
        this.interval_id = setInterval( function() { node.emit("cyclic"); }, this.cyclic*1000 + Math.random()*2*this.cycleJitter-this.cycleJitter );
        node.status( "" );

        function createData()
        {
            node.warn( "resetting chart!" );
            console.log( "createData" );
            let data = [];
            for( const t of node.topics )
            {
                data.push( { c:t } );
            }
            return data;
        }
        function getData()
        {
            return node.contextStore != "none" ? context.get( "data", node.contextStore ) : null;
        }
        function setData()
        {
            if( node.contextStore != "none" )
            {
                context.set( "data", node.data, node.contextStore );
            }
        }
        this.data = getData() ?? createData();

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
                node.data = createData();
                setData();
                node.newData = true;
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
                            node.data.push( {
                                c: msg.topic,
                                t: now - 30,
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
                    setData();
                }
                setStatus();
                done();
            } );
        });

        node.on('started', function() {
            //console.log( "collect chart started" );
            node.send( { payload:node.data, init:true } );
        });

        this.cycleCounter = 0;
        node.on('cyclic', function() {
            node.cycleCounter++;
            //console.log( "collect chart cyclic "+node.cycleCounter+" "+node.newData );
            if( node.cycleCounter >= node.eraseCycles )
            {
                node.cycleCounter = 0;
                const date  = Date.now() - node.hours * 3600*1000;
                const start = node.topics.length;
                let   end   = start;
                while( node.data[end]?.t < date )
                {
                    end++;
                }
                if( end > start )
                {
                    //console.log( `delete data ${end-start}` );
                    node.data.splice( start, end - start );
                    node.newData = true;
                }
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
