const Crypto = require( 'node:crypto' );
const Tools  = require( '../tools.js' );

//const counter = [0x12,0x34,0x56,0x78];
const uuid16 = [0xd2,0xfc];

exports.encryptBthome = function(data,amac,acounter,akey)
{
    function encrypt(data,mac,counter,key)
    {
        const dib        = [ data[0] ];
        const plaintext  = Buffer.from( data.slice( 1 ) );
        const nonce      = Buffer.from( mac.concat( uuid16, dib, counter ) );
        const cipher     = Crypto.createCipheriv( "aes-128-ccm", Buffer.from( key ), nonce, { authTagLength: 4 } );
        const ciphertext = cipher.update( plaintext );
        cipher.final();
        const mic        = cipher.getAuthTag();
        return dib.concat( Array.from( ciphertext ), counter, Array.from( mic ) );
    }

    return encrypt(
        data,
        Tools.mac2bytes( amac ),
        [ (acounter & 0xFF000000)>>24, (acounter & 0xFF0000)>>16, (acounter & 0xFF00)>>8, acounter & 0xFF ],
        Tools.key2bytes( akey )
    );
}
