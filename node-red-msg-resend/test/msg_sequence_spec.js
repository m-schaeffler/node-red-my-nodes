var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../msg_sequence.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'msg-sequence Node', function () {
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

  function checkData(n1,topic) {
      const data = n1.context().get("data");
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.have.a.property('counter',n1.outputs);
      data[topic].should.have.a.property('message',null);
      return data[topic];
  }

  function checkDataWithoutCounter(n1,topic) {
      const data = n1.context().get("data");
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.not.have.a.property('counter');
      data[topic].should.have.a.property('message',null);
      return data[topic];
  }

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "msg-sequence", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('interval', 1000);
        n1.should.have.a.property('outputs', 1);
        n1.should.have.a.property('forceClone', false);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('showState', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:1, interval:100, intervalUnit:"msecs", wires: [["n2"]] },
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
        n1.should.have.a.property('outputs', 1);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1, "all_topics" );
        c.should.match(1);
        n1.receive({ topic: "u", payload: 2 });
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "u", payload: 4 });
        await delay(25);
        c.should.match(4);
        await delay(475);
        checkData( n1, "all_topics" );
        c.should.match(4);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should sequence messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:3, interval:100, intervalUnit:"msecs", contextStore:"memoryOnly", wires: [["n2"],["n3"],["n4"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      n2.on("input", function (msg) {
        console.log("n2",c1,msg);
        try {
          msg.should.have.a.property('topic',c1==0?'t':c1<3?'u':'v');
          msg.should.have.a.property('payload',c1+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c1++;
      });
      n3.on("input", function (msg) {
        console.log("n3",c2,msg);
        try {
          msg.should.have.a.property('topic',c2==0?'t':c2<2?'u':'v');
          msg.should.have.a.property('payload',c2<2?c2+1:4);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c2++;
      });
      n4.on("input", function (msg) {
        console.log("n4",c3,msg);
        try {
          msg.should.have.a.property('topic',c3==0?'t':c3<2?'u':'v');
          msg.should.have.a.property('payload',c3<2?c3+1:4);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c3++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('outputs', 3);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c1.should.match(0);
        c2.should.match(0);
        c3.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c1.should.match(1);
        c2.should.match(0);
        c3.should.match(0);
        await delay(475);
        checkData( n1, "all_topics" );
        c1.should.match(1);
        c2.should.match(1);
        c3.should.match(1);
        n1.receive({ topic: "u", payload: 2 });
        await delay(25);
        c1.should.match(2);
        c2.should.match(1);
        c3.should.match(1);
        await delay(475);
        checkData( n1, "all_topics" );
        c1.should.match(2);
        c2.should.match(2);
        c3.should.match(2);
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "v", payload: 4 });
        await delay(25);
        c1.should.match(4);
        c2.should.match(2);
        c3.should.match(2);
        await delay(475);
        checkData( n1, "all_topics" );
        c1.should.match(4);
        c2.should.match(3);
        c3.should.match(3);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should change the interval', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:2, interval:1, intervalUnit:"hours", contextStore:"memoryOnly", wires: [["n2"],["n3"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      n2.on("input", function (msg) {
        console.log("n2",c1,msg);
        try {
          msg.should.have.a.property('topic',c1==0?'t':'u');
          msg.should.have.a.property('payload',c1+1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
          msg.should.not.have.a.property('resend_interval');
        }
        catch(err) {
          done(err);
        }
        c1++;
      });
      n3.on("input", function (msg) {
        console.log("n3",c2,msg);
        try {
          msg.should.have.a.property('topic',c2==0?'t':'u');
          msg.should.have.a.property('payload',c2==0?1:4);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
          msg.should.not.have.a.property('resend_interval');
        }
        catch(err) {
          done(err);
        }
        c2++;
      });
      try {
        n1.should.have.a.property('interval', 3600*1000);
        n1.should.have.a.property('outputs', 2);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c1.should.match(0);
        c2.should.match(0);
        n1.receive({ topic: "t", payload: 1, resend_interval: 100 });
        await delay(25);
        c1.should.match(1);
        c2.should.match(0);
        await delay(475);
        checkData( n1, "all_topics" ).should.have.a.property('interval', 100);
        c1.should.match(1);
        c2.should.match(1);
        n1.receive({ topic: "u", payload: 2 });
        n1.receive({ topic: "u", payload: 3 });
        n1.receive({ topic: "u", payload: 4 });
        await delay(25);
        c1.should.match(4);
        c2.should.match(1);
        await delay(475);
        checkData( n1, "all_topics" );
        c1.should.match(4);
        c2.should.match(2);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
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
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:4, interval:100, intervalUnit:"msecs", contextStore:"memoryOnly", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n5 = helper.getNode("n5");
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log("n2",c,msg);
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
      n3.on("input", function (msg) {
        console.log("n3",c,msg);
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
      n4.on("input", function (msg) {
        console.log("n4",c,msg);
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
      n5.on("input", function (msg) {
        console.log("n5",c,msg);
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
        n1.should.have.a.property('outputs', 4);
        n1.should.have.a.property('forceClone', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1, "all_topics" );
        c.should.match(4);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
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
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:4, interval:100, intervalUnit:"msecs", clone:true, contextStore:"memoryOnly", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n5 = helper.getNode("n5");
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log("n2",c,msg);
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
      n3.on("input", function (msg) {
        console.log("n3",c,msg);
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
      n4.on("input", function (msg) {
        console.log("n4",c,msg);
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
      n5.on("input", function (msg) {
        console.log("n5",c,msg);
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
        n1.should.have.a.property('outputs', 4);
        n1.should.have.a.property('forceClone', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1, "all_topics" );
        c.should.match(4);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
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
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:4, interval:100, intervalUnit:"msecs", contextStore:"memoryOnly", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n5 = helper.getNode("n5");
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var c4 = 0;
      n2.on("input", function (msg) {
        console.log("n2",c1,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c1++;
      });
      n3.on("input", function (msg) {
        console.log("n3",c2,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c2++;
      });
      n4.on("input", function (msg) {
        console.log("n4",c3,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c3++;
      });
      n5.on("input", function (msg) {
        console.log("n5",c4,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c4++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('outputs', 4);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c1.should.match(0);
        c2.should.match(0);
        c3.should.match(0);
        c4.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c1.should.match(1);
        c2.should.match(0);
        c3.should.match(0);
        c4.should.match(0);
        await delay(200);
        c1.should.match(1);
        c2.should.match(1);
        c3.should.match(1);
        c4.should.match(0);
        n1.receive({ topic: "t", reset: true });
        await delay(500);
        checkDataWithoutCounter( n1, "all_topics" );
        c1.should.match(1);
        c2.should.match(1);
        c3.should.match(1);
        c4.should.match(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
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
    var flow = [{ id: "n1", type: "msg-sequence", name: "test", outputs:4, interval:100, intervalUnit:"msecs", contextStore:"memoryOnly", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n5 = helper.getNode("n5");
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var c4 = 0;
      n2.on("input", function (msg) {
        console.log("n2",c1,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c1++;
      });
      n3.on("input", function (msg) {
        console.log("n3",c2,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c2++;
      });
      n4.on("input", function (msg) {
        console.log("n4",c3,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c3++;
      });
      n5.on("input", function (msg) {
        console.log("n5",c4,msg);
        try {
          msg.should.have.a.property('topic','t');
          msg.should.have.a.property('payload',1);
          msg.should.not.have.a.property('counter');
          msg.should.not.have.a.property('max');
        }
        catch(err) {
          done(err);
        }
        c4++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('outputs', 4);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        c1.should.match(0);
        c2.should.match(0);
        c3.should.match(0);
        c4.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c1.should.match(1);
        c2.should.match(0);
        c3.should.match(0);
        c4.should.match(0);
        await delay(200);
        c1.should.match(1);
        c2.should.match(1);
        c3.should.match(1);
        c4.should.match(0);
        n1.receive({ reset: true });
        await delay(500);
        checkDataWithoutCounter( n1, "all_topics" );
        c1.should.match(1);
        c2.should.match(1);
        c3.should.match(1);
        c4.should.match(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });
/*
  it('should resend messages after redeploy', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:50, addCounters:true, intervalUnit:"msecs", maximum:12, contextStore:"memoryOnly", wires: [["n2"]] },
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
          msg.should.have.a.property('counter',c+1);
          msg.should.have.a.property('max',12);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('addCounters', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(250);
        c.should.match(6);
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          //console.log(msg);
          try {
            msg.should.have.a.property('topic','t');
            msg.should.have.a.property('payload',1);
            msg.should.have.a.property('counter',c+1);
            msg.should.have.a.property('max',12);
          }
          catch(err) {
            done(err);
          }
          c++;
        });
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('addCounters', true);
        await delay(75);
        c.should.match(6);
        await delay(500);
        checkData( n1.context().get("data"), "all_topics" );
        c.should.match(12);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should resend messages after redeploy, no store', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", interval:50, addCounters:true, intervalUnit:"msecs", maximum:12, contextStore:"none", wires: [["n2"]] },
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
          msg.should.have.a.property('counter',c+1);
          msg.should.have.a.property('max',12);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('addCounters', true);
        await delay(500);
        should.not.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(25);
        c.should.match(1);
        await delay(250);
        c.should.match(6);
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          //console.log(msg);
          try {
            msg.should.have.a.property('topic','t');
            msg.should.have.a.property('payload',1);
            msg.should.have.a.property('counter',c+1);
            msg.should.have.a.property('max',12);
          }
          catch(err) {
            done(err);
          }
          c++;
        });
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('addCounters', true);
        await delay(75);
        c.should.match(6);
        await delay(500);
        should.not.exist( n1.context().get("data") );
        c.should.match(6);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });
*/
});
