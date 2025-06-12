var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_statistics.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_statistics Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "statistics", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('deltaTime', 60000);
        n1.should.have.a.property('minData', 1);
        n1.should.have.a.property('showState', false);
        await delay(50);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should calculate statistical values', function (done) {
    const numbers = [1000,10,99.9,100,100.1,2000,0];
    var flow = [{ id: "n1", type: "statistics", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      var min = 10000;
      var max = -1000;
      n2.on("input", function (msg) {
        try {
          s += numbers[c];
          min = Math.min( min, numbers[c] );
          max = Math.max( max, numbers[c] );
          const avg = s/(c+1);
          let varianz = 0;
          for( let i=0; i<=c; i++) {
            varianz += ( numbers[i] - avg ) ** 2;
          }
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',numbers[c]);
          msg.should.have.property('stat').which.is.Object();
          msg.stat.should.have.property('last',numbers[c++]);
          msg.stat.should.have.property('first',numbers[0]);
          msg.stat.should.have.property('count',c);
          msg.stat.should.have.property('min',min);
          msg.stat.should.have.property('max',max);
          msg.stat.should.have.property('average',avg);
          const deviation = Math.sqrt( varianz / c );
          msg.stat.should.have.property('deviation').which.is.approximately(deviation,0.00001);
          msg.stat.should.have.property('variation').which.is.approximately(deviation/avg,0.00001);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should calculate mean values, minData=3', function (done) {
    const numbers = [1000,10,99.9,100,100.1,1000,0];
    var flow = [{ id: "n1", type: "statistics", minData:"3", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 17+34;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('topic',2);
          msg.should.have.property('payload',numbers[c-1]);
          msg.stat.should.have.property('count',c+2);
          msg.stat.should.have.property('average',s/(c+2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 3);
        await delay(50);
        n1.receive({ topic:2, payload: 17 });
        await delay(50);
        n1.receive({ topic:2, payload: 34 });
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:2, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should mean data only for deltaTime window', function (done) {
    var flow = [{ id: "n1", type: "statistics", deltaTime: "0.1", name: "test", wires: [["n2"]] },
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
          delta.should.be.approximately((c-1)*200,25);
          msg.should.have.a.property('payload',c*1000);
          msg.stat.should.have.a.property('count',1);
          msg.stat.should.have.property('average',c*1000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('deltaTime', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(200);
        n1.receive({ payload: 2000 });
        await delay(200);
        n1.receive({ payload: 3000 });
        await delay(50);
        c.should.match( 3 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "statistics", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
          msg.stat.should.have.a.property('count',1);
          msg.stat.should.have.property('average',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "statistics", name: "test", wires: [["n2"]] },
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
              msg.stat.should.have.a.property('count',1);
              msg.stat.should.have.property('average',0);
              break;
            case 2:
              msg.should.have.a.property('payload',1000);
              msg.stat.should.have.a.property('count',1);
              msg.stat.should.have.property('average',1000);
              break;
            case 3:
              msg.should.have.a.property('payload',5000);
              msg.stat.should.have.a.property('count',1);
              msg.stat.should.have.property('average',5000);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "statistics", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload').which.is.Object();
          msg.payload.should.have.a.property('value',98);
          msg.stat.should.have.a.property('last',98);
          msg.stat.should.have.a.property('count',1);
          msg.stat.should.have.a.property('average',98);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "statistics", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98);
          msg.stat.should.have.a.property('last',98+5);
          msg.stat.should.have.a.property('count',1);
          msg.stat.should.have.a.property('average',98+5);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
