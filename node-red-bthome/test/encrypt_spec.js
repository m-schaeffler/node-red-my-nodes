var should  = require("should");
var Encrypt = require("./encrypt.js");

describe( 'encrypt helper', function () {
  "use strict";

  it('should encrypt bthome messages', function (done) {
    try {
      Encrypt.encryptBthome(
        [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
        '00:10:20:30:40:50',
        0x00112233,
        '00112233445566778899AABBCCDDEEFF'
      ).should.match( [69,185,49,198,170,133,200,48,253,111,234,66,0,17,34,51,42,184,90,0] );
      done();
    }
    catch(err) {
      done(err);
    }
  });

});
