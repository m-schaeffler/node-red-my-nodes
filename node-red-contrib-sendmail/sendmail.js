module.exports = function(RED) {
    const execFile = require('child_process').execFile;

    function SendmailNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.from = config.from ?? "node-red";
        this.to   = config.to   ?? "root";

        node.on('input', function(msg,send,done) {
            node.status( "sending mail" );
            const child = execFile( '/usr/bin/mail',
                                    ['-s',msg.topic||'','-r',msg.from??node.from,'-a', 'Content-type: text/html','--',msg.to??node.to],
                                    { timeout:5000 },
                                    function(error, stdout, stderr) {
                                       if( error )
                                       {
                                          node.status( { fill:"red", shape:"ring", text:error } );
                                          done( error );
                                       }
                                       else
                                       {
                                          node.status( { fill:"green", shape:"dot", text:"mail sent" } );
                                          done();
                                       }
                                    } );
            child.stdin.write( msg.payload+"\0x0B.\x0B\x04" );
            child.stdin.end();
        });
    }

    RED.nodes.registerType("sendmail",SendmailNode);
}
