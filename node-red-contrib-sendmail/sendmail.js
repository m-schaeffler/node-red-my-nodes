module.exports = function(RED) {
    var execFileSync = require('child_process').execFileSync;

    function SendmailNode(config) {
        RED.nodes.createNode(this,config);
        this.config = config;
        var node = this;
        node.on('input', function(msg) {
            execFileSync( '/usr/bin/mail',
                          ['-s',msg.topic||'','-r',node.config.from||'node-red','--',node.config.to||'root'],
                          { input:msg.payload+"\0x0B.\x0B\x04",
                            timeout:1000 } );
        });
    }

    RED.nodes.registerType("sendmail",SendmailNode);
}
