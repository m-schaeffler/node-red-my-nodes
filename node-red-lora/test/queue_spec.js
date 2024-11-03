var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-queue-message.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

describe( 'lorawan-queue-message Node', function () {

  beforeEach(function (done) {
    helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memory0: {
          module: "memory"
        }
      }
    });
    Context.load().then(function () {
      done();
    });
  }

  afterEach(function(done) {
    helper.unload().then(function () {
      return Context.clean({allNodes: {}});
    }).then(function () {
      return Context.close();
    }).then(function () {
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

  it('should store messages', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-queue-message", keys:"nk", name: "test", z: "flow" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys", z: "flow" }];
    helper.load([node,nodeKey], flow, function () {
      var n1 = helper.getNode("n1");
      var nk = helper.getNode("nk");
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().flow.get("sendqueue") );
        n1.receive({ topic: "Foo 1", payload: [0,1,2,3,4,5,6,7] });
        var q = n1.context().flow.get("sendqueue");
        q.should.be.an.Object();
        q.should.have.a.property('12345678').which.is.an.Array().of.length(1);
        q['12345678'][0].should.be.eql(Buffer.from([0,1,2,3,4,5,6,7]));
        //
        n1.receive({ topic: "Foo 1", payload: [255] });
        q.should.have.a.property('12345678').which.is.an.Array().of.length(2);
        q['12345678'][0].should.be.eql(Buffer.from([0,1,2,3,4,5,6,7]));
        q['12345678'][1].should.be.eql(Buffer.from([255]));
        //
        n1.receive({ topic: "Foo 2", payload: [255] });
        q.should.have.only.keys('12345678');
        //
        n1.receive({ topic: "Bar 1", payload: [128] });
        q.should.have.a.property('0000abcd').which.is.an.Array().of.length(1);
        q['0000abcd'][0].should.be.eql(Buffer.from([128]));
        //
        n1.receive({ topic: "Charlie", payload: [255] });
        q.should.have.only.keys('12345678','0000abcd');
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
