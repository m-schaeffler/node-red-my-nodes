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
        n1.should.have.a.property('threshold', undefined);
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
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:100, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',99.9);
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
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:100, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',0);
          if( c === 1 && msg.payload === 0 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: 1000 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ invalid:true, payload: 1000 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 0 });
    });
  });

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", threshold:100, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c*10);
          msg.should.have.a.property('topic',c===1?"A":"B");
          if( c === 2 && msg.payload === 20 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ topic:"A", payload: 1000 });
      n1.receive({ topic:"B", payload: 1000 });
      n1.receive({ topic:"A", payload: 10 });
      n1.receive({ topic:"B", payload: 20 });
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:100, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5);
          if( c === 1 && msg.payload === 5 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
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

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "fallingEdge", name: "test", threshold:100, property:"payload-5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',102-5);
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
