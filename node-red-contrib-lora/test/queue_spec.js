var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-queue-message.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");

describe( 'lorawan-queue-message Node', function () {
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
    var flow = [{ id: "n1", type: "lorawan-queue-message", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('keyconf', null);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should be store messages', function (done) {
    var flow = [{ id: "n1", type: "lorawan-queue-message", keys:"nk", name: "test" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys" }];
    helper.load([node,nodeKey], flow, function () {
      var n1 = helper.getNode("n1");
      var nk = helper.getNode("nk");
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        n1.receive({ topic: "Foo 1", payload: [0,1,2,3,4,5,6,7] });
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
