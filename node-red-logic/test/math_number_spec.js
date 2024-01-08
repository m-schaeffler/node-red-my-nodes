var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_number.js");

//helper.init(require.resolve('node-red'));

describe( 'math_number Node', function () {

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "tonumber", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
