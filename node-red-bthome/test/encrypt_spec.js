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
      ).should.match( [ 69, 186, 65, 105, 101, 114, 218, 124, 8, 91, 106, 156, 51, 34, 17, 0, 250, 138, 147, 197 ] );
      done();
    }
    catch(err) {
      done(err);
    }
  });

  it('should encrypt bthome messages with timestamp as counter', function (done) {
    try {
      Encrypt.encryptBthome(
        [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
        '00:10:20:30:40:50',
        Math.floor( Date.now()/1000 ),
        '00112233445566778899AABBCCDDEEFF'
      ).should.be.an.Array();
      done();
    }
    catch(err) {
      done(err);
    }
  });

});
