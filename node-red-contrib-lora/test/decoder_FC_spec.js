var should = require("should");
var sinon  = require("sinon");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-packet-decoder.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var lora_packet = require( 'lora-packet' );
require("./decoder_spec.js");

describe( 'lorawan-packet-decoder Node, high FC', function () {

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

  it('should decode messages with high frame counter', function (done) {
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
      var spy = sinon.spy(lora_packet,'verifyMIC');
      n2.on("input", function (msg) {
        try {
          c++;
          //console.log(msg);
          msg.should.have.a.property('topic',"Foo 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('device_address','12345678');
          msg.payload.should.have.a.property('port',6);
          msg.payload.should.have.a.property('mtype','Unconfirmed Data Down');
          msg.payload.should.have.a.property('confirmed',false);
          msg.payload.should.have.a.property('type','foo');
          msg.payload.should.have.a.property('name',msg.topic);
          msg.payload.should.have.a.property('data',[1,2,3,4]);
          msg.payload.should.have.a.property('rxpk').which.is.an.Object();
          msg.payload.rxpk.should.have.a.property('data').which.is.String();
          msg.payload.rxpk.should.have.a.property('time');
          switch( c ) {
            case 1:
              msg.payload.should.have.a.property('frame_count',1);
              break;
            case 2:
              msg.payload.should.have.a.property('frame_count',0x10010);
              break;
            case 3:
              msg.payload.should.have.a.property('frame_count',0x2000020);
              spy.should.have.a.callCount(1+3+511);
              //console.log(spy.callCount);
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
        n1.receive({ payload: { data:"YHhWNBIAAQAGDLyYVLOxCmg=" } });
        spy.should.have.a.callCount(1);
        //
        n1.receive({ payload: { data:"YHhWNBIAEAAGaqNYXlaqgw8=" } });
        spy.should.have.a.callCount(1+2);
        //
        n1.receive({ payload: { data:"YHhWNBIAIAAGdjJd4llLFsc=" } });
        lora-packet.verifyMIC.restore();
      }
      catch(err) {
        lora-packet.verifyMIC.restore();
        done(err);
      }
    });
  });

});
