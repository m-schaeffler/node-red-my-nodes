var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../logic_or.js");

describe( 'logic_or Node', function () {
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
    var flow = [{ id: "n1", type: "or", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('minData', 1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should or two bool values, mindata=1', function (done) {
    var flow = [{ id: "n1", type: "or", minData:1, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',c>=3);
          msg.should.have.property('count',c===1?1:2);
          if( c === 5 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('minData', 1);
      n1.receive({ topic: "a", payload: false });
      n1.receive({ topic: "b", payload: false });
      n1.receive({ topic: "a", payload: true });
      n1.receive({ topic: "b", payload: true });
      n1.receive({ topic: "b", payload: false });
    });
  });

  it('should or two bool values, mindata=2', function (done) {
    var flow = [{ id: "n1", type: "or", minData:2, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',c>=2);
          msg.should.have.property('count',2);
          if( c === 4 )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('minData', 2);
      n1.receive({ topic: "a", payload: false });
      n1.receive({ topic: "b", payload: false });
      n1.receive({ topic: "a", payload: true });
      n1.receive({ topic: "b", payload: true });
      n1.receive({ topic: "b", payload: false });
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "or", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',true);
          if( c === 1 && msg.payload )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.receive({ invalid:true, payload: false });
      n1.receive({ invalid:true, payload: true });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: null });
      n1.receive({ payload: true });
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "or", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4);
          if( c === 4 && msg.payload )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('filter', false);
      n1.receive({ payload: 0 });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 1 });
    });
  });

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "or", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2);
          if( c === 2 && msg.payload )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('filter', true);
      n1.receive({ payload: 0 });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 0 });
      n1.receive({ payload: 1 });
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "or", minData:3, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',c===3);
          msg.should.have.property('count',3);
          if( c === 3 && msg.payload )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('minData', 3);
      n1.receive({ topic: "a", payload: false });
      n1.receive({ topic: "b", payload: false });
      n1.receive({ topic: "c", payload: false });
      n1.receive({ reset: true });
      n1.receive({ topic: "a", payload: false });
      n1.receive({ topic: "b", payload: false });
      n1.receive({ topic: "c", payload: false });
      n1.receive({ topic: "init" });
      n1.receive({ topic: "a", payload: true });
      n1.receive({ topic: "b", payload: true });
      n1.receive({ topic: "c", payload: true });
    });
  });

/*
  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "or", name: "test", property:"payload=5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',true);
          done();
        }
        catch(err) {
          done(err);
        }
      });
      n1.should.have.a.property('property', "payload=5");
      n1.should.have.a.property('propertyType', "jsonata");
      n1.receive({ payload: 5 });
    });
  });
*/

});
