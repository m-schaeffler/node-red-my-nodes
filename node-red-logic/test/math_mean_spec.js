var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_mean.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_mean Node', function () {
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
    var flow = [{ id: "n1", type: "mean", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('deltaTime', 60000);
        n1.should.have.a.property('minData', 1);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('showState', false);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should caclulate mean values', function (done) {
    const numbers = [1000,10,99.9,100,100.1,1000,0];
    var flow = [{ id: "n1", type: "mean", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',s/c);
          msg.should.have.property('count',c);
          if( c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      for( const i of numbers )
      {
        n1.receive({ topic:1, payload: i });
        await delay(50);
      }
    });
  });

  it('should caclulate mean values, minData=3', function (done) {
    const numbers = [1000,10,99.9,100,100.1,1000,0];
    var flow = [{ id: "n1", type: "mean", minData:3, name: "test", wires: [["n2"]] },
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
          msg.should.have.property('payload',s/(c+2));
          msg.should.have.property('count',c+2);
          if( c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 3);
      }
      catch(err) {
        done(err);
      }
      n1.receive({ topic:2, payload: 17 });
      n1.receive({ topic:2, payload: 34 });
      for( const i of numbers )
      {
        n1.receive({ topic:2, payload: i });
        await delay(50);
      }
    });
  });

  it('should have zeroIsZero', function (done) {
    const numbers = [1000,10,99.9,100,100.1,1000,0,50];
    var flow = [{ id: "n1", type: "mean", zeroIsZero:true, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('topic',"zero");
          msg.should.have.property('payload',c===numbers.length-1?0:s/c);
          msg.should.have.property('count',c===numbers.length-1?1:c);
          if( c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('zeroIsZero', true);
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ topic:"zero", payload: i });
        await delay(50);
      }
    });
  });

  it('should mean data only for deltaTime window', function (done) {
    var flow = [{ id: "n1", type: "mean", deltaTime: 0.1, name: "test", wires: [["n2"]] },
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
          msg.should.have.a.property('count',1);
          if( c==3 && msg.payload===3000 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('deltaTime', 100);
      }
      catch(err) {
        done(err);
      }
      start = Date.now();
      n1.receive({ payload: 1000 });
      await delay(200);
      n1.receive({ payload: 2000 });
      await delay(200);
      n1.receive({ payload: 3000 });
    });
  });

  it('should filter data in time domain', function (done) {
    var flow = [{ id: "n1", type: "mean", filter: 1, name: "test", wires: [["n2"]] },
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
              msg.should.have.a.property('payload',1000);
              msg.should.have.a.property('count',1);
              break;
            case 2:
              delta.should.be.approximately(1100,25);
              msg.should.have.a.property('payload',(1000+2000+5000)/3);
              msg.should.have.a.property('count',3);
              done();
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
      }
      catch(err) {
        done(err);
      }
      start = Date.now();
      n1.receive({ payload: 1000 });
      await delay(900);
      n1.receive({ payload: 2000 });
      await delay(200);
      n1.receive({ payload: 5000 });
    });
  });

  it('should filter data in value domain', function (done) {
    var flow = [{ id: "n1", type: "mean", filterVal: 100, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
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
              msg.should.have.a.property('payload',1000);
              msg.should.have.a.property('count',1);
              break;
            case 2:
              msg.should.have.a.property('payload',(1000+1199+1102)/3);
              msg.should.have.a.property('count',3);
              done();
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterValue', 100);
      }
      catch(err) {
        done(err);
      }
      start = Date.now();
      n1.receive({ payload: 1000 });
      n1.receive({ payload: 1199 });
      n1.receive({ payload: 1102 });
    });
  });

  it('should filter data in both domains 1', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "mean", filter: 0.25, filterVal: 100, name: "test", wires: [["n2"]] },
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
              msg.should.have.a.property('count',1);
              break;
            case 2:
              delta.should.be.approximately(2900,50);
              msg.should.have.a.property('payload',1010);
              msg.should.have.a.property('count',5);
              done();
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
      }
      catch(err) {
        done(err);
      }
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
    });
  });

  it('should filter data in both domains 2', function (done) {
    var flow = [{ id: "n1", type: "mean", filter: 0.25, filterVal: 100, name: "test", wires: [["n2"]] },
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
              msg.should.have.a.property('count',1);
              break;
            case 2:
              delta.should.be.approximately(300,25);
              msg.should.have.a.property('payload',1500);
              msg.should.have.a.property('count',2);
              done();
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
      }
      catch(err) {
        done(err);
      }
      start = Date.now();
      n1.receive({ payload: 1000 });
      await delay(300);
      n1.receive({ payload: 2000 });
    });
  });

  it('should filter data in both domains 3', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "mean", filter: 0.25, filterMul: 0, filterVal: 100, name: "test", wires: [["n2"]] },
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
              msg.should.have.a.property('count',1);
              break;
            case 2:
              delta.should.be.approximately(3500,50);
              msg.should.have.a.property('payload',1175);
              msg.should.have.a.property('count',6);
              done();
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
      }
      catch(err) {
        done(err);
      }
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
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "mean", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
          msg.should.have.a.property('count',1);
          if( c === 1 && msg.payload === 5000 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 5000 });
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "mean", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
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
              msg.should.have.a.property('count',1);
              break;
            case 2:
              msg.should.have.a.property('payload',1000);
              msg.should.have.a.property('count',1);
              break;
            case 3:
              msg.should.have.a.property('payload',5000);
              msg.should.have.a.property('count',1);
              done();
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 5000 });
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "mean", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98);
          done();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: {a:1,value:98,b:88} });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "mean", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98+5);
          done();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload+5");
        n1.should.have.a.property('propertyType', "jsonata");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 98 });
    });
  });

});
