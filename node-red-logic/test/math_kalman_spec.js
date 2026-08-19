var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_kalman.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_kalman Node', function () {
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

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "kalman", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should caclulate kalman values', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.3333333333333335,1.5,0.5714285714285714,0.2181818181818182,0.08333333333333334,0.6498673740053051,1.4842958459979736,2.4210526315789473];
    var flow = [{ id: "n1", type: "kalman", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should caclulate kalman values with control input', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.3666666666666667,1.55,0.6285714285714286,0.2781818181818182,0.14444444444444443,0.7114058355437666,1.5459979736575482,2.4828173374613005];
    var flow = [{ id: "n1", type: "kalman", control: "control", controlType:"msg",  controlVector:"0.1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 'control');
        n1.should.have.a.property('controlType', 'msg');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0.1);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i, control: 1 });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have zeroIsZero', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.3333333333333335,1.5,0,0,0,0.6190476190476191,1.4727272727272727,2.4166666666666665];
    var flow = [{ id: "n1", type: "kalman", zeroIsZero:true, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', true);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should caclulate kalman values, with reduced decimals', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.33,1.5,0.57,0.22,0.08,0.65,1.48,2.42];
    var flow = [{ id: "n1", type: "kalman", decimals:"2", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', 100 );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in time domain', function (done) {
    var flow = [{ id: "n1", type: "kalman", filter: "1000", filterUnit:"msec", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(10);
              msg.should.have.a.property('payload',3);
              break;
            case 2:
              delta.should.be.approximately(1100,25);
              msg.should.have.a.property('payload',1.5);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 1000);
        n1.should.have.a.property('filterLongTime', 10000);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 3 });
        await delay(900);
        n1.receive({ payload: 2 });
        await delay(200);
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in value domain', function (done) {
    var flow = [{ id: "n1", type: "kalman", filterVal: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',3);
              break;
            case 2:
              msg.should.have.a.property('payload',1.5);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterValue', 1);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 3 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in both domains 1', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "kalman", filter: "250", filterUnit:"msec", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(2900,50);
              msg.should.have.a.property('payload',1025.3454545454545);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 2500);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(200);
        n1.receive({ payload: 1002 });
        await delay(100);
        n1.receive({ payload: 1004 });
        await delay(2000);
        n1.receive({ payload: 1006 });
        await delay(600);
        n1.receive({ payload: 1038 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in both domains 2', function (done) {
    var flow = [{ id: "n1", type: "kalman", filter: "0.25", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(300,25);
              msg.should.have.a.property('payload',1666.6666666666665);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 2500);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(300);
        n1.receive({ payload: 2000 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in both domains 3', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "kalman", filter: "0.25", filterMul: "0", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(3500,50);
              msg.should.have.a.property('payload',1627.736111111111);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(200);
        n1.receive({ payload: 1002 });
        await delay(100);
        n1.receive({ payload: 1004 });
        await delay(2000);
        n1.receive({ payload: 1006 });
        await delay(600);
        n1.receive({ payload: 1038 });
        await delay(600);
        n1.receive({ payload: 2000 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "kalman", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: NaN });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: 5000 });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(2);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not use invalid control input', function (done) {
    var flow = [{ id: "n1", type: "kalman", control: "control", controlType:"msg",  controlVector:"0.1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 'control');
        n1.should.have.a.property('controlType', 'msg');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0.1);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('adaptionCount', 0);
        n1.should.have.a.property('contextStore', "");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1, control: undefined });
        await delay(50);
        n1.receive({ payload: 1, control: "FooBar" });
        await delay(50);
        n1.receive({ payload: 1, control: NaN });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: 5000, control: 1 });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(3);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "kalman", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',0);
              break;
            case 2:
              msg.should.have.a.property('payload',1000);
              break;
            case 3:
              msg.should.have.a.property('payload',5000);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ payload: 1000 });
        await delay(50);
        n1.receive({ topic: "init" });
        await delay(50);
        n1.receive({ payload: 5000 });
        await delay(50);
        c.should.match( 3 );
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
    var flow = [{ id: "n1", type: "kalman", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
        await delay(50);
        n1.receive({ payload: {a:1,value:98,b:88} });
        await delay(50);
        c.should.match( 1 );
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
    var flow = [{ id: "n1", type: "kalman", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98+5);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload+5");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: 98 });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should store the internal state', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.3333333333333335,1.5,0.5714285714285714,0.2181818181818182,0.08333333333333334,0.6498673740053051,1.4842958459979736,2.4210526315789473];
    var flow = [{ id: "n1", type: "kalman", contextStore:"memoryOnly", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('control', 0);
        n1.should.have.a.property('controlType', 'num');
        n1.should.have.a.property('processNoise', 1);
        n1.should.have.a.property('measurementNoise', 1);
        n1.should.have.a.property('stateVector', 1);
        n1.should.have.a.property('controlVector', 0);
        n1.should.have.a.property('measurementVector', 1);
        n1.should.have.a.property('contextStore', "memoryOnly");
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( let i = 0; i < 3; i++ )
        {
          n1.receive({ topic:1, payload: numbers[i] });
          await delay(50);
        }
        n1.context().get("data").should.be.an.Object();
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.should.have.property('topic',1);
            msg.should.have.property('payload',results[c]);
            c++;
          }
          catch(err) {
            done(err);
          }
        });
        await delay(50);
        n1.context().get("data").should.be.an.Object();
        for( let i = 3; i < numbers.length; i++ )
        {
          n1.receive({ topic:1, payload: numbers[i] });
          await delay(50);
        }
        c.should.match( numbers.length );
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

