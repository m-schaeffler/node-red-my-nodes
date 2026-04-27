var should = require("should");
var assertions = require('./asserts.js');
var helper = require("node-red-node-test-helper");
var node   = require("../debounceBool.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'debounceBool Node', function () {
  "use strict";

  const topics = ['t','u','v'];

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

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "debounceBool", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('time', {true:1000,false:1000});
        n1.should.have.a.property('restart', false);
        n1.should.have.a.property('byTopic', false);
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

  it('should forward valid values', function (done) {
    const numbers = [true,false,-1,0,1,2,"","Test",null,NaN];
    var flow = [{ id: "n1", type: "debounceBool", name: "test", timeTrue:20, timeTrueUnit:"msecs", timeFalse:25, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg)
        try {
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.a.property('payload',Boolean(numbers[c]));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:20,false:25});
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: topics[i%3], payload: numbers[i] });
          await delay(50);
        }
        await delay(100);
        c.should.match(numbers.length);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid values', function (done) {
    var flow = [{ id: "n1", type: "debounceBool", name: "test", timeTrue:20, timeTrueUnit:"msecs", timeFalse:20, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        done("no output expected");
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:20,false:20});
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t" });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ invalid: true, payload: true });
        await delay(150);
        c.should.match(0);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    const numbers = [true,false,255,0];
    var flow = [{ id: "n1", type: "debounceBool", name: "test", property:"payload.value", timeTrue:20, timeTrueUnit:"msecs", timeFalse:20, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',"Object");
          msg.should.have.a.property('payload',Boolean(numbers[c]));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:20,false:20});
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: "Object", payload: {a:1,value:numbers[i],b:88} });
          await delay(50);
        }
        await delay(100);
        c.should.match(numbers.length);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    const numbers = [true,false,255,0];
    var flow = [{ id: "n1", type: "debounceBool", name: "test", property:"$not(payload)", propertyType:"jsonata", timeTrue:20, timeTrueUnit:"msecs", timeFalse:20, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',"JSONata");
          msg.should.have.a.property('payload',!numbers[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:20,false:20});
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('property', "$not(payload)");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: "JSONata", payload: numbers[i] });
          await delay(50);
        }
        await delay(100);
        c.should.match(numbers.length);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
/*
  it('should debounce values, no restart', function (done) {
    const numbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    var flow = [{ id: "n1", type: "debounce", name: "test", time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          const help = Math.min( (c+1)*4-1, numbers.length-1 );
          msg.should.have.a.property('topic',help.toString());
          msg.should.have.a.property('payload',numbers[help]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: i, payload: numbers[i] });
          await delay(25);
        }
        await delay(150);
        c.should.match(Math.ceil(numbers.length/4));
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "reset", payload: 40 });
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(Math.ceil(numbers.length/4));
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should debounce values, restart active', function (done) {
    const numbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    var flow = [{ id: "n1", type: "debounce", name: "test", restart:true, time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          const help = numbers.length-1;
          msg.should.have.a.property('topic',help.toString());
          msg.should.have.a.property('payload',numbers[help]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('restart', true);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: i, payload: numbers[i] });
          await delay(25);
        }
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "reset", payload: 40 });
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should debounce filtered input values', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", filter:true, time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',"t");
          msg.should.have.a.property('payload',1);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('filterIn', true);
        n1.should.have.a.property('filterOut', false);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "o", payload: 1 });
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "o", payload: 0 });
        await delay(25);
        n1.receive({ topic: "t", payload: 1 });
        await delay(150);
        c.should.match(2);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should debounce values with filtered output', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", filterOut:true, time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',"t");
          msg.should.have.a.property('payload',1-c);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('filterIn', false);
        n1.should.have.a.property('filterOut', true);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t", payload: 1 });
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "o", payload: 1 });
        await delay(150);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: "o", payload: -1 });
        await delay(25);
        n1.receive({ topic: "o", payload: 1 });
        await delay(150);
        c.should.match(1);
        n1.receive({ topic: "t", payload: 0 });
        await delay(155);
        c.should.match(2);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should use debounceMs override', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", time:200, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var timestamps = [];
      n2.on("input", function (msg) {
        //console.log(msg);
        timestamps.push( Date.now() );
        try {
          msg.should.have.a.property('topic',"t");
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 200);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        // Send with debounceMs override of 50ms
        var start1 = Date.now();
        n1.receive({ topic: "t", payload: 1, debounceMs: 50 });
        await delay(100);
        c.should.match(1);
        // Should have fired after ~50ms, not 200ms
        (timestamps[0] - start1).should.be.within(40, 80);
        // Send without debounceMs, should use configured 200ms
        var start2 = Date.now();
        n1.receive({ topic: "t", payload: 2 });
        await delay(100);
        c.should.match(1); // Should not have fired yet
        await delay(150);
        c.should.match(2); // Should have fired now after ~200ms
        (timestamps[1] - start2).should.be.within(180, 280);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should use debounceMs override with restart', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", restart:true, time:200, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var startTime;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          var elapsed = Date.now() - startTime;
          msg.should.have.a.property('topic',"t");
          msg.should.have.a.property('payload',2);
          // First message at 100ms, second at 25ms with debounceMs:50
          // Timer should restart with 50ms, so total ~75ms from start
          elapsed.should.be.within(60, 100);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', false);
        n1.should.have.a.property('time', 200);
        n1.should.have.a.property('restart', true);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        // Send first message with debounceMs:100
        startTime = Date.now();
        n1.receive({ topic: "t", payload: 1, debounceMs: 100 });
        await delay(25);
        // Send second message with debounceMs:50, should restart timer with new duration
        n1.receive({ topic: "t", payload: 2, debounceMs: 50 });
        await delay(100);
        c.should.match(1);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
*/
});
