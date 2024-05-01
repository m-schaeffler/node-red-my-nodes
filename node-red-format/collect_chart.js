module.exports = function(RED) {

    function CollectChartNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.property     = config.property ?? "payload";
        this.propertyType = config.propertyType ?? "msg";
        this.unit         = config.topics ?? "[]";
        this.hours        = Number( config.digits ?? 24 );
        this.showState    = Boolean( config.showState );
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
        this.interval_id = setInterval( function() { node.emit("cyclic"); }, 10*1000 );
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
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
                let   status = {};
                if( ! isNaN( number ) )
                {
                }
                if( node.showState )
                {
                    status.text = msg.payload;
                    node.status( status );
                }
                done();
            } );
        });

        node.on('started', function() {
            console.log( "collect chart started" );
            node.send( { topic:"test", payload:[{c:1,t:2,v:3}] } );
        });

        node.on('cyclic', function() {
            console.log( "collect chart cyclic" );
        });

        node.on('close', function() {
            clearInterval( node.interval_id );
        });
    }

    RED.nodes.registerType("collectChart",CollectChartNode);
}
