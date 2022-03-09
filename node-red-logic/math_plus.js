module.exports = function(RED) {

    function PlusNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property = config.property || "payload";

        node.on('input', function(msg,send,done) {
            const payload = Number( RED.util.getMessageProperty( msg, node.property ) );

            let data = context.get( "data" ) ?? {};
            data[msg.topic] = payload;
            context.set( "data", data );

            msg.payload = 0;
            for( const item in data )
            {
                msg.payload += data[item];
            }

            node.status( msg.payload );
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("plus",PlusNode);
}
