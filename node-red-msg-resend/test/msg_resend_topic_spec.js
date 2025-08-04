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

  const topics1 = ['t','u','v','v'];
  const topics2 = ['t','u','v'];

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
          msg.should.have.a.property('topic',topics1[c%4]);
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
        for(const i in topics1)
        {
          n1.receive({ topic: topics1[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics1.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(topics1.length);
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
        for(const i in topics1)
        {
          n1.receive({ topic: topics1[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics1.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(expTopics.length);
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
          msg.should.have.a.property('topic',topics2[c%3]);
          msg.should.have.a.property('payload',c%3+1);
          msg.should.have.a.property('counter',Math.trunc(c/3)+1);
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
        for(const i in topics2)
        {
          n1.receive({ topic: topics2[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics2.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(topics2.length*3);
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
          msg.should.have.a.property('topic',topics2[c]);
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
        for(const i in topics2)
        {
          n1.receive({ topic: topics2[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(0);
        await delay(475);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(topics2.length);
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
    const expTopics = ['t','u','v','v','u','t'];
    const expPayloads = [1,2,3,3,2,1];
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:1, intervalUnit:"hours", maximum:2, wires: [["n2"]] },
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
          msg.should.not.have.a.property('resend_interval');
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
        for(const i in topics2)
        {
          n1.receive({ topic: topics2[i], payload: Number(i)+1, resend_interval: 100-5*Number(i) });
        }
        await delay(25);
        c.should.match(topics2.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" ).should.have.a.property('interval', 100);
        checkData( n1.context().get("data"), "u" ).should.have.a.property('interval', 95);
        checkData( n1.context().get("data"), "v" ).should.have.a.property('interval', 90);
        c.should.match(expTopics.length);
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

  it('should change count', function (done) {
    const expTopics = ['t','u','v','t','u','v','u','v','v'];
    const expPayloads = [1,2,3,1,2,3,2,3,3];
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
          msg.should.have.a.property('topic',expTopics[c]);
          msg.should.have.a.property('payload',expPayloads[c]);
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
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        for(const i in topics2)
        {
          n1.receive({ topic: topics2[i], payload: Number(i)+1, resend_max_count: Number(i)+2 });
        }
        await delay(25);
        c.should.match(topics2.length);
        await delay(475);
        checkData( n1.context().get("data"), "t" ).should.have.a.property('maxCount', 2);
        checkData( n1.context().get("data"), "u" ).should.have.a.property('maxCount', 3);
        checkData( n1.context().get("data"), "v" ).should.have.a.property('maxCount', 4);
        c.should.match(expTopics.length);
        n1.should.have.a.property('maxCount', 1);
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
        checkData( n1.context().get("data"), "t" );
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
        checkData( n1.context().get("data"), "t" );
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

 it('should resend messages forever', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:50, intervalUnit:"msecs", maximum:0, wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', true);
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
        checkData( n1.context().get("data"), "t" );
        c.should.match(23);
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

  it('should be stopped by msg.reset', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:50, intervalUnit:"msecs", maximum:0, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var phase = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          switch( phase )
          {
            case 0:
              msg.should.have.a.property('topic',topics2[c%3]);
              msg.should.have.a.property('payload',c%3+1);
              break;
            case 1:
              msg.should.have.a.property('topic',topics2[c%2]);
              msg.should.have.a.property('payload',c%2+1);
              break;
            case 2:
              done("no messages in 3rd phase");
              break;
            default:
              done("wrong phase");
          }
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
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        for(const i in topics2)
        {
          n1.receive({ topic: topics2[i], payload: Number(i)+1 });
        }
        await delay(25);
        c.should.match(topics2.length);
        await delay(500);
        c.should.match(11*topics2.length);
        n1.receive({ topic: "v", reset: true });
        phase++;
        c=0;
        await delay(500);
        checkDataWithoutCounter( n1.context().get("data"), "v" );
        c.should.match(20);
        n1.receive({ reset: true });
        phase++;
        c=0;
        await delay(500);
        checkDataWithoutCounter( n1.context().get("data"), "t" );
        checkDataWithoutCounter( n1.context().get("data"), "u" );
        checkDataWithoutCounter( n1.context().get("data"), "v" );
        c.should.match(0);
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

  it('should resend messages after redeploy', function (done) {
    this.timeout( 5000 );
    const maxes=[12,6,9]
    var flow = [{ id: "n1", type: "msg-resend2", name: "test", bytopic:true, interval:50, addCounters:true, intervalUnit:"msecs", maximum:12, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',topics1[c%3]);
          msg.should.have.a.property('payload',(c%3)+1);
          msg.should.have.a.property('counter',Math.floor(c/3)+1);
          msg.should.have.a.property('max',maxes[c%3]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', true);
        n1.should.have.a.property('addCounters', true);
        await delay(500);
        should.exist( n1.context().get("data") );
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        n1.receive({ topic: "u", payload: 2, resend_max_count: 6 });
        n1.receive({ topic: "v", payload: 3, resend_max_count: 9 });
        await delay(25);
        c.should.match(3);
        await delay(250);
        c.should.match(6*3);
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        c = 0;
        n2.on("input", function (msg) {
          //console.log(c,msg);
          try {
            const h = c < 6 ? c % 2 : 0;
            msg.should.have.a.property('topic',h?'v':'t');
            msg.should.have.a.property('payload',h?3:1);
            msg.should.have.a.property('counter',c<6?Math.floor(c/2)+7:c+4);
            msg.should.have.a.property('max',h?9:12);
          }
          catch(err) {
            done(err);
          }
          c++;
        });
        n1.should.have.a.property('interval', 50);
        n1.should.have.a.property('maxCount', 12);
        n1.should.have.a.property('byTopic', true);
        n1.should.have.a.property('addCounters', true);
        await delay(75);
        c.should.match(0);
        await delay(500);
        checkData( n1.context().get("data"), "t" );
        checkData( n1.context().get("data"), "u" );
        checkData( n1.context().get("data"), "v" );
        c.should.match(9);
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

});
