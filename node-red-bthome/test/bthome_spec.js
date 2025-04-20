var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../bthome.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'bthome Node', function () {
  "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          return Context.clean({allNodes: {}});
      }).then(function () {
          return Context.close();
      }).then(function () {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    let flow = [{ id: "n1", type: "bthome", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices', {});
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        should.not.exist( n1.context().flow.get("bthome") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should process device data', function (done) {
    const devicesJson = '{ \
        "11:22:33:44:55:66": { "topic": "device1" }, \
        "00:00:00:00:00:11": { "topic": "device2", "key": "" }, \
        "0f:0e:0d:0c:0b:0a": { "topic": "device3", "key": [] }, \
        "00:00:00:00:00:22": { "topic": "device4", "key": "--------------------------------" }, \
        "00:01:02:03:04:05": { "topic": "device5", "key": "00112233445566778899AABBCCDDEEFF" }, \
        "00:10:20:30:40:50": { "topic": "device6", "key": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] } }';
    let flow = [{ id: "n1", type: "bthome", name: "test", devices:devicesJson, z:"flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        let d = n1.devices;
        d.should.be.an.Object();
        function testDevice(dev,topic,key)
        {
          d.should.have.a.property(dev);
          d[dev].should.be.an.Object();
          d[dev].should.have.a.property("topic",topic);
          if( key )
          {
            d[dev].should.have.a.property("key",key);
          }
          else
          {
            d[dev].should.not.have.a.property("key");
          }
        }
        testDevice("11:22:33:44:55:66","device1");
        testDevice("00:00:00:00:00:11","device2",Buffer.alloc(16));
        testDevice("0f:0e:0d:0c:0b:0a","device3",Buffer.alloc(0));
        testDevice("00:00:00:00:00:22","device4",Buffer.alloc(16));
        testDevice("00:01:02:03:04:05","device5",Buffer.from([0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,0x88,0x99,0xAA,0xBB,0xCC,0xDD,0xEE,0xFF]));
        testDevice("00:10:20:30:40:50","device6",Buffer.from([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]));
        await delay(50);
        n1.log.should.have.callCount(2);
        n1.should.have.a.property('data', {} );
        should.not.exist( n1.context().flow.get("bthome") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  const testDevices = '{ \
    "11:22:33:44:55:66": { "topic": "dev_unencrypted_1" }, \
    "00:01:02:03:04:05": { "topic": "dev_unencrypted_2" }, \
    "00:10:20:30:40:50": { "topic": "dev_encrypted_1", "key": "00112233445566778899AABBCCDDEEFF" }, \
    "00:00:00:00:00:00": { "topic": "dev_encrypted_2", "key": [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16] } }';

  function checkData(data,t,pid,gw,tests=null)
  {
    data.should.be.an.Object();
    data.should.have.a.property(t);
    const v = data[t];
    v.should.be.an.Object();
    v.should.have.a.property("pid",pid)
    v.should.have.a.property("gw").which.is.an.Object();
    if( gw )
    {
      v.gw.should.have.a.property(gw).which.is.an.Object();
      v.gw[gw].should.have.a.property("time").which.is.approximately(Date.now()-45,15);
      v.gw[gw].should.have.a.property("rssi").which.is.within(-100,-40);
    }
    if( pid )
    {
      v.should.have.a.property("encyrpted").whitch.is.Boolean();
      v.should.have.a.property("time").which.is.approximately(Date.now()-45,15);
    }
    if( tests )
    {
      v.should.have.a.property("data").which.is.an.Object();
      for( const i in tests )
      {
        v.data.should.have.a.property(i,tests[i]);
      }
    }
  }

  it('should ignore invalid input', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        c1++;
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {} }); // empty payload
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:FF",
          rssi:    -50,
          time:    Date.now(),
        } }); // no data
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    0x24
        } }); // data not an array
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } }); // no addr
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:FF",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } }); // unknow mac
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [0x24,0,54,1,94,46,57,69,125,0]
        } }); // version 1
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [0x64,0,54,1,94,46,57,69,125,0]
        } }); // version 3
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(7);
        n1.trace.should.have.callCount(7);
        n1.should.have.a.property('data', {} );
        c1.should.match( 0 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted messages', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        try {
          c1++;
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          c2++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } });
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "2nd",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } }); // 2nd gateway
        await delay(50);
        checkData(n1.data,"dev_unencrypted_1",null,"UnitTest");
        checkData(n1.data,"dev_unencrypted_1",null,"2nd");
        //c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          addr:    "00:01:02:03:04:05",
          data:    [68,0,55,1,94,46,57,69,125,0]
        } }); // basic data
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.trace.should.have.callCount(3);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_2",null,null);
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
