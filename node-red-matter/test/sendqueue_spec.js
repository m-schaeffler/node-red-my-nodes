var should    = require("should");
var sinon     = require("sinon");
var SendQueue = require("../sendqueue.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'send queue handling', function () {
  "use strict";

  it('should send single messages', async function () {
      let sendCallback = sinon.spy();
      let queue = new SendQueue( sendCallback );
  });

});
