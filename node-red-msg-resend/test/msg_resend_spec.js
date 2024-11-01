var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../msg_resend.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'msg-resend Node', function () {
  "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        default: "memoryOnly",
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

  function checkData(data,topic) {
      data.should.be.a.Object();
      data[topic].should.be.a.Object();
      for( const i in data )
      {
          data[i].should.have.a.property('counter',data[i].maxCount);
          data[i].should.have.a.property('timer',null);
      }
  }

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "msg-resend2", name: "test" }];
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
        await delay(500);
        should.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        c++;
        try {
          msg.should.have.a.property('topic',c==1?'t':'u');
          msg.should.have.a.property('payload',c);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('interval', 100);
        await delay(500);
        should.exist( n1.context().get("data") );
        n1.receive({ topic: "t", payload: 1 });
        await delay(500);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(1);
        n1.receive({ topic: "u", payload: 2 });
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "u", payload: 4 });
        await delay(500);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(4);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

});
