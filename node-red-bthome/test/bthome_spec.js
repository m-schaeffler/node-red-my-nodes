var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../bthome.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'bthome Node', function () {
  "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "bthome", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('interval', 1000);
        n1.should.have.a.property('maxCount', 1);
        n1.should.have.a.property('forceClone', false);
        n1.should.have.a.property('firstDelayed', false);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('addCounters', false);
        await delay(50);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
