/*
const counter = [0x12,0x34,0x56,0x78];
const mac     = [0x00,0x00,0x00,0x00,0x00,0x00];
const uuid16  = [0xd2,0xfc];
const key = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

function encyrpt(data)
{
    const dib        = [ data[0] ];
    const plaintext  = Buffer.from( data.slice( 1 ) );
    const nonce      = Buffer.from( mac.concat( uuid16, dib, counter ) );
    const cipher     = crypto.createCipheriv( "aes-128-ccm", Buffer.from( key ), nonce, { authTagLength: 4 } );
    const ciphertext = cipher.update( plaintext );
    cipher.final();
    const mic        = cipher.getAuthTag();
    return dib.concat( Array.from( ciphertext ), counter, Array.from( mic ) );
}

msg.payload = encyrpt( msg.payload );

return msg;
*/
