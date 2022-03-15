module.exports = function(RED) {
    var tools = require('./tools.js');

    function AndNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";
        this.minData  = Number( config.minData );

        node.on('input', function(msg,send,done) {
            const payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );

            let data = context.get( "data" ) ?? {};
            data[msg.topic] = payload;
            context.set( "data", data );

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

            done();
        });
    }

    RED.nodes.registerType("and",AndNode);
}
