const fs = require( 'node:fs' );

module.exports = function(RED) {

    function FileReadSimpleNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.filename  = config.filename ?? "";
        this.encoding  = config.encoding ?? "utf8";
        this.format    = config.format   ?? "string";
        this.showState = Boolean( config.showState );
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            let filename = msg.filename ?? node.filename;
            let encoding = msg.encoding ?? node.encoding;

            function setStatus(color,text)
            {
                if( node.showState )
                {
                    node.status({ fill: color, shape: "dot", text: text ?? "ok" });
                }
                done( text );
            }

            if( msg.invalid )
            {
                done();
            }
            else if( ! filename )
            {
                setStatus( "red", "no filename" );
            }
            else
            {
                try
                {
                    if( RED.settings.fileWorkingDirectory && !path.isAbsolute( filename ) )
                    {
                        filename = path.resolve( path.join( RED.settings.fileWorkingDirectory, filename ) );
                    }

                    let payload = await fs.promises.readFile( filename, encoding );

                    msg.encoding = encoding;

                    msg.filename = filename;
                    msg.payload  = payload;
                    send( msg );
                    setStatus( "green" );
                }
                catch( err )
                {
                    setStatus( "red", err.message );
                }
            }
        });
    }

    RED.nodes.registerType("fileReadSimple",FileReadSimpleNode);
}
