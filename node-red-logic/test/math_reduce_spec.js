var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_reduce.js");

describe( 'math_reduce Node', function () {
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
    var flow = [{ id: "n1", type: "reduce", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', "");
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('minMean', 1);
        n1.should.have.a.property('maxMean', 1);
        n1.should.have.a.property('minData', 1);
        n1.should.have.a.property('algo', undefined);
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('showState', false);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should add values', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", topic:"Addition", algo:"add", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('topic',"Addition");
          msg.should.have.property('payload',s);
          msg.should.have.property('count',c);
          msg.should.have.property('data');
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
        n1.should.have.a.property('algo', "add");
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should mean values', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", topic:"Mittelwert", algo:"mean", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('topic',"Mittelwert");
          msg.should.have.property('payload',s/c);
          msg.should.have.property('count',c);
          msg.should.have.property('data');
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
        n1.should.have.a.property('algo', "mean");
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should multiply values', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", topic:"Multiplikation", algo:"prod", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 1;
      n2.on("input", function (msg) {
        try {
          s *= numbers[c++];
          msg.should.have.property('topic',"Multiplikation");
          msg.should.have.property('payload',s);
          msg.should.have.property('count',c);
          msg.should.have.property('data');
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
        n1.should.have.a.property('algo', "prod");
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should min values', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", topic:"Minimum", algo:"min", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 9999;
      n2.on("input", function (msg) {
        try {
          s = Math.min( s, numbers[c++] );
          msg.should.have.property('topic',"Minimum");
          msg.should.have.property('payload',s);
          msg.should.have.property('count',c);
          msg.should.have.property('data');
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
        n1.should.have.a.property('algo', "min");
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should max values', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", topic:"Maximum", algo:"max", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 0;
      n2.on("input", function (msg) {
        try {
          s = Math.max( s, numbers[c++] );
          msg.should.have.property('topic',"Maximum");
          msg.should.have.property('payload',s);
          msg.should.have.property('count',c);
          msg.should.have.property('data');
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
        n1.should.have.a.property('algo', "max");
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should check minData', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", algo:"add", minData:3, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var s = 34+17;
      n2.on("input", function (msg) {
        try {
          s += numbers[c++];
          msg.should.have.property('payload',s);
          msg.should.have.property('count',c+2);
          msg.should.have.property('data');
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
      n1.receive({ topic:-2, payload: 34 })
      n1.receive({ topic:-1, payload: 17 })
      for( const i in numbers )
      {
        n1.receive({ topic:i, payload: numbers[i] });
      }
    });
  });

  it('should add mean values, min 2 max 2', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", algo:"prod", minData:2, minMean:2, maxMean:2, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 3;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',(numbers[c]+numbers[c-2])*(numbers[c-1]+numbers[c-3])/4);
          c++;
          msg.should.have.property('count',2);
          msg.should.have.property('data');
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
        n1.should.have.a.property('minMean', 2);
        n1.should.have.a.property('maxMean', 2);
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i%2, payload: numbers[i] });
      }
    });
  });

  it('should add mean values, min 1 max 2', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", algo:"prod", minData:2, minMean:1, maxMean:2, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 1;
      n2.on("input", function (msg) {
        try {
          switch( c )
          {
            case 1:
              msg.should.have.property('payload',numbers[c]*numbers[c-1]);
              break;
            case 2:
              msg.should.have.property('payload',(numbers[c]+numbers[c-2])*numbers[c-1]/2);
              break;
            default:
              msg.should.have.property('payload',(numbers[c]+numbers[c-2])*(numbers[c-1]+numbers[c-3])/4);
          }
          c++;
          msg.should.have.property('count',2);
          msg.should.have.property('data');
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
        n1.should.have.a.property('minMean', 1);
        n1.should.have.a.property('maxMean', 2);
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i%2, payload: numbers[i] });
      }
    });
  });

  it('should add mean values, min 2 max 3', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "reduce", name: "test", algo:"prod", minData:2, minMean:2, maxMean:3, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 3;
      n2.on("input", function (msg) {
        try {
          switch( c )
          {
            case 3:
              msg.should.have.property('payload',(numbers[c]+numbers[c-2])*(numbers[c-1]+numbers[c-3])/4);
              break;
            case 4:
              msg.should.have.property('payload',(numbers[c]+numbers[c-2]+numbers[c-4])*(numbers[c-1]+numbers[c-3])/6);
              break;
            default:
              msg.should.have.property('payload').which.is.approximately((numbers[c]+numbers[c-2]+numbers[c-4])*(numbers[c-1]+numbers[c-3]+numbers[c-5])/9,0.00001);
          }
          c++;
          msg.should.have.property('count',2);
          msg.should.have.property('data');
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
        n1.should.have.a.property('minMean', 2);
        n1.should.have.a.property('maxMean', 3);
      }
      catch(err) {
        done(err);
      }
      for( const i in numbers )
      {
        n1.receive({ topic:i%2, payload: numbers[i] });
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "reduce", name: "test", algo:"add", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
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
    var flow = [{ id: "n1", type: "reduce", name: "test", algo: "add", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('count',c!==2?1:2);
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',100);
              break;
            case 2:
              msg.should.have.a.property('payload',101);
              break;
            case 3:
              msg.should.have.a.property('payload',1);
              break;
            case 4:
              msg.should.have.a.property('payload',5);
              done();
              break;
            default:
              done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ topic:1, payload: 100 });
      n1.receive({ topic:2, payload: 1 });
      n1.receive({ reset: true });
      n1.receive({ topic:2, payload: 1 });
      n1.receive({ topic: "init" });
      n1.receive({ topic:3, payload: 5 });
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "reduce", name: "test", algo: "add", property:"payload.value", wires: [["n2"]] },
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
        //n1.should.have.a.property('propertyType', "msg");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: {a:1,value:98,b:88} });
    });
  });

/*
  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "reduce", name: "test", algo: "add", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',198+5);
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
      n1.receive({ payload: 0 });
      n1.receive({ payload: 198 });
    });
  });
*/
});
