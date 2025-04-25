var should  = require("should");
var Encrypt = require("./encrypt.js");

describe( 'encrypt helper', function () {
  "use strict";

  it('should encrypt bthome messages', function (done) {
    try {
      console.log( Encrypt.encryptBthome(
        [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
        '00:10:20:30:40:50',
        0x00112233,
        '00112233445566778899AABBCCDDEEFF'
     ) );
      done();
    }
    catch(err) {
      done(err);
    }
  });

});
