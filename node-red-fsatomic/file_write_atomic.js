module.exports = function(RED) {

    function FileWriteAtomicNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.filename      = config.filename ?? "";
        this.encoding      = config.encoding ?? "none";
        this.createDir     = Boolean( config.createDir );
        this.appendNewline = Boolean( config.appendNewline );
        this.showState     = Boolean( config.showState );
        node.status( "" );

        node.on('input', function(msg,send,done) {
            if( msg.invalid )
            {
                done();
                return;
            }
            done();
        });
    }

    RED.nodes.registerType("fileWriteAtomic",FileWriteAtomicNode);
}
