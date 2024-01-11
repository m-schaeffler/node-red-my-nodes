module.exports = function(RED) {
    var tools = require('./tools.js');

    function OrNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.topic    = config.topic ?? "";
        this.property = config.property || "payload";
        this.minData  = Number( config.minData ?? 1 );
        this.filter   = Boolean( config.filter );
        this.last     = null;

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
                const payload = tools.property2boolean( RED.util.getMessageProperty( msg, node.property ) );

                if( payload !== null )
                {
                    let data = context.get( "data" ) ?? {};
                    data[msg.topic] = payload;
                    context.set( "data", data );

                    msg.topic = node.topic;
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
                        let status = { text:msg.payload };
                        if( node.filter )
                        {
                            status.shape = "dot";
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
                            send( msg );
                        }
                        node.status( status );
                    }
                    else
                    {
                        node.status( "waiting for data" );
                    }
                }
                done();
            }
        });
    }

    RED.nodes.registerType("or",OrNode);
}
