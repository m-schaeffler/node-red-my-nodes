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

  it('should debounce values, no restart', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "debounceBool", name: "test", timeTrue:100, timeTrueUnit:"msecs", timeFalse:500, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c+1);
          msg.should.have.a.property('payload',c<4 ? Boolean(c&0x01) : !(c&0x01));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:100,false:500});
        n1.should.have.a.property('restart', false);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: 1, payload: false });
        await delay(25);
        c.should.match(1);
        n1.receive({ topic: "2a", payload: true });
        await delay(75);
        c.should.match(1);
        n1.receive({ topic: 2, payload: true });
        await delay(50);
        c.should.match(2);
        n1.receive({ topic: "3a", payload: false });
        await delay(475);
        c.should.match(2);
        n1.receive({ topic: 3, payload: false });
        await delay(50);
        c.should.match(3);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(3);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: 4, payload: true });
        await delay(25);
        c.should.match(4);
        n1.receive({ topic: 5, payload: true });
        await delay(25);
        c.should.match(5);
        n1.receive({ topic: "6a", payload: false });
        await delay(450);
        c.should.match(5);
        n1.receive({ topic: 6, payload: false });
        await delay(50);
        c.should.match(6);
        n1.receive({ topic: "7a", payload: true });
        await delay(75);
        c.should.match(6);
        n1.receive({ topic: 7, payload: true });
        await delay(50);
        c.should.match(7);
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
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "debounceBool", name: "test", restart:true, timeTrue:100, timeTrueUnit:"msecs", timeFalse:500, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',c+1);
          msg.should.have.a.property('payload',c<4 ? Boolean(c&0x01) : !(c&0x01));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:100,false:500});
        n1.should.have.a.property('restart', true);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: 1, payload: false });
        await delay(25);
        c.should.match(1);
        n1.receive({ topic: "2a", payload: true });
        await delay(75);
        c.should.match(1);
        n1.receive({ topic: 2, payload: true });
        await delay(75);
        c.should.match(1);
        await delay(50);
        c.should.match(2);
        n1.receive({ topic: "3a", payload: false });
        await delay(475);
        c.should.match(2);
        n1.receive({ topic: 3, payload: false });
        await delay(475);
        c.should.match(2);
        await delay(50);
        c.should.match(3);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(3);
        n1.context().get("data").should.have.ValidData("all_topics");
        n1.receive({ topic: 4, payload: true });
        await delay(25);
        c.should.match(4);
        n1.receive({ topic: 5, payload: true });
        await delay(25);
        c.should.match(5);
        n1.receive({ topic: "6a", payload: false });
        await delay(450);
        c.should.match(5);
        n1.receive({ topic: 6, payload: false });
        await delay(475);
        c.should.match(5);
        await delay(50);
        c.should.match(6);
        n1.receive({ topic: "7a", payload: true });
        await delay(75);
        c.should.match(6);
        n1.receive({ topic: 7, payload: true });
        await delay(75);
        c.should.match(6);
        await delay(50);
        c.should.match(7);
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
    var flow = [{ id: "n1", type: "debounceBool", name: "test", timeTrue:200, timeTrueUnit:"msecs", timeFalse:200, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var timestamp,start;
      n2.on("input", function (msg) {
        //console.log(msg);
        timestamp = Date.now();
        try {
          msg.should.have.a.property('topic',"t");
          msg.should.have.a.property('payload',Boolean(c&0x01));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:200,false:200});
        n1.should.have.a.property('restart', false);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        // Send first message immediately
        start = Date.now();
        n1.receive({ topic: "t", payload: false, debounceMs: 10000 });
        await delay(25);
        c.should.match(1);
        (timestamp-start).should.be.within(0,5);
        // Send with debounceMs
        start = Date.now();
        n1.receive({ topic: "t", payload: true, debounceMs: 50 });
        await delay(25);
        c.should.match(1);
        await delay(50);
        c.should.match(2);
        (timestamp-start).should.be.within(45,55);
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
    var flow = [{ id: "n1", type: "debounceBool", name: "test", restart:true, timeTrue:200, timeTrueUnit:"msecs", timeFalse:200, timeFalseUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var timestamp,start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          timestamp = Date.now();
          msg.should.have.a.property('topic',"t");
          msg.should.have.a.property('payload',Boolean(c&0x01));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', {true:200,false:200});
        n1.should.have.a.property('restart', true);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        // Send first message immediately
        start = Date.now();
        n1.receive({ topic: "t", payload: false, debounceMs: 10000 });
        await delay(25);
        c.should.match(1);
        (timestamp-start).should.be.within(0,5);
        // Send first message with debounceMs
        //start = Date.now();
        n1.receive({ topic: "u", payload: true, debounceMs: 5000 });
        await delay(25);
        c.should.match(1);
        // Send second message with debounceMs:
        start = Date.now();
        n1.receive({ topic: "t", payload: true, debounceMs: 50 });
        await delay(25);
        c.should.match(1);
        await delay(50);
        c.should.match(2);
        (timestamp-start).should.be.within(45,55);
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

});
