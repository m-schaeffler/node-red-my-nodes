module.exports = function(RED) {

    function HysteresisEdgeNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        var context = this.context();
        this.property        = config.property ?? "payload";
        this.threshold_raise = config.threshold_raise;
        this.threshold_fall  = config.threshold_fall;
        this.initial         = config.initial;
        this.showState       = config.showState;

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                return null;
            }
            if( msg.reset || msg.topic==="init" )
            {
                context.set( "data", {} );
                node.status( "" );
            }
            else
            {
                msg.payload = Number( RED.util.getMessageProperty( msg, node.property ) );
                let status = { fill:"gray", shape:"dot", text:msg.payload };

                if( ! isNaN( msg.payload ) )
                {
                    let   data = context.get( "data" ) ?? {};
                    const last = data[msg.topic];

                    function sendMsg(edge)
                    {
                        status.fill = "green";
                        data[msg.topic].edge = edge;
                        msg.edge = edge;
                        send( msg );
                    }

                    if( last )
                    {
                        if( msg.payload > this.threshold_raise && this.threshold_raise >= last.value && last.edge != 'rising')
                        {
                            sendMsg( 'rising' );
                        }
                        else if( msg.payload < this.threshold_fall && this.threshold_fall <= last.value && last.edge != 'falling')
                        {
                            sendMsg( 'falling' );
                        }
                    }
                    else
                    {
                        data[msg.topic] = {};
                        if( ['any','rising'].includes(this.initial) && msg.payload > this.threshold_raise )
                        {
                            sendMsg( 'rising' );
                        }
                        else if( ['any','falling'].includes(this.initial) && msg.payload < this.threshold_fall )
                        {
                            sendMsg( 'falling' );
                        }
                    }
                    data[msg.topic].value = msg.payload;
                    context.set( "data", data );
                }
                else
                {
                    status.fill = "red";
                    status.text = "not a Number";
                }

                if( node.showState )
                {
                    node.status( status );
                }
            }
            done();
        });
    }

    RED.nodes.registerType("hysteresisEdge",HysteresisEdgeNode);
}
