module.exports = function(RED) {

    function PlusNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";
        this.minData  = Number( config.minData );

        node.on('input', function(msg,send,done) {
            const payload = Number( RED.util.getMessageProperty( msg, node.property ) );

            let data = context.get( "data" ) ?? {};
            data[msg.topic] = payload;
            context.set( "data", data );

            msg.payload = 0;
            let count   = 0;
            for( const item in data )
            {
                count++;
                msg.payload += data[item];
            }

            if( count >= node.minData )
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

    RED.nodes.registerType("plus",PlusNode);
}
