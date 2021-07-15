module.exports = function(RED)
{
    var lora_packet = require( 'lora-packet' );
    
    function lorawanencode(config)
    {
        RED.nodes.createNode( this, config );
        var   node = this;
        const keys = JSON.parse( config.keys );

        node.on('input',function(msg) {
        });

        node.on("close", function(){});
    }

    RED.nodes.registerType( "lorawan-packet-encoder", lorawanencode );
};
