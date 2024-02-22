module.exports = function(RED) {

    function ReduceNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.topic    = config.topic ?? "";
        this.property = config.property || "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.minMean  = Number( config.minMean ?? 1 );
        this.maxMean  = Number( config.maxMean ?? 1 );
        this.minData  = Number( config.minData ?? 1 );
        this.algo     = config.algo;
        this.showState= Boolean( config.showState );
        this.filter   = Boolean( config.filter );
        this.last     = null;
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

        node.on('input', function(msg,send,done) {
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
                    const payload = Number( value );
                    let   status  = { shape:"dot" };
                    if( ! isNaN( payload ) )
                    {
                        let data = context.get( "data" ) ?? {};
                        let item = data[msg.topic] ?? [];
                        item.push( payload )
                        data[msg.topic] = item;

                        msg.topic = node.topic;
                        msg.count = 0;
                        msg.data  = data;
                        switch( node.algo )
                        {
                            case "add":
                            case "mean": msg.payload = 0; break;
                            case "prod": msg.payload = 1; break;
                            case "min":  msg.payload = Number.MAX_SAFE_INTEGER; break;
                            case "max":  msg.payload = Number.MIN_SAFE_INTEGER; break;
                            default:     done( "invalid algo: "+node.algo ); return;
                        }
                        for( const key in data )
                        {
                            if( data[key].length >= node.minMean )
                            {
                                msg.count++;
                                while( data[key].length > node.maxMean )
                                {
                                    data[key].shift();
                                }
                                const help = data[key].reduce( (accumulator,value)=>accumulator+value ) / data[key].length;
                                switch( node.algo )
                                {
                                    case "add":
                                    case "mean": msg.payload += help; break;
                                    case "prod": msg.payload *= help; break;
                                    case "min":  msg.payload  = Math.min( msg.payload, help ); break;
                                    case "max":  msg.payload  = Math.max( msg.payload, help ); break;
                                }
                            }
                        }
                        context.set( "data", data );

                        if( msg.count >= node.minData )
                        {
                            switch( node.algo )
                            {
                                case "mean": msg.payload /= msg.count; break;
                            }
                            status.text = msg.payload;
                            if( node.filter )
                            {
                                if( msg.payload !== node.last )
                                {
                                    node.last = msg.payload;
                                    status.fill = "green";
                                    send( msg );
                                }
                                else
                                {
                                    status.fill = "gray";
                                }
                            }
                            else
                            {
                                status.fill = "green";
                                send( msg );
                            }
                        }
                        else
                        {
                            status.fill = "gray";
                            status.text = "to less data";
                        }
                    }
                    else
                    {
                        status.fill = "red";
                        status.text = "payload is NaN";
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

    RED.nodes.registerType("reduce",ReduceNode);
}
