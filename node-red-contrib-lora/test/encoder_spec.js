var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-packet-encoder.js");
var nodeKey= require("../lorawan-keys.js");
var keys   = require("./keys_spec.js");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");

describe( 'lorawan-packet-encoder Node', function () {

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

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "lorawan-packet-encoder", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('keyconf', null);
        n1.should.have.a.property('power', 14);
        n1.should.have.a.property('rfch', 'N');
        n1.should.have.a.property('contextStore', 'none');
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should encode messages', function (done) {
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
      n2.on("input", function (msg) {
        try {
          const data =['YHhWNBIAAQAGDLyYVLOxCmg=','YHhWNBIAAgAGcI+ruBkP3Oc=','YM2rAAAAAQABDpRwwJ0='];
          c++;
          //console.log(msg.payload);
          msg.should.have.a.property('topic',c<3?"Foo 1":"Bar 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('txpk').which.is.an.Object();
          msg.payload.txpk.should.have.a.property('freq',869.525);
          msg.payload.txpk.should.have.a.property('powe',14);
          msg.payload.txpk.should.have.a.property('modu',c<3?'LORA':"XxXx");
          msg.payload.txpk.should.have.a.property('datr',c<3?'SF7BW125':'SF8BW125');
          msg.payload.txpk.should.have.a.property('codr',c<3?'4/5':"5/6");
          msg.payload.txpk.should.have.a.property('ipol',true);
          msg.payload.txpk.should.have.a.property('size',c<3?17:14);
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
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          switch(c)
          {
            case 1:
            case 2:
              msg.payload.should.have.a.property('12345678',c);
              msg.payload.should.not.have.a.property('0000abcd');
              break;
            case 3:
              msg.payload.should.have.a.property('12345678',2);
              msg.payload.should.have.a.property('0000abcd',1);
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
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"0000abcd", data:[255], port:1, modu:"XxXx", datr:"SF8BW125", codr:"5/6" } });
        should.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should encode messages, rfch=0', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-encoder", keys:"nk", rfch:"0", contextStore:"memoryOnly", name: "test", wires: [["n2"],["n3"]], z: "flow" },
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
      n2.on("input", function (msg) {
        try {
          const data =['YHhWNBIgAQAGDLyYVDUQvxo=','YHhWNBIgAgAGcI+ruKoX+xA=','YM2rAAAgAQABDj9igQ8='];
          c++;
          //console.log(msg.payload);
          msg.should.have.a.property('topic',c<3?"Foo 1":"Bar 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('txpk').which.is.an.Object();
          msg.payload.txpk.should.have.a.property('freq',869.525);
          msg.payload.txpk.should.have.a.property('powe',14);
          msg.payload.txpk.should.have.a.property('modu','LORA');
          msg.payload.txpk.should.have.a.property('datr','SF7BW125');
          msg.payload.txpk.should.have.a.property('codr','4/5');
          msg.payload.txpk.should.have.a.property('ipol',true);
          msg.payload.txpk.should.have.a.property('size',c<3?17:14);
          msg.payload.txpk.should.have.a.property('data',data[c-1]);
          msg.payload.txpk.should.have.a.property('imme',true);
          msg.payload.txpk.should.have.a.property('rfch',0);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          switch(c)
          {
            case 1:
            case 2:
              msg.payload.should.have.a.property('12345678',c);
              msg.payload.should.not.have.a.property('0000abcd');
              break;
            case 3:
              msg.payload.should.have.a.property('12345678',2);
              msg.payload.should.have.a.property('0000abcd',1);
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
        should.not.exist( n1.context().get("counters", "memoryOnly") );
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6, ack:true } });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6, ack:true } });
        n1.receive({ payload: { device_address:"0000abcd", data:[255], port:1, ack:true } });
        should.exist( n1.context().get("counters", "memoryOnly") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should encode messages, rfch=1', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-encoder", keys:"nk", rfch:"1", contextStore:"memoryOnly", name: "test", wires: [["n2"],["n3"]], z: "flow" },
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
      n2.on("input", function (msg) {
        try {
          const data =['YHhWNBIAAQAGDLyYVLOxCmg=','YHhWNBIAAgAGcI+ruBkP3Oc=','YM2rAAAAAQABDpRwwJ0='];
          c++;
          //console.log(msg.payload);
          msg.should.have.a.property('topic',c<3?"Foo 1":"Bar 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('txpk').which.is.an.Object();
          msg.payload.txpk.should.have.a.property('freq',869.525);
          msg.payload.txpk.should.have.a.property('powe',14);
          msg.payload.txpk.should.have.a.property('modu','LORA');
          msg.payload.txpk.should.have.a.property('datr','SF7BW125');
          msg.payload.txpk.should.have.a.property('codr','4/5');
          msg.payload.txpk.should.have.a.property('ipol',true);
          msg.payload.txpk.should.have.a.property('size',c<3?17:14);
          msg.payload.txpk.should.have.a.property('data',data[c-1]);
          msg.payload.txpk.should.have.a.property('imme',true);
          msg.payload.txpk.should.have.a.property('rfch',1);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          switch(c)
          {
            case 1:
            case 2:
              msg.payload.should.have.a.property('12345678',c);
              msg.payload.should.not.have.a.property('0000abcd');
              break;
            case 3:
              msg.payload.should.have.a.property('12345678',2);
              msg.payload.should.have.a.property('0000abcd',1);
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
        should.not.exist( n1.context().get("counters", "memoryOnly") );
        should.not.exist( n1.context().get("counters", "storeInFile") );
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"0000abcd", data:[255], port:1 } });
        should.exist( n1.context().get("counters", "memoryOnly") );
        should.not.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should encode messages, rfch=P', function (done) {
    var flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "lorawan-packet-encoder", keys:"nk", rfch:"P", contextStore:"storeInFile", name: "test", wires: [["n2"],["n3"]], z: "flow" },
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
      n2.on("input", function (msg) {
        try {
          const data =['YHhWNBIAAQAGDLyYVLOxCmg=','YHhWNBIAAgAGcI+ruBkP3Oc=','YM2rAAAAAQABDpRwwJ0='];
          const rfch =[0,1,undefined];
          c++;
          //console.log(msg.payload);
          msg.should.have.a.property('topic',c<3?"Foo 1":"Bar 1");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('txpk').which.is.an.Object();
          msg.payload.txpk.should.have.a.property('freq',869.525);
          msg.payload.txpk.should.have.a.property('powe',14);
          msg.payload.txpk.should.have.a.property('modu','LORA');
          msg.payload.txpk.should.have.a.property('datr','SF7BW125');
          msg.payload.txpk.should.have.a.property('codr','4/5');
          msg.payload.txpk.should.have.a.property('ipol',true);
          msg.payload.txpk.should.have.a.property('size',c<3?17:14);
          msg.payload.txpk.should.have.a.property('data',data[c-1]);
          msg.payload.txpk.should.have.a.property('imme',true);
          msg.payload.txpk.should.have.a.property('rfch',rfch[c-1]);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          switch(c)
          {
            case 1:
            case 2:
              msg.payload.should.have.a.property('12345678',c);
              msg.payload.should.not.have.a.property('0000abcd');
              break;
            case 3:
              msg.payload.should.have.a.property('12345678',2);
              msg.payload.should.have.a.property('0000abcd',1);
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
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6, rfch:0 } });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6, rfch:1 } });
        n1.receive({ payload: { device_address:"0000abcd", data:[255], port:1 } });
        should.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should not encode invalid messages', function (done) {
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
      n2.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
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
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().get("counters", "storeInFile") );
        n1.receive({ payload: { device_address:"12340000", data:[1,2,3,4], port:6 } });
        should.exist( n1.context().get("counters", "storeInFile") );
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should set the default framecounter', function (done) {
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
      n2.on("input", function (msg) {
        try {
          c++;
          //console.log(msg.payload);
          const name = ["Foo 1","Bar 1"];
          const data = ['YHhWNBIAlwAGNIfQraTFtNo=','YM2rAAAAlwAGVQ+lrGJK4V4='];
          msg.should.have.a.property('topic',name[c-1]);
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
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('12345678',151);
          if( c===1 ) {
            msg.payload.should.not.have.a.property('0000abcd');
          } else {
            msg.payload.should.have.a.property('0000abcd',151);
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().get("counters", "storeInFile") );
        n1.receive({ framecounter: 150 });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"0000abcd", data:[1,2,3,4], port:6 } });
        should.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should set the framecounter', function (done) {
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
      n2.on("input", function (msg) {
        try {
          c++;
          //console.log(msg.payload);
          const name = ["Foo 1","Bar 1"];
          const data = ['YHhWNBIAsAAGeh/v2GsEjiE=','YM2rAAAAfgAGqCEUaKWfWhQ='];
          msg.should.have.a.property('topic',name[c-1]);
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
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('12345678',176);
          if( c===1 ) {
            msg.payload.should.have.a.property('0000abcd',125);
          } else {
            msg.payload.should.have.a.property('0000abcd',126);
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().get("counters", "storeInFile") );
        var fc = {};
        fc["12345678"] = 175;
        fc["0000abcd"] = 125;
        n1.receive({ framecounter: fc });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ payload: { device_address:"0000abcd", data:[1,2,3,4], port:6 } });
        should.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should change the framecounter', function (done) {
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
      n2.on("input", function (msg) {
        try {
          c++;
          //console.log(msg.payload);
          const data = ['YHhWNBIAAQAGDLyYVLOxCmg=','YHhWNBIAWQAGdb6CUF1Lgys='];
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
          //console.log(msg.payload);
          msg.should.have.a.property('topic',"framecounter");
          msg.should.have.a.property('payload').which.is.an.Object();
          if( c===1 ) {
            msg.payload.should.have.a.property('12345678',1);
          } else {
            msg.payload.should.have.a.property('12345678',89);
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('keyconf').which.is.an.Object();
        should.not.exist( n1.context().get("counters", "storeInFile") );
        var fc = {};
        fc["12345678"] = 88;
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        n1.receive({ framecounter: fc });
        n1.receive({ payload: { device_address:"12345678", data:[1,2,3,4], port:6 } });
        should.exist( n1.context().get("counters", "storeInFile") );
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

});
