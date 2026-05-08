const os   = require( 'node:os' );
const path = require( 'node:path' );
const fs   = require( 'node:fs' );

module.exports = function(RED) {

    function FileWriteAtomicNode(config) {
        RED.nodes.createNode(this,config);
        //this.config = config;
        var node = this;
        this.filename      = config.filename ?? "";
        this.encoding      = config.encoding ?? null;
        this.createDir     = Boolean( config.createDir );
        this.appendNewline = Boolean( config.appendNewline );
        this.jsonPretty    = config.jsonPretty ? 3 : null;
        this.showState     = Boolean( config.showState );
        this.locked        = false;
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            let filename = msg.filename ?? node.filename;
            let payload  = msg.payload  ?? "";
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
            else if( node.locked )
            {
                setStatus( "yellow", "locked" );
            }
            else
            {
                node.locked = true;
                try
                {
                    if( RED.settings.fileWorkingDirectory && !path.isAbsolute( filename ) )
                    {
                        filename = path.resolve( path.join( RED.settings.fileWorkingDirectory, filename ) );
                    }

                    if( ! Buffer.isBuffer( payload ) )
                    {
                        switch( typeof payload )
                        {
                            case "object":
                                payload = JSON.stringify( payload, null, node.jsonPretty );
                                break;
                            case "number":
                            case "boolean":
                                payload = String( payload );
                                break;
                        }
                        if( node.appendNewline )
                        {
                            payload += os.EOL;
                        }
                    }

                    if( node.createDir )
                    {
                        await fs.promises.mkdir( path.dirname( filename ), { recursive:true } );
                    }
                    const tmpfile = filename + ".tmp";
                    await fs.promises.writeFile( tmpfile, payload, { encoding:encoding, flush:true } );
                    await fs.promises.rename( tmpfile, filename );

                    setStatus( "green" );
                }
                catch( err )
                {
                    setStatus( "red", err.message );
                }
                finally
                {
                    node.locked = false;
                }
            }
        });
    }

    RED.nodes.registerType("fileWriteAtomic",FileWriteAtomicNode);
}
