var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../debounce.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'msg-resend Node', function () {
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

  function checkData(data,topic) {
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.have.a.property('counter',data[topic].maxCount);
      data[topic].should.have.a.property('timer',null);
      return data[topic];
  }

  function checkDataWithoutCounter(data,topic) {
      data.should.have.a.property(topic).which.is.a.Object();
      data[topic].should.not.have.a.property('counter');
      data[topic].should.have.a.property('timer',null);
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
        n1.should.have.a.property('time', 0);
        n1.should.have.a.property('filter', false);
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
    var flow = [{ id: "n1", type: "debounce", name: "test", wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        for( const i in numbers )
        {
          n1.receive({ topic: topics[i%3], payload: numbers[i] });
        }
        await delay(500);
        c.should.match(numbers.length);
        should.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid values', function (done) {
    var flow = [{ id: "n1", type: "debounce", name: "test", wires: [["n2"]] },
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
        n1.should.have.a.property('byTopic', false);
        await delay(500);
        c.should.match(0);
        n1.receive({ topic: "t" });
        n1.receive({ payload: undefined });
        n1.receive({ invalid: true, payload: 255 });
        await delay(500);
        c.should.match(0);
        should.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward filter values', function (done) {
    const numbersIn  = [-1,0,0,0,0,0,0,0,1];
    const numbersOut = [-1,0,1];
    var flow = [{ id: "n1", type: "debounce", name: "test", filter: true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',topics[c%3]);
          msg.should.have.property('payload',numbersOut[c]);
        }
        catch(err) {
          done(err);
        }
        c++;
      });
      try {
        n1.should.have.a.property('byTopic', false);
        n1.should.have.a.property('filter', true);
        await delay(500);
        c.should.match(0);
        for( const i in numbersIn )
        {
          n1.receive({ topic: topics[i%3], payload: numbersIn[i] });
        }
        await delay(500);
        c.should.match(numbersOut.length);
        should.exist( n1.context().get("data") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
