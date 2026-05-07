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
        this.showState     = Boolean( config.showState );
        this.locked        = false;
        node.status( "" );

        node.on('input', async function(msg,send,done) {
            let   filename = msg.filename ?? node.filename;
            let   payload  = msg.payload  ?? "";
            const encoding = msg.encoding ?? node.encoding;
            if( msg.invalid )
            {
                done();
            }
            else if( ! filename )
            {
                done( "no filename" );
            }
            else if( node.locked )
            {
                done( "already locked" );
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
                        if( typeof payload == "object" )
                        {
                            payload = JSON.stringify( payload );
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
                    await fs.promises.writeFile( tmpfile, String( payload ), { encoding:encoding, flush:true } );
                    await fs.promises.rename( tmpfile, filename );

                    done();
                }
                catch( err )
                {
                    done( err.message );
                }
                finally
                {
                    node.locked = false;
                    console.log("unlocked")
                }
            }
        });
    }

    RED.nodes.registerType("fileWriteAtomic",FileWriteAtomicNode);
}
