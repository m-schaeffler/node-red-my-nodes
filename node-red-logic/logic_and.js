module.exports = function(RED) {
    var tools = require('./tools.js');

    function AndNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.topic    = config.topic;
        this.property = config.property || "payload";
        this.minData  = Number( config.minData );

        node.on('input', function(msg,send,done) {
            if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
            }
            else
            {
                const payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );

                if( payload !== null )
                {
                    let data = context.get( "data" ) ?? {};
                    data[msg.topic] = payload;
                    context.set( "data", data );

                    msg.topic = node.topic;
                    msg.payload = true;
                    msg.count   = 0;
                    for( const item in data )
                    {
                        msg.count++;
                        if( ! data[item] )
                        {
                             msg.payload = false;
                        }
                    }

                    if( msg.count >= node.minData )
                    {
                        node.status( msg.payload );
                        send( msg );
                    }
                    else
                    {
                        node.status( "waiting for data" );
                    }
                }
            }

            done();
        });
    }

    RED.nodes.registerType("and",AndNode);
}
