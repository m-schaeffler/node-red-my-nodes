var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../msg_resend.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
require("./msg_resend_spec.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'msg-resend Node, byTopic', function () {
  "use strict";

  const topics=['t','u','v','v'];

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
      return data[topic];
  }

  it('should forward messages', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',topics[c%4]);
          msg.should.have.a.property('payload',(c%4)+1);
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
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        for(const i in topics)
        {
          n1.receive({ topic: topics[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(topics.length);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should resend messages', function (done) {
    const expTopics = ['t','u','v','v','t','u','v','t','u','v'];
    const expPayloads = [1,2,3,4,1,2,4,1,2,4];
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", maximum:3, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',expTopics[c]);
          msg.should.have.a.property('payload',expPayloads[c]);
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
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        for(const i in topics)
        {
          n1.receive({ topic: topics[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(10);
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

/*
  it('should resend messages with counters', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", maximum:3, addCounters:true, wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', true);
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
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", maximum:1, firstDelayed:true, wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', true);
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
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:1, intervalUnit:"hours", wires: [["n2"]] },
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
        n1.should.have.a.property('interval', 3600*1000);
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1, resend_interval: 100 });
        await delay(25);
        c.should.match(1);
        await delay(475);
        checkData( n1.context().get("data"), "all_topics" ).should.have.a.property('interval', 100);
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

  it('should change count', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", wires: [["n2"]] },
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
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 100);
        n1.should.have.a.property('maxCount', 1);
        n1.should.have.a.property('byTopic', true);
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
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", maximum:4, wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', true);
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
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:100, intervalUnit:"msecs", maximum:4, clone:true, wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', true);
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
*/

});
