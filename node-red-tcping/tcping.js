module.exports = function(RED) {

    function TcPingNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            try
            {
                done();
            }
            catch( e )
            {
                console.log(e);
                //node.stats.exception++;
                node.status( {
                    fill:  "red",
                    shape: "dot",
                    text:  e.name
                } );
                done( e );
            }
        });
    }

    RED.nodes.registerType( "tcPing", TcPingNode );
}
