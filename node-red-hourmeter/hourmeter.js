module.exports = function(RED) {

    function HourMeterNode(config) {
        RED.nodes.createNode(this,config);
        this.config = config;
        this.topic  = config.topic;
        var node = this;
        var context = this.context();
        node.on('input', function(msg,send,done) {
            if( msg.reset )
            {
                context.set( "data", undefined, "storeInFile" );
                node.status( "-" );
                send( [ { topic:this.topic, payload:false }, { topic:this.topic, payload:0 } ] );
            }
            else
            {
                const now  = Date.now();
                let   data = context.get( "data", "storeInFile" ) ?? { counter:0 };
                if( ( !msg.querry ) && ( msg.payload!==undefined ) )
                {
                    if( msg.payload !== data.state )
                    {
                        switch( msg.payload )
                        {
                            case true:
                            case 1:
                            case "1":
                            case "true":
                            case "on":
                                if( data.switchOn === undefined )
                                {
                                    data.switchOn = now;
                                }
                                break;
                            case false:
                            case 0:
                            case "0":
                            case "false":
                            case "off":
                                if( data.switchOn !== undefined )
                                {
                                    data.counter += (now - data.switchOn)/1000;
                                    delete data.switchOn;
                                }
                                break;
                        }
                        data.state = msg.payload;
                    }
                    context.set( "data", data, "storeInFile" );
                }
                else
                {
                    if( data.switchOn !== undefined )
                    {
                        data.counter += (now - data.switchOn)/1000;
                        data.switchOn = now;
                    }
                }
                const out = data.counter/3600;
                node.status( `${data.state} / ${out.toFixed(1)}` );
                send( [ { topic:this.topic, payload:data.switchOn!==undefined }, { topic:this.topic, payload:out } ] );
            }
            done();
        });
    }

    RED.nodes.registerType("hourmeter",HourMeterNode);
}
