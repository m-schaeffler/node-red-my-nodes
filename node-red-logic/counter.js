module.exports = function(RED) {

    function CounterNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();

        node.on('input', function(msg,send,done) {
            let data = context.get( "data" ) ?? 0;
            if( msg.reset || msg.topic==="init" )
            {
                data = 0;
            }
            else
            {
                data++;
            }
            context.set( "data", data );

            msg.count = data;

            node.status( data );
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("counter",CounterNode);
}
