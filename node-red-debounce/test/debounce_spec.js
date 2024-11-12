var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../debounce.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'debounce Node', function () {
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

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('time', 1000);
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('restart', false);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        should.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward valid values', function (done) {
    const numbers = [-1,0,0,0,0,0,0,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null,NaN,"FooBar"];
    var flow = [{ id: "n1", type: "debounce", name: "test", time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.property('payload',numbers[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', 20);
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
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid values', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", time:20, timeUnit:"msecs", wires: [["n2"]] },
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
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t" });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ invalid: true, payload: 255 });
        await delay(150);
        c.should.match(0);
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward filtered values', function (done) {
    const numbersIn  = [-1,0,0,0,0,0,0,0,1,1,1,1];
    const numbersOut = [-1,0,1,1];
    const topicsOut  = ["t","u","v","reset"];
    var flow = [{ id: "n1", type: "debounce", name: "test", filter: true, time:20, timeUnit:"msecs", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.a.property('topic',topicsOut[c]);
          msg.should.have.property('payload',numbersOut[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('filter', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbersIn )
        {
          n1.receive({ topic: topics[i%3], payload: numbersIn[i] });
          await delay(50);
        }
        await delay(100);
        c.should.match(numbersOut.length-1);
        checkData( n1, "all_topics" );
        n1.receive({ topic: "z", payload: numbersIn[numbersIn.length-1] });
        await delay(100);
        c.should.match(numbersOut.length-1);
        checkData( n1, "all_topics" );
        n1.receive({ reset: true });
        n1.receive({ topic: "reset", payload: numbersIn[numbersIn.length-1] });
        await delay(100);
        c.should.match(numbersOut.length);
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    const numbers = [-1,0,255,65535];
    var flow = [{ id: "n1", type: "debounce", name: "test", property:"payload.value", time:20, timeUnit:"msecs", wires: [["n2"]] },
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
        n1.should.have.a.property('time', 20);
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
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    const numbers = [-1,0,255,65535];
    var flow = [{ id: "n1", type: "debounce", name: "test", property:"payload+5", propertyType:"jsonata", time:20, timeUnit:"msecs", wires: [["n2"]] },
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
        n1.should.have.a.property('time', 20);
        n1.should.have.a.property('byTopic', false);
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
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

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
          msg.should.have.property('payload',numbers[help]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
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
        checkData( n1, "all_topics" );
        n1.receive({ topic: "reset", payload: 40 });
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(Math.ceil(numbers.length/4));
        checkData( n1, "all_topics" );
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
          msg.should.have.property('payload',numbers[help]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
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
        checkData( n1, "all_topics" );
        n1.receive({ topic: "reset", payload: 40 });
        n1.receive({ reset: true });
        await delay(150);
        c.should.match(1);
        checkData( n1, "all_topics" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
