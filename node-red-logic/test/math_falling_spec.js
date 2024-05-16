var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_falling.js");

describe( 'math_falling Node', function () {
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
    var flow = [{ id: "n1", type: "fallingEdge", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('threshold', NaN);
        n1.should.have.a.property('consecutive', 1);
        n1.should.have.a.property('output', true);
        n1.should.have.a.property('outputType', "bool");
        n1.should.have.a.property('showState', false);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should check for falling edge', function (done) {
    const numbers = [10,1000,100.1,100,99.9,0,1000];
    var flow = [{ id: "n1", type: "fallingEdge", output: "Text", outputType:"str", name: "test", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload','Text');
          msg.should.have.property('value',99.9);
          msg.should.have.property('edge','falling');
          if( c === 1 )
          {
            done();
          }
          else
          {
            done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('threshold', 100);
        n1.should.have.a.property('output', 'Text');
        n1.should.have.a.property('outputType', "str");
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
    var flow = [{ id: "n1", type: "fallingEdge", output: "42", outputType:"num", name: "test", threshold:"100", consecutive:"3", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',42);
          msg.should.have.property('value',2);
          msg.should.have.property('edge','falling');
          if( c === 1 )
          {
            done();
          }
          else
          {
            done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('threshold', 100);
        n1.should.have.a.property('consecutive', 3);
        n1.should.have.a.property('output', 42);
        n1.should.have.a.property('outputType', "num");
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
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',2);
          if( c === 1 && msg.value === 2 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', true);
        n1.should.have.a.property('outputType', "bool");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 1000 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 2 });
    });
  });

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", threshold:"100", output:"false", outputType:"bool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',false);
          msg.should.have.a.property('value',c*10);
          msg.should.have.a.property('topic',c===1?"A":"B");
          if( c === 2 && msg.value === 20 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', false);
        n1.should.have.a.property('outputType', "bool");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ topic:"A", payload: 1000 });
      n1.receive({ topic:"B", payload: 1000 });
      n1.receive({ topic:"A", payload: 10 });
      n1.receive({ topic:"B", payload: 20 });
    });
  });

  it('should have reset', function (done) {
    const json = { text:"Text", num:42 };
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", output:JSON.stringify(json), outputType:"json", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',json);
          msg.should.have.property('value',5);
          if( c === 1 && msg.value === 5 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', json);
        n1.should.have.a.property('outputType', "json");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 1000 });
      n1.receive({ reset: true });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 1000 });
      n1.receive({ topic: "init" });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 1000 });
      n1.receive({ payload: 5 });
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:"100", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',90);
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
      n1.receive({ payload: {value:110} });
      n1.receive({ payload: {a:1,value:90,b:88} });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:"100", property:"payload-5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',102-5);
          done();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload-5");
        n1.should.have.a.property('propertyType', "jsonata");
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 1000 });
      n1.receive({ payload: 102 });
    });
  });

});
