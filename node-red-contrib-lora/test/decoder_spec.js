var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-packet-decoder.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

describe( 'lorawan-packet-decoder Node', function () {

  beforeEach(function (done) {
    helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memory0: {
          module: "memory"
        }
      }
    });
    Context.load().then(function () {
      done();
    });
  }

  afterEach(function(done) {
    helper.unload().then(function () {
      return Context.clean({allNodes: {}});
    }).then(function () {
      return Context.close();
    }).then(function () {
      helper.stopServer(done);
    });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "lorawan-packet-decoder", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('keyconf', null);
        n1.should.have.a.property('txdelay',1012500);
        n1.should.have.a.property('timeout',900);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unconfirmed messages', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-decoder", keys:"nk", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys", z: "flow" }];
    helper.load([node,nodeKey], flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var nk = helper.getNode("nk");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          //console.log(msg);
          msg.should.have.a.property('topic',c<3?"Foo 1":"Bar 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('device_address',c<3?'12345678':'0000abcd');
          msg.payload.should.have.a.property('frame_count',c<3?c:1);
          msg.payload.should.have.a.property('port',c<3?6:1);
          msg.payload.should.have.a.property('mtype','Unconfirmed Data Down');
          msg.payload.should.have.a.property('confirmed',false);
          msg.payload.should.have.a.property('type',c<3?'foo':'bar');
          msg.payload.should.have.a.property('name',msg.topic);
          msg.payload.should.have.a.property('data',c<3?[1,2,3,4]:[255]);
          msg.payload.should.have.a.property('rxpk').which.is.an.Object();
          msg.payload.rxpk.should.have.a.property('data').which.is.String();
          msg.payload.rxpk.should.have.a.property('test','UnitTest');
          msg.payload.rxpk.should.have.a.property('time');
          if( c === 3 ) {
            done();
          }
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
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().flow.get("sendqueue") );
        n1.receive({ payload: { data:"YHhWNBIAAQAGDLyYVLOxCmg=", test:"UnitTest" } });
        n1.receive({ payload: { data:"YHhWNBIAAgAGcI+ruBkP3Oc=", test:"UnitTest" } });
        n1.receive({ payload: { data:"YM2rAAAAAQABDpRwwJ0=", test:"UnitTest" } });
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not decode invalid messages', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-decoder", keys:"nk", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys", z: "flow" }];
    helper.load([node,nodeKey], flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var nk = helper.getNode("nk");
      n2.on("input", function (msg) {
        try {
          console.log(msg);
          msg.should.fail();1
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
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().flow.get("sendqueue") );
        n1.receive({});
        n1.receive({ payload: {} });
        n1.receive({ payload: { data:"1234" } });
        //n1.receive({ payload: { data:"YHlWNBIAAQAGDLyYVLOxCmg=" } });
        n1.receive({ payload: { data:"1234567890" } });
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward unknown devices', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-decoder", keys:"nk", name: "test", wires: [["n2"],["n3"],["n4"],["n5"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys", z: "flow" }];
    helper.load([node,nodeKey], flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var n4 = helper.getNode("n4");
      var n5 = helper.getNode("n5");
      var nk = helper.getNode("nk");
      n2.on("input", function (msg) {
        try {
          console.log(msg);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg);
          msg.should.have.a.property('topic',"External");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('device_address','12345679');
          msg.payload.should.have.a.property('frame_count',1);
          msg.payload.should.have.a.property('port',6);
          msg.payload.should.have.a.property('mtype','Unconfirmed Data Down');
          msg.payload.should.have.a.property('confirmed',false);
          msg.payload.should.have.a.property('rxpk').which.is.an.Object();
          msg.payload.rxpk.should.have.a.property('data','YHlWNBIAAQAGDLyYVLOxCmg=');
          msg.payload.rxpk.should.have.a.property('time');
          done();
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
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().flow.get("sendqueue") );
        n1.receive({ topic:"External", payload: { data:"YHlWNBIAAQAGDLyYVLOxCmg=" } });
      }
      catch(err) {
        done(err);
      }
    });
  });

});
