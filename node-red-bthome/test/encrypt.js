const Crypto = require( 'node:crypto' );
const Tools  = require( '../tools.js' );

exports.encryptBthome = function(data,amac,acounter,akey)
{
    function encrypt(mac,counter,key)
    {
        const dib        = [ data[0] ];
        const plaintext  = Buffer.from( data.slice( 1 ) );
        const nonce      = Buffer.from( mac.concat( Tools.uuid16, dib, counter ) );
        const cipher     = Crypto.createCipheriv( "aes-128-ccm", Buffer.from( key ), nonce, { authTagLength: 4 } );
        const ciphertext = cipher.update( plaintext );
        cipher.final();
        const mic        = cipher.getAuthTag();
        return dib.concat( Array.from( ciphertext ), counter, Array.from( mic ) );
    }

    return encrypt(
        Tools.mac2bytes( amac ),
        [ acounter & 0xFF, (acounter & 0xFF00)>>8, (acounter & 0xFF0000)>>16, (acounter & 0xFF000000)>>24 ],
        Tools.key2bytes( akey )
    );
}
