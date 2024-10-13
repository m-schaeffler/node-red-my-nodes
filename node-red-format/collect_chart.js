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
        this.onceTimeout = setTimeout( function() { node.emit("started"); }, 250 );
        this.interval_id = setInterval( function() { node.emit("cyclic"); }, this.cyclic*1000 + Math.random()*2*this.cycleJitter-this.cycleJitter );
        node.status( "" );

        function getTopic(index)
        {
            const help = node.topics[index];
            return help?.topic ?? help;
        };
        function isStep(topic)
        {
            if( node.steps )
            {
                return true;
            }
            for( const t of node.topics )
            {
                if( t?.topic === topic )
                {
                    return t?.step ?? false;
                }
            }
            return false;
        };

        function createData()
        {
            node.warn( "resetting chart!" );
            console.log( "createData" );
            let data = [];
            for( const i in node.topics )
            {
                data.push( { c:getTopic( i ), t:null } );
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
        this.data = null;

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
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid || node.data === null )
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
                const number = Number( value );
                if( ! isNaN( number ) )
                {
                    const now = Date.now();
                    if( isStep( msg.topic ) )
                    {
                        let last = context.get( "last", node.contextStore ) ?? {};
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
                        context.set( "last", last, node.contextStore );
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
            if( node.contextStore != "none" )
            {
                node.data ??= getData();
                if( node.data )
                {
                    if( node.data.length < node.topics.length )
                    {
                        node.warn( "too less topics => resetting chart" );
                        console.log( "data too short" );
                        node.data = null;
                    }
                    else
                    {
                        // overwrite topics, in case they were changed or added
                        for( const i in node.topics )
                        {
                            node.data[i].c = getTopic( i );
                            if( node.data[i].v !== undefined )
                            {
                                node.warn( "additional topic" );
                                console.log( "additional topic" );
                                node.data[i].t = null;
                                delete node.data[i].v;
                            }
                        }
                        // check for deleted topics
                        while( node.data[node.topics.length] && node.data[node.topics.length].v === undefined )
                        {
                            node.warn( "surplus topic deleted" );
                            console.log( "topic deleted" );
                            node.data.splice( node.topics.length, 1 );
                        }
                    }
                }
            }
            node.data ??= createData();
            node.send( { payload:node.data, init:true } );
            setStatus();
        });

        this.cycleCounter = 0;
        node.on('cyclic', function() {
            node.cycleCounter++;
            //console.log( "collect chart cyclic "+node.cycleCounter+" "+node.newData );
            const dateStart = Date.now() - node.hours * 3600*1000;
            if( node.cycleCounter >= node.eraseCycles )
            {
                node.cycleCounter = 0;
                const start = node.topics.length;
                let   end   = start;
                while( node.data[end]?.t < dateStart )
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
                for( const i in node.topics )
                {
                    node.data[i].t = dateStart;
                }
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
