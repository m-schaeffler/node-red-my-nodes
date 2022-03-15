module.exports = function(RED) {
    var tools = require('./tools.js');

    function OrNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";
        this.minData  = Number( config.minData );

        node.on('input', function(msg,send,done) {
            const payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );

            if( payload !== null )
            {
                let data = context.get( "data" ) ?? {};
                data[msg.topic] = payload;
                context.set( "data", data );

                msg.payload = false;
                msg.count   = 0;
                for( const item in data )
                {
                    msg.count++;
                    if( data[item] )
                    {
                        msg.payload = true;
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

            done();
        });
    }

    RED.nodes.registerType("or",OrNode);
}
