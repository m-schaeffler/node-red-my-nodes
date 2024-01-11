var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_hysteresis.js");

describe( 'math_hysteresis Node', function () {
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
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('threshold_rise', undefined);
        n1.should.have.a.property('threshold_fall', undefined);
        n1.should.have.a.property('initial', 'none');
        n1.should.have.a.property('showState', false);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should check for edges', function (done) {
    const numbers = [1000,10,199.9,200,200.1,1000,100.1,100,99.9,0];
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          switch( c )
          {
             case 1:
               msg.should.have.property('payload',10);
               msg.should.have.property('edge','falling');
               break;
             case 2:
               msg.should.have.property('payload',200.1);
               msg.should.have.property('edge','rising');
               break;
             case 3:
               msg.should.have.property('payload',99.9);
               msg.should.have.property('edge','falling');
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
      try {
        n1.should.have.a.property('threshold_rise', 200);
        n1.should.have.a.property('threshold_fall', 100);
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, wires: [["n2"]] },
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
      n1.receive({ payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 5000 });0
    });
  });

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", threshold_raise:200, threshold_fall:100, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c*1000);
          msg.should.have.a.property('topic',c===1?"A":"B");
          if( c === 2 && msg.payload === 2000 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ topic:"A", payload: 0 });
      n1.receive({ topic:"B", payload: 0 });
      n1.receive({ topic:"A", payload: 1000 });
      n1.receive({ topic:"B", payload: 2000 });
    });
  });

  it('should have reset, initial==none', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, wires: [["n2"]] },
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
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 150 });
      n1.receive({ payload: 5000 });
    });
  });

  it('should have initial==rising', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, initial:"rising", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c ) {
            case 1:
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              msg.should.have.a.property('payload',5000);
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
      try {
        n1.should.have.a.property('initial', "rising");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 150 });
      n1.receive({ payload: 5000 });
    });
  });

  it('should have initial==falling', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, initial:"falling", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c ) {
            case 1:
              msg.should.have.a.property('payload',0);
              break;
            case 2:
              msg.should.have.a.property('payload',2);
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
      try {
        n1.should.have.a.property('initial', "falling");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 150 });
      n1.receive({ payload: 2 });
    });
  });

  it('should have initial==any', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, initial:"any", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c ) {
            case 1:
              msg.should.have.a.property('payload',0);
              break;
            case 2:
              msg.should.have.a.property('payload',1000);
              break;
            case 3:
              msg.should.have.a.property('payload',2);
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
      try {
        n1.should.have.a.property('initial', "any");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ reset: true });
      n1.receive({ payload: 150 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 2 });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:200, threshold_fall:100, property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
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

});