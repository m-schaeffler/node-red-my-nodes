var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-packet-checkFC.js");

require("./keys_spec.js");

describe( 'lorawan-packet-checkFC Node', function () {
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
    var flow = [{ id: "n1", type: "lorawan-packet-checkFC", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should receive data frames', function (done) {
    const fc = [14,255,0,15,15,16,1];
    var flow = [{ id: "n1", type: "lorawan-packet-checkFC", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('frame_count',fc[c-1]);
          msg.should.not.have.property('missing');
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n5.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('ok',c);
          msg.payload.should.have.property('nok',0);
          msg.payload.should.have.property('miss',0);
          msg.payload.should.have.property('dup',0);
          if( c === fc.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":14} });
        n1.receive({ topic: "LoRa_3", payload: {"frame_count":255} });
        n1.receive({ topic: "LoRa_3", payload: {"frame_count":0} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_2", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":16} });
        n1.receive({ topic: "LoRa_3", payload: {"frame_count":1} });
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should detect duplicate data frames', function (done) {
    const fc = [14,15,15,16];
    var flow = [{ id: "n1", type: "lorawan-packet-checkFC", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          c.should.not.be.eql(3);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('frame_count',fc[c-1]);
          msg.should.not.have.property('missing');
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          c.should.be.eql(3);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('frame_count',fc[c-1]);
          msg.should.have.property('duplicate',true);
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n5.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('ok',c>=3?c-1:c);
          msg.payload.should.have.property('nok',0);
          msg.payload.should.have.property('miss',0);
          msg.payload.should.have.property('dup',c>=3?1:0);
          if( c === fc.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":14} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":16} });
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should detect missing data frames', function (done) {
    const fc = [14,15,17,18];
    var flow = [{ id: "n1", type: "lorawan-packet-checkFC", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('frame_count',fc[c-1]);
          if( c === 3 )
            msg.should.have.property('missing',1);
          else
            msg.should.not.have.property('missing');
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c.should.be.eql(3);
          msg.should.have.property('payload').which.is.String();
        }
        catch(err) {
          done(err);
        }
      });
      n5.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('ok',c>=3?c-1:c);
          msg.payload.should.have.property('nok',0);
          msg.payload.should.have.property('miss',c>=3?1:0);
          msg.payload.should.have.property('dup',0);
          if( c === fc.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":14} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":17} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":18} });
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should detect invalid data frames', function (done) {
    const fc = [14,15,14,16];
    var flow = [{ id: "n1", type: "lorawan-packet-checkFC", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" },
                { id: "n4", type: "helper" },
                { id: "n5", type: "helper" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          c.should.not.be.eql(3);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('frame_count',fc[c-1]);
          msg.should.not.have.property('missing');
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          c++;
          c.should.be.eql(3);
          msg.should.have.property('payload').which.is.String();
        }
        catch(err) {
          done(err);
        }
      });
      n5.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('ok',c>=3?c-1:c);
          msg.payload.should.have.property('nok',c>=3?1:0);
          msg.payload.should.have.property('miss',0);
          msg.payload.should.have.property('dup',0);
          if( c === fc.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":14} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":15} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":14} });
        n1.receive({ topic: "LoRa_1", payload: {"frame_count":16} });
      }
      catch(err) {
        done(err);
      }
    });
  });

});
