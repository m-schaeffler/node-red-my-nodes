module.exports = function(RED) {
    function lorakeys(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.keys = JSON.parse( config.keys );

        node.getKey = function(devaddr) {
            return node.keys[devaddr];
        };

        node.name2addr = function(name) {
            for( const item in node.keys )
            {
                if( name == node.keys[item].name )
                {
                    return item;
                }
            }
            return undefined;
        };
    }
    RED.nodes.registerType( "lorawan-keys", lorakeys );
}
