var should = require("should");
var assertions = require('./asserts.js');
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../hourmeter.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'hourmeter Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memoryOnly: {
          module: "memory"
        },
        storeInFile: {
          module: "memory"
        }
      }
    });
    Context.load().then(function () {
      done();
    });
  }

  afterEach(function(done) {
      helper.unload().then(function() {
          return Context.clean({allNodes: {}});
      }).then(function () {
          return Context.close();
      }).then(function () {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "hourmeter", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('cycle',0);
        n1.should.have.a.property('contextStore', 'none');
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        should.not.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with cycle activated', function (done) {
    this.timeout( 5000 );
    const reasons = ['query','query','on','query','query','off','query','query'];
    var flow = [{ id: "n1", type: "hourmeter", topic:"zaehler", cycle:1/120, name: "test", wires: [["n2"],["n3"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" }];
    helper.load(node, flow, async function () {
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var q1 = 0;
      var q2 = 0;
      var start;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c1++;
          msg.should.have.property('topic','zaehler');
          msg.should.have.property('payload',c1>=3&&c1<6);
          msg.should.have.property('reason',reasons[c1-1]);
          if( msg.reason == "query" )
          {
            const delta = Date.now()-start;
            delta.should.be.approximately(++q1*60000/120,50);
          }
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        console.log(msg);
        try {
          c2++;
          msg.should.have.property('topic','zaehler');
          msg.should.have.property('reason',reasons[c2-1]);
          if( msg.reason == "query" )
          {
            const delta = Date.now()-start;
            delta.should.be.approximately(++q2*60000/120,50);
          }
          if( c2 <= 3 )
          {
            msg.should.have.property('payload',0);
          }
          else if( c2 < 6)
          {
            msg.should.have.property('payload').which.is.approximately(((q2-2)*60000/120-100)/3600000,50/3600000);
          }
          else
          {
            msg.should.have.property('payload').which.is.approximately(1000/3600000,50/3600000);
          }
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('topic', 'zaehler');
        n1.should.have.a.property('cycle',1/120);
        start = Date.now();
        await delay(50);
        c1.should.match( 0 );
        c2.should.match( 0 );
        should.not.exist( n1.context().get("data") );
        await delay(1000);
        c1.should.match( 2 );
        c2.should.match( 2 );
        should.not.exist( n1.context().get("data") );
        n1.receive({ topic:"test", payload: false });
        await delay(50);
        c1.should.match( 2 );
        c2.should.match( 2 );
        n1.context().get("data").should.have.ValidData();
        n1.receive({ topic:"test", payload: true });
        await delay(50);
        c1.should.match( 3 );
        c2.should.match( 3 );
        should.exist( n1.context().get("data") );
        await delay(900);
        c1.should.match( 5 );
        c2.should.match( 5 );
        n1.receive({ topic:"test", payload: true });
        await delay(50);
        c1.should.match( 5 );
        c2.should.match( 5 );
        n1.receive({ topic:"test", payload: false });
        await delay(50);
        c1.should.match( 6 );
        c2.should.match( 6 );
        await delay(900);
        c1.should.match( 8 );
        c2.should.match( 8 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        const q = n1.context().get("data");
        q.should.be.an.Object();
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
