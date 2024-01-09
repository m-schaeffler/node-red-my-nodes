var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_number.js");

describe( 'math_number Node', function () {
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
    var flow = [{ id: "n1", type: "tonumber", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('showState', false);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward numbers', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "tonumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        msg.should.have.property('payload',Number(numbers[c]));
        if( ++c === numbers.length )
        {
          done();
        }
      });
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "tonumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        msg.should.have.a.property('payload',255);
        if( c === 1 && msg.payload === 255 )
        {
          done();
        }
      });
      n1.receive({ invalid:true, payload: 12.345 });
      n1.receive({ invalid:true, payload: -12.345 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ payload: undefined });
      n1.receive({ payload: "FooBar" });
      n1.receive({ payload: NaN });
      n1.receive({ payload: 255 });
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "tonumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        msg.should.have.a.property('payload',c===4?255:23);
        if( c === 4 && msg.payload === 255 )
        {
          done();
        }
      });
      n1.should.have.a.property('filter', false);
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 255 });
    });
  });

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "tonumber", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        msg.should.have.a.property('payload',c===2?255:2);
        if( c === 2 && msg.payload === 255 )
        {
          done();
        }
      });
      n1.should.have.a.property('filter', true);
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 2 });
      n1.emit("input", { payload: 255 });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "tonumber", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        msg.should.have.a.property('payload',25);
        done();
      });
      n1.should.have.a.property('property', "payload+5");
      n1.should.have.a.property('propertyType', "jsonata");
      n1.emit("input", { payload: 20 });
    });
  });

});
