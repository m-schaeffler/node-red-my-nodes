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
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.have.a.property('counter',data[topic].maxCount);
      data[topic].should.have.a.property('timer',null);
      data[topic].should.have.a.property('message',null);
      return data[topic];
  }

  function checkDataWithoutCounter(data,topic) {
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.not.have.a.property('counter');
      data[topic].should.have.a.property('timer',null);
      data[topic].should.have.a.property('message',null);
      return data[topic];
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
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c==0?'t':'u');
          msg.should.have.a.property('payload',c+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(1);
        n1.receive({ topic: "u", payload: 2 });
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "u", payload: 4 });
        await delay(25);
        c.should.match(4);
        await delay(475);
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

  it('should resend messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", maximum:3, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c<3?'t':c<7?'u':'v');
          msg.should.have.a.property('payload',c<7?Math.trunc(c/3)+1:4);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('maxCount', 3);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(3);
        n1.receive({ topic: "u", payload: 2 });
        await delay(25);
        c.should.match(4);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(6);
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "v", payload: 4 });
        await delay(25);
        c.should.match(8);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(10);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should resend messages with counters', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", maximum:3, addCounters:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c<3?'t':'u');
          msg.should.have.a.property('payload',Math.trunc(c/3)+1);
          msg.should.have.a.property('counter',c%3+1);
          msg.should.have.a.property('max',3);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('maxCount', 3);
        n1.should.have.a.property('addCounters', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(3);
        n1.receive({ topic: "u", payload: 2 });
        await delay(25);
        c.should.match(4);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(6);
        n1.receive({ topic: "u", payload: 3 });
        await delay(25);
        c.should.match(7);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(9);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should resend messages with first sending delayed', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", maximum:1, firstDelayed:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c==0?'t':'u');
          msg.should.have.a.property('payload',c+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('maxCount', 1);
        n1.should.have.a.property('firstDelayed', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(0);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(1);
        n1.receive({ topic: "u", payload: -2 });
        n1.receive({ topic: "u", payload: 2 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(2);
        n1.receive({ topic: "u", payload: -3 });
        n1.receive({ topic: "u", payload: -4 });
        n1.receive({ topic: "u", payload: 3 });
        await delay(25);
        c.should.match(2);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(3);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should change the interval', function (done) {
    const expPayload = [1,1,2,3,4,4];
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:1, intervalUnit:"hours", maximum:2, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c<2?'t':'u');
          msg.should.have.a.property('payload',expPayload[c]);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
          msg.should.not.have.a.property('resend_interval');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 3600*1000);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1, resend_interval: 100 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" ).should.have.a.property('interval', 100);
        c.should.match(2);
        n1.receive({ topic: "u", payload: 2 });
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "u", payload: 4 });
        await delay(25);
        c.should.match(5);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(6);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should change count', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c<3?'t':'u');
          msg.should.have.a.property('payload',Math.trunc(c/3)+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
          msg.should.not.have.a.property('resend_max_count');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('maxCount', 1);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1, resend_max_count: 3 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" ).should.have.a.property('maxCount', 3);
        c.should.match(3);
        n1.receive({ topic: "u", payload: 2 });
        await delay(25);
        c.should.match(4);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(6);
        n1.receive({ topic: "u", payload: 3 });
        await delay(25);
        c.should.match(7);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(9);
        n1.should.have.a.property('maxCount', 1);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should not clone messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", maximum:4, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',c+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
        msg.payload++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('forceClone', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
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

  it('should clone messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:100, intervalUnit:"msecs", maximum:4, clone:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
        msg.payload++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('forceClone', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
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

  it('should resend messages forever', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:50, intervalUnit:"msecs", maximum:0, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 0);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(1000);
        c.should.match(21);
        n1.receive({ topic: "t", resend_max_count: 23 });
        await delay(175);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(23);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should be stopped by msg.reset with topic', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:50, intervalUnit:"msecs", maximum:0, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 0);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(500);
        c.should.match(11);
        n1.receive({ topic: "t", reset: true });
        await delay(175);
        checkDataWithoutCounter( n1.context().get("data"), "all_topics" );
        c.should.match(11);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should be stopped by msg.reset without topic', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:50, intervalUnit:"msecs", maximum:0, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 0);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(500);
        c.should.match(11);
        n1.receive({ reset: true });
        await delay(175);
        checkDataWithoutCounter( n1.context().get("data"), "all_topics" );
        c.should.match(11);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

});
