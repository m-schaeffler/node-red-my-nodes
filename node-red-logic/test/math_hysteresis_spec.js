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
        n1.should.have.a.property('threshold_rise', NaN);
        n1.should.have.a.property('threshold_fall', NaN);
        n1.should.have.a.property('consecutiveRise', 1);
        n1.should.have.a.property('consecutiveFall', 1);
        n1.should.have.a.property('outputRise', true);
        n1.should.have.a.property('outputFall', false);
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
    var flow = [{ id: "n1", type: "hysteresisEdge", outputRise: "Text R", outputRiseType:"str", outputFall: "Text F", outputFallType:"str", name: "test", threshold_raise:"200", threshold_fall:"100", wires: [["n2"]] },
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
               msg.should.have.property('payload','Text R');
               msg.should.have.property('value',1000);
               msg.should.have.property('edge','rising');
               break;
             case 2:
               msg.should.have.property('payload','Text F');
               msg.should.have.property('value',10);
               msg.should.have.property('edge','falling');
               break;
             case 3:
               msg.should.have.property('payload','Text R');
               msg.should.have.property('value',200.1);
               msg.should.have.property('edge','rising');
               break;
             case 4:
               msg.should.have.property('payload','Text F');
               msg.should.have.property('value',99.9);
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
        n1.should.have.a.property('outputRise', 'Text R');
        n1.should.have.a.property('outputFall', 'Text F');
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

  it('should respect consecutive parameter', function (done) {
    const numbers = [1000,150,10,400,40,150,250,251,252,253,254,255,150,151,152,153,154,155,0,1,2,3,4,5,400,40,400,40,400,40,300,301,302];
    var flow = [{ id: "n1", type: "hysteresisEdge", outputRise: "42", outputRiseType:"num", outputFall: "-1", outputFallType:"num", name: "test", threshold_raise:"200", threshold_fall:"100", consecutive:"3", consecutiveFall:"3", wires: [["n2"]] },
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
               msg.should.have.property('payload',42);
               msg.should.have.property('value',252);
               msg.should.have.property('edge','rising');
               break;
             case 2:
               msg.should.have.property('payload',-1);
               msg.should.have.property('value',2);
               msg.should.have.property('edge','falling');
               break;
             case 3:
               msg.should.have.property('payload',42);
               msg.should.have.property('value',302);
               msg.should.have.property('edge','rising');
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
        n1.should.have.a.property('consecutiveRise', 3);
        n1.should.have.a.property('consecutiveFall', 3);
        n1.should.have.a.property('outputRise', 42);
        n1.should.have.a.property('outputFall', -1);
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

  it('should respect consecutiveRise parameter', function (done) {
    const numbers = [1000,150,10,400,40,150,250,251,252,253,254,255,150,151,152,153,154,155,0,1,2,3,4,5,400,40,400,40,400,40,300,301,302];
    var flow = [{ id: "n1", type: "hysteresisEdge", outputRise: "42", outputRiseType:"num", outputFall: "-1", outputFallType:"num", name: "test", threshold_raise:"200", threshold_fall:"100", consecutive:"3", wires: [["n2"]] },
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
               msg.should.have.property('payload',-1);
               msg.should.have.property('value',10);
               msg.should.have.property('edge','falling');
               break;
             case 2:
               msg.should.have.property('payload',42);
               msg.should.have.property('value',252);
               msg.should.have.property('edge','rising');
               break;
             case 3:
               msg.should.have.property('payload',-1);
               msg.should.have.property('value',0);
               msg.should.have.property('edge','falling');
               break;
             case 4:
               msg.should.have.property('payload',42);
               msg.should.have.property('value',302);
               msg.should.have.property('edge','rising');
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
        n1.should.have.a.property('consecutiveRise', 3);
        n1.should.have.a.property('outputRise', 42);
        n1.should.have.a.property('outputFall', -1);
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

  it('should respect consecutiveFall parameter', function (done) {
    const numbers = [150,10,150,250,251,252,253,254,255,150,151,152,153,154,155,0,1,2,3,4,5,300,301,302];
    var flow = [{ id: "n1", type: "hysteresisEdge", outputRise: "42", outputRiseType:"num", outputFall: "-1", outputFallType:"num", name: "test", threshold_raise:"200", threshold_fall:"100", consecutiveFall:"3", wires: [["n2"]] },
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
               msg.should.have.property('payload',42);
               msg.should.have.property('value',250);
               msg.should.have.property('edge','rising');
               break;
             case 2:
               msg.should.have.property('payload',-1);
               msg.should.have.property('value',2);
               msg.should.have.property('edge','falling');
               break;
             case 3:
               msg.should.have.property('payload',42);
               msg.should.have.property('value',300);
               msg.should.have.property('edge','rising');
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
        n1.should.have.a.property('consecutiveFall', 3);
        n1.should.have.a.property('outputRise', 42);
        n1.should.have.a.property('outputFall', -1);
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
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:"200", threshold_fall:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',5000);
          if( c === 1 && msg.value === 5000 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('outputRise', true);
        n1.should.have.a.property('outputFall', false);
        done();
      }
      catch(err) {
        done(err);
      }
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 5000 });
    });
  });

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", threshold_raise:"200", threshold_fall:"100", outputRise:"false", outputRiseType:"bool", outputFall:"true", outputFallType:"bool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',false);
          msg.should.have.property('value',c*1000);
          msg.should.have.property('topic',c===1?"A":"B");
          if( c === 2 && msg.value === 2000 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('outputRise', false);
        n1.should.have.a.property('outputFall', true);
        done();
      }
      catch(err) {
        done(err);
      }
      n1.receive({ topic:"A", payload: 1000 });
      n1.receive({ topic:"B", payload: 2000 });
    });
  });

  it('should have reset', function (done) {
    const jsonR = { text:"Text R", num:42 };
    const jsonF = { text:"Text F", num:-1 };
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:"200", threshold_fall:"100", outputRise:JSON.stringify(jsonR), outputRiseType:"json", outputFall:JSON.stringify(jsonF), outputFallType:"json", initial:"any", wires: [["n2"]] },
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
            case 2:
              msg.should.have.property('payload',jsonF);
              msg.should.have.a.property('value',0);
              break;
            case 3:
            case 4:
              msg.should.have.property('payload',jsonR);
              msg.should.have.a.property('value',1000);
              break;
            case 5:
              msg.should.have.property('payload',jsonF);
              msg.should.have.a.property('value',2);
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
        n1.should.have.a.property('outputRise', jsonR);
        n1.should.have.a.property('outputFall', jsonF);
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 0 });
      n1.receive({ reset: true });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 1000 });
      n1.receive({ reset: true });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 150 });
      n1.receive({ payload: 2 });
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:"200", threshold_fall:"100", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',210);
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
      n1.receive({ payload: {value:150} });
      n1.receive({ payload: {a:1,value:210,b:88} });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "hysteresisEdge", name: "test", threshold_raise:"200", threshold_fall:"100", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',198+5);
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
      n1.receive({ payload: 150 });
      n1.receive({ payload: 198 });
    });
  });

});
