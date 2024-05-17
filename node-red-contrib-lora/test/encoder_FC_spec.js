var should = require("should");
var sinon  = require("sinon");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-packet-encoder.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var lora_packet = require( 'lora-packet' );
require("./encoder_spec.js");

describe( 'lorawan-packet-encoder Node, high FC', function () {

  beforeEach(function (done) {
    helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memoryOnly: {
          module: "memory"
        },
        storeInFile: {
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

  it('should encode messages with high frame counter', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-encoder", keys:"nk", contextStore:"storeInFile", name: "test", wires: [["n2"],["n3"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "nk", type: "lorawan-keys", keys:keys.keys, name: "TestKeys", z: "flow" }];
    helper.load([node,nodeKey], flow, function () {
     initContext(async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      var nk = helper.getNode("nk");
      var c = 0;
      var spy = sinon.spy(lora_packet,'fromFields');
      n2.on("input", function (msg) {
        try {
          const data =['YHhWNBIgAQAGDLyYVDUQvxo=','YHhWNBIAEAAGaqNYXlaqgw8=','YHhWNBIAIAAGdjJd4llLFsc='];
          c++;
          //console.log(msg);
          msg.should.have.a.property('topic',"Foo 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('txpk').which.is.an.Object();
          msg.payload.txpk.should.have.a.property('freq',869.525);
          msg.payload.txpk.should.have.a.property('powe',14);
          msg.payload.txpk.should.have.a.property('modu','LORA');
          msg.payload.txpk.should.have.a.property('datr','SF7BW125');
          msg.payload.txpk.should.have.a.property('codr','4/5');
          msg.payload.txpk.should.have.a.property('ipol',true);
          msg.payload.txpk.should.have.a.property('size',17);
          msg.payload.txpk.should.have.a.property('data',data[c-1]);
          msg.payload.txpk.should.have.a.property('imme',true);
          msg.payload.txpk.should.not.have.a.property('rfch');
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          switch(c)
          {
            case 1:
              msg.payload.should.have.a.property('12345678',1);
              spy.args[0][0].FCnt.should.be.eql( 1 );
              spy.args[0][4].should.be.eql(Buffer.from([0,0]));
              break;
            case 2:
              msg.payload.should.have.a.property('12345678',0x10010);
              spy.args[1][0].FCnt.should.be.eql( 16 );
              spy.args[1][4].should.be.eql(Buffer.from([1,0]));
              break;
            case 3:
              msg.payload.should.have.a.property('12345678',0x2000020);
              spy.args[2][0].FCnt.should.be.eql( 32 );
              spy.args[2][4].should.be.eql(Buffer.from([0,2]));
              done()
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().get("counters", "storeInFile") );
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6, ack:true } });
        should.exist( n1.context().get("counters", "storeInFile") );
        //
        var fc = {};
        fc["12345678"] = 0x1000F;
        n1.receive({ framecounter: fc });
        should.exist( n1.context().get("counters", "storeInFile") );
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        //console.log(spy.args);
        //
        fc["12345678"] = 0x200001F;
        n1.receive({ framecounter: fc });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        //console.log(spy.args);
        lora-packet.fromFields.restore();
      }
      catch(err) {
        lora-packet.fromFields.restore();
        done(err);
      }
     });
    });
  });

});
