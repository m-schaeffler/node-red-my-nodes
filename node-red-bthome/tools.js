// Tooling for bthome

exports.key2bytes = function(str)
{
    switch( typeof str )
    {
        case "undefined":
            return null;
        case "string":
            if( str.length == 32 )
            {
                const buf = Buffer.alloc( 16 );
                for( let i=0; i<16 ; i++ )
                {
                    buf[i] = Number.parseInt( str.slice( i*2, i*2 + 2 ), 16 );
                }
                return buf;
            }
            else
            {
                throw new Error( " keylength must be 16 bytes" );
            }
        default:
            return Buffer.from( str );
    }
}

exports.mac2bytes = function(str)
{
    let mac = [];
    for( const help of str.split( ":" ) )
    {
        mac.push( Number.parseInt( help, 16 ) );
    }
    return mac;
}
