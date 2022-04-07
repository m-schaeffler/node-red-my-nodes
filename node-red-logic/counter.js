module.exports = function(RED) {

    function CounterNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();

        node.on('input', function(msg,send,done) {
            msg.count = context.get( "count" ) ?? 0;
            if( msg.reset || msg.topic==="init" )
            {
                msg.count = 0;
            }
            else if( msg.query || msg.topic==="query" )
            {
            }
            else
            {
                msg.count++;
            }
            context.set( "count", msg.count );

            node.status( msg.count );
            send( msg );
            done();
        });
    }

    RED.nodes.registerType("counter",CounterNode);
}
