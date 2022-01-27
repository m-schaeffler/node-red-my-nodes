module.exports = function(RED)
{
    function lorawandsend(config)
    {
        RED.nodes.createNode( this, config );
        var   node    = this;
        var   context = this.context();
        var   flow    = this.context().flow;
        const keyconf = RED.nodes.getNode( config.keys );

        node.on('input',function(msg,send,done) {
            let dev_adr = keyconf.name2addr( msg.topic );
            let payload = Buffer.isBuffer( msg.payload ) ? msg.payload : Buffer.from( msg.payload );
            if( dev_adr )
            {
                let queue = flow.get( "sendqueue" ) ?? {};
                let help  = queue[dev_adr] ?? [];
                help.push( payload );
                queue[dev_adr] = help;
                flow.set( "sendqueue", queue );
                let counter = context.get( "counter" ) ?? 0;
                node.status( ++counter );
                context.set( "counter", counter );
                done();
            }
            else
            {
                done( "unknow device "+msg.topic );
            }
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-queue-message", lorawandsend );
};
