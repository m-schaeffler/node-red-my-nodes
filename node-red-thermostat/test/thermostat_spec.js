var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../thermostat.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'thermostat Node', function () {
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
    let flow = [{ id: "n1", type: "thermostat", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('nominal', 20);
        n1.should.have.a.property('cycleTime', 600);
        n1.should.have.a.property('cycleCount', 1);
        await delay(50);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
