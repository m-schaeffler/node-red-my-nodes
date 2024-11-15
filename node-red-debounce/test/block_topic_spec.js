var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../debounce.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
require("./block_spec.js");
require("./debounce_topic_spec.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'block Node, byTopic', function () {
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

  function checkData(n1,topic) {
      const data = n1.context().get("data");
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.have.a.property('timer',null);
      data[topic].should.have.a.property('message',null);
      return data[topic];
  }

  it('should forward valid values', function (done) {
    const numbers = [-1,0,0,0,0,0,0,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null,NaN,"FooBar"];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.a.property('payload',numbers[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: topics[i%3], payload: numbers[i] });
          await delay(50);
        }
        await delay(100);
        c.should.match(numbers.length);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid values', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, time:20, timeUnit:"msecs", wires: [["n2"]] },
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
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t" });
        await delay(50);
        n1.receive({ topic:"u", payload: undefined });
        await delay(50);
        n1.receive({ topic:"i", invalid: true, payload: 255 });
        await delay(150);
        c.should.match(0);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "i" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward filtered values', function (done) {
    const numbersIn  = [-1,0,0,0,0,0,0,0,1,1,2,3,3,3];
    const numbersOut = [-1,0,            1,  2,3,   3,3];
    const topicsOut  = ["t","u","v","t","v","t","u", "v","t","u", "t"];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, filter: true, time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.a.property('payload',numbersOut[Math.floor(c/3)]+(c%3));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', true);
        n1.should.have.a.property('filter', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbersIn )
        {
          n1.receive({ topic: "t", payload: numbersIn[i] });
          n1.receive({ topic: "u", payload: numbersIn[i]+1 });
          n1.receive({ topic: "v", payload: numbersIn[i]+2 });
          await delay(50);
        }
        await delay(100);
        c.should.match(3*(numbersOut.length-2));
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic: "t", payload: numbersIn[numbersIn.length-1] });
        n1.receive({ topic: "u", payload: numbersIn[numbersIn.length-1]+1 });
        n1.receive({ topic: "v", payload: numbersIn[numbersIn.length-1]+2 });
        await delay(100);
        c.should.match(3*(numbersOut.length-2));
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ reset: true });
        n1.receive({ topic: "t", payload: numbersIn[numbersIn.length-1] });
        n1.receive({ topic: "u", payload: numbersIn[numbersIn.length-1]+1 });
        n1.receive({ topic: "v", payload: numbersIn[numbersIn.length-1]+2 });
        await delay(100);
        c.should.match(3*(numbersOut.length-1));
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic:"t", reset: true });
        n1.receive({ topic: "t", payload: numbersIn[numbersIn.length-1] });
        n1.receive({ topic: "u", payload: numbersIn[numbersIn.length-1]+1 });
        n1.receive({ topic: "v", payload: numbersIn[numbersIn.length-1]+2 });
        await delay(100);
        c.should.match(3*numbersOut.length-2);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    const numbers = [-1,0,255,65535];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, property:"payload.value", time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',"Object");
          msg.should.have.a.property('payload',numbers[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', true);
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
        checkData( n1, "Object" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    const numbers = [-1,0,255,65535];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, property:"payload+5", propertyType:"jsonata", time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',"JSONata");
          msg.should.have.a.property('payload',numbers[c]+5);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', true);
        n1.should.have.a.property('property', "payload+5");
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
        checkData( n1, "JSONata" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should debounce values, no restart', function (done) {
    const numbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, bytopic:true, time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          const help = Math.min( Math.floor(c/3)*4, numbers.length-1 );
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.a.property('payload',numbers[help]*(c%3+1));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: "t", payload: numbers[i] });
          n1.receive({ topic: "u", payload: numbers[i]*2 });
          n1.receive({ topic: "v", payload: numbers[i]*3 });
          await delay(25);
        }
        await delay(150);
        c.should.match(3*Math.ceil(numbers.length/4));
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        n1.receive({ reset: true });
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        await delay(150);
        c.should.match(3*Math.ceil(numbers.length/4+2));
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        n1.receive({ topic: "t", reset: true });
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        await delay(150);
        c.should.match(3*Math.ceil(numbers.length/4+3)+1);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should debounce values, active', function (done) {
    const numbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
    var flow = [{ id: "n1", type: "debounce", name: "test", block: true, restart:true, bytopic:true, time:100, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          const help = c<3 ? 0 : numbers.length-1;
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.a.property('payload',numbers[help]*(c%3+1));
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('block', true);
        n1.should.have.a.property('time', 100);
        n1.should.have.a.property('restart', true);
        n1.should.have.a.property('byTopic', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: "t", payload: numbers[i] });
          n1.receive({ topic: "u", payload: numbers[i]*2 });
          n1.receive({ topic: "v", payload: numbers[i]*3 });
          await delay(25);
        }
        await delay(150);
        c.should.match(3);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        n1.receive({ reset: true });
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        await delay(150);
        c.should.match(3+6);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        n1.receive({ topic: "t", reset: true });
        n1.receive({ topic: "t", payload: 21 });
        n1.receive({ topic: "u", payload: 21*2 });
        n1.receive({ topic: "v", payload: 21*3 });
        await delay(150);
        c.should.match(3+6+4);
        checkData( n1, "t" );
        checkData( n1, "u" );
        checkData( n1, "v" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
