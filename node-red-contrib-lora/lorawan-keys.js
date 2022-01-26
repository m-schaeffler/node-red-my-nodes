module.exports = function(RED) {
    function lorakeys(n) {
        RED.nodes.createNode(this,n);
        var keys = JSON.parse( n.keys );

        this.getKey = function(devaddr) {
            return keys[devaddr];
        };

        this.name2addr = function(name) {
            for( const item in keys )
            {
                if( name == keys[item].name )
                {
                    return item;
                }
            }
            return undefined;
        };
    }
    RED.nodes.registerType( "lorawan-keys", lorakeys );
}
