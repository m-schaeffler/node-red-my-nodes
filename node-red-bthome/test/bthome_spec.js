var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../bthome.js");
var Encrypt= require( './encrypt.js' );
require("./encrypt_spec.js");

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
        n1.should.have.a.property('counterMode', "none");
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.should.have.a.property('statistics',{ok:0,err:0,old:0,dup:0});
        should.not.exist( n1.context().flow.get("bthome") );
        should.not.exist( n1.context().flow.get("bthome-stat") );
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
            d[dev].should.have.a.property("key",null);
          }
        }
        testDevice("11:22:33:44:55:66","device1");
        testDevice("00:00:00:00:00:11","device2");
        testDevice("0f:0e:0d:0c:0b:0a","device3",Buffer.alloc(0));
        testDevice("00:00:00:00:00:22","device4",Buffer.alloc(16));
        testDevice("00:01:02:03:04:05","device5",Buffer.from([0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,0x88,0x99,0xAA,0xBB,0xCC,0xDD,0xEE,0xFF]));
        testDevice("00:10:20:30:40:50","device6",Buffer.from([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]));
        await delay(50);
        n1.log.should.have.callCount(2);
        n1.should.have.a.property('data', {} );
        should.not.exist( n1.context().flow.get("bthome") );
        should.not.exist( n1.context().flow.get("bthome-stat") );
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

  function checkData(data,t,values,gw,tests=null)
  {
    data.should.be.an.Object();
    data.should.have.a.property(t);
    const v = data[t];
    v.should.be.an.Object();
    v.should.have.a.property("pid").which.is.a.Number();
    v.should.have.a.property("gw").which.is.an.Object();
    if( gw )
    {
      v.should.have.a.property("time").which.is.approximately(Date.now()-50,20);
      v.gw.should.have.a.property(gw).which.is.an.Object();
      v.gw[gw].should.have.a.property("time").which.is.approximately(Date.now()-50,20);
      v.gw[gw].should.have.a.property("rssi").which.is.within(-100,-40);
    }
    if( values )
    {
      for( const i in values )
      {
        v.should.have.a.property(i,values[i]);
      }
    }
    if( tests )
    {
      v.should.have.a.property("data").which.is.an.Object();
      for( const i in tests )
      {
        v.data.should.have.a.property(i,tests[i]);
      }
    }
    else
    {
      v.should.not.have.a.property("data");
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
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
        } }); // empty payload
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
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } }); // not encrypted with key
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,0,54,1,94,46,57,69,125,0]
        } }); // encrypted without key
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(9);
        n1.should.have.a.property('data', {} );
        n1.should.have.a.property('statistics',{ok:0,err:9,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode version messages', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", statusPrefix:"", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        n1.should.have.a.property('statusPrefix', "");
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
          data:    [68,0,1,1,94,0xF0,1,2,0xF1,1,2,3,4]
        } });
        await delay(50);
        checkData(n1.data,"dev_unencrypted_1",{pid:1,encrypted:false,battery:94,typeId:0x201,version:{sub:1,patch:2,minor:3,major:4}},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:01:02:03:04:05",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,1,1,94,0xF0,1,2,0xF2,2,3,4]
        } });
        await delay(50);
        checkData(n1.data,"dev_unencrypted_2",{pid:1,encrypted:false,battery:94,typeId:0x201,version:{patch:2,minor:3,major:4}},"UnitTest");
        n1.should.have.a.property('statistics',{ok:2,err:0,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted messages (Shelly HT)', function (done) {
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
          switch( c1 )
          {
            case 1:
            case 3:
              msg.should.have.a.property('topic','dev_unencrypted_1');
              msg.should.have.a.property('payload',{ humidity: 57, temperature: 12.5 });
              break;
            case 2:
              msg.should.have.a.property('topic','dev_unencrypted_2');
              msg.should.have.a.property('payload',{ humidity: 75, temperature: -5.5 });
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "");
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
          data:    [68,0,1,0xF0,3,2]
        } });
        await delay(50);
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
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        checkData(n1.data,"dev_unencrypted_1",{},"2nd",{});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          addr:    "00:01:02:03:04:05",
          data:    [68,0,54,1,94,46,75,69,201,255]
        } }); // basic data
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_2",{pid:54,encrypted:false,battery:94},null,{temperature:-5.5,humidity:75});
        c1.should.match( 2 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -80,
          time:    Date.now(),
          data:    [68,0,24,1,4,46,75,69,201,255]
        } }); // old data
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:54},null,{});
        c1.should.match( 2 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,1,1,94,46,57,69,125,0]
        } }); // reboot
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:1,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        c1.should.match( 3 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,1,94,46,57,69,125,0]
        } }); // no pid
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:1},null,{});
        n1.should.have.a.property('statistics',{ok:4,err:0,old:1,dup:2});
        c1.should.match( 3 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted messages (Shelly DW)', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", statusPrefix:"State", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
          msg.should.have.a.property('topic','State/dev_unencrypted_1');
          msg.should.have.a.property('payload',{ lux: 660.51, state: c1==1, tilt: 6 });
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "State/");
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
          data:    [68,0,1,0xF0,2,2]
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,128,5,3,2,1,0x2D,1,0x3F,60,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:128,encrypted:false},"UnitTest",{lux:660.51,state:true,tilt:6});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,129,1,10,0x2D,0,0xFF,5,5,5,5,5,5,5,6,7,8,9,10]
         } }); // unknown data
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:129,encrypted:false,battery:10},"UnitTest",{lux:660.51,state:false,tilt:6});
        n1.should.have.a.property('statistics',{ok:3,err:0,old:0,dup:0});
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted messages (Shelly Distance)', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", statusPrefix:"State", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
          msg.should.have.a.property('topic','State/dev_unencrypted_1');
          msg.should.have.a.property('payload',{ distance: c1==1?13330:801, vibration: c1==2 });
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "State/");
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
          data:    [68,0,1,0xF0,255,2] // tbds
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,2,1,50,0x2c,0,0x40,0x12,0x34]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:2,encrypted:false,battery:50},"UnitTest",{distance:13330,vibration:false});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,3,1,45,0x2c,1,0x40,0x21,0x3]
         } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:3,encrypted:false,battery:45},"UnitTest",{distance:801,vibration:true});
        n1.should.have.a.property('statistics',{ok:3,err:0,old:0,dup:0});
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted messages (Shelly Weather)', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", statusPrefix:"State", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
          msg.should.have.a.property('topic','State/dev_unencrypted_1');
          switch( c1 )
          {
            case 1:
              msg.should.have.a.property('payload',{
                lux: 13460.67,
                rain: true,
                wind: [ 11.02, 133.9 ],
                uv: 12.8,
                direction: 359.99
              });
              break;
            case 2:
              msg.should.have.a.property('payload',{
                lux: 13460.67,
                rain: true,
                wind: [ 11.02, 133.9 ],
                uv: 12.8,
                direction: 359.99,
                pressure: 1008.83,
                dewpoint: 17.38,
                voltage: 3.074,
                humidity: 55,
                temperature: 27.3,
                precipitation: 400
              });
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "State/");
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
          data:    [68,0,1,0xF0,255,2] // tbds
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,2,0x05,0x13,0x8A,0x14,0x20,1,0x44,0x4E,0x04,0x44,0x4E,0x34,0x46,128,0x5E,0x9F,0x8C]
        } }); // packet type 1
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:2,encrypted:false},"UnitTest",{
          lux: 13460.67,
          rain: true,
          wind: [ 11.02, 133.9 ],
          uv: 12.8,
          direction: 359.99
        });
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,3,1,45,0x04,0x13,0x8A,0x01,0x08,0xCA,0x06,0x0C,0x02,0x0C,0x2E,55,0x45,0x11,0x01,0x5F,0xA0,0x0F]
         } }); // packet type 2
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:3,encrypted:false,battery:45},"UnitTest",{
          lux: 13460.67,
          rain: true,
          wind: [ 11.02, 133.9 ],
          uv: 12.8,
          direction: 359.99,
          pressure: 1008.83,
          dewpoint: 17.38,
          voltage: 3.074,
          humidity: 55,
          temperature: 27.3,
          precipitation: 400
        });
        n1.should.have.a.property('statistics',{ok:3,err:0,old:0,dup:0});
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted events (Shelly Button)', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", eventPrefix:"EP", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        try {
          c2++;
          //console.log(msg);
          switch( c2 )
          {
            case 1:
              msg.should.have.a.property('topic','EP/dev_unencrypted_1/S');
              msg.should.have.a.property('payload',{type:'button',event:'S'});
              break;
            case 2:
              msg.should.have.a.property('topic','EP/dev_unencrypted_1/L');
              msg.should.have.a.property('payload',{type:'button',event:'L'});
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('eventPrefix', "EP/");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,0,0xF0,1,2]
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,1,0x3A,0x80]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:1},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,2,0x3A,1]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:2},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 1 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,3,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:3},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 1 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,4,0x3A,4]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:4},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 2 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,5,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:5},"UnitTest");
        n1.should.have.a.property('statistics',{ok:6,err:0,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted events (Shelly Button 4)', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", eventPrefix:"", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        try {
          c2++;
          //console.log(msg);
          switch( c2 )
          {
            case 1:
              msg.should.have.a.property('topic','dev_unencrypted_1/1/S');
              msg.should.have.a.property('payload',{type:'button',event:'S',id:1});
              break;
            case 2:
              msg.should.have.a.property('topic','dev_unencrypted_1/2/SS');
              msg.should.have.a.property('payload',{type:'button',event:'SS',id:2});
              break;
            case 3:
              msg.should.have.a.property('topic','dev_unencrypted_1/3/SSS');
              msg.should.have.a.property('payload',{type:'button',event:'SSS',id:3});
              break;
            case 4:
              msg.should.have.a.property('topic','dev_unencrypted_1/4/L');
              msg.should.have.a.property('payload',{type:'button',event:'L',id:4});
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,0,0xF0,6,2]
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,1,0x3A,1,0x3A,0,0x3A,0,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:1},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 1 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,2,0x3A,0,0x3A,2,0x3A,0,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:2},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 2 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,3,0x3A,0,0x3A,0,0x3A,3,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:3},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 3 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,4,0x3A,0,0x3A,0,0x3A,0,0x3A,4]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:4},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 4 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,5,0x3A,0,0x3A,0,0x3A,0,0x3A,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:5},"UnitTest");
        n1.should.have.a.property('statistics',{ok:6,err:0,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode unencrypted events (Shelly Motion)', function (done) {
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
        try {
          c2++;
          //console.log(msg);
          msg.should.have.a.property('topic','dev_unencrypted_1/motion');
          msg.should.have.a.property('payload',{type:'motion',event:'motion'});
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
          data:    [68,0,0,0xF0,5,2]
        } });
        await delay(50);
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,1,0x21,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:1},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,2,0x21,1]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:2},"UnitTest");
        c1.should.match( 0 );
        c2.should.match( 1 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,3,0x21,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:3},"UnitTest");
        n1.should.have.a.property('statistics',{ok:4,err:0,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not store into a context variable', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", contextVar:"shellyBlu", contextStore:"none", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "shellyBlu");
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
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        n1.should.have.a.property('statistics',{ok:1,err:0,old:0,dup:0});
        should.not.exist( n1.context().flow.get("shellyBlu") );
        c1.should.match( 1 );
        c2.should.match( 0 );
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        n3 = helper.getNode("n3");
        n2.on("input", function (msg) {
          c1++;
        });
        n3.on("input", function (msg) {
          c2++;
        });
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "shellyBlu");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        should.not.exist( n1.context().flow.get("shellyBlu") );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,90,46,57,69,125,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:90},"UnitTest",{temperature:12.5,humidity:57});
        n1.should.have.a.property('statistics',{ok:1,err:0,old:0,dup:0});
        should.not.exist( n1.context().flow.get("shellyBlu") );
        should.not.exist( n1.context().flow.get("shellyBlu-stat") );
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should store into a context variable', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", contextVar:"shellyBlu", contextStore:"memory", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "shellyBlu");
        n1.should.have.a.property('contextStore', "memory");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,94,46,57,69,125,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        checkData(n1.context().flow.get("shellyBlu"),"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        n1.should.have.a.property('statistics',{ok:1,err:0,old:0,dup:0});
        c1.should.match( 1 );
        c2.should.match( 0 );
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n1 = helper.getNode("n1");
        n2 = helper.getNode("n2");
        n3 = helper.getNode("n3");
        n2.on("input", function (msg) {
          c1++;
        });
        n3.on("input", function (msg) {
          c2++;
        });
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('devices');
        n1.should.have.a.property('contextVar', "shellyBlu");
        n1.should.have.a.property('contextStore', "memory");
        await delay(50);
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},null,{temperature:12.5,humidity:57});
        checkData(n1.context().flow.get("shellyBlu"),"dev_unencrypted_1",{pid:54,encrypted:false,battery:94},null,{temperature:12.5,humidity:57});
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "11:22:33:44:55:66",
          rssi:    -50,
          time:    Date.now(),
          data:    [68,0,54,1,90,46,57,69,125,0]
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_unencrypted_1",{pid:54,encrypted:false,battery:90},null,{temperature:12.5,humidity:57});
        checkData(n1.context().flow.get("shellyBlu"),"dev_unencrypted_1",{pid:54,encrypted:false,battery:90},null,{temperature:12.5,humidity:57});
        n1.should.have.a.property('statistics',{ok:0,err:0,old:0,dup:1});
        n1.context().flow.get("shellyBlu-stat").should.match( n1.statistics );
        c1.should.match( 1 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode encrypted messages', function (done) {
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
          switch( c1 )
          {
              case 1:
                  msg.should.have.a.property('topic','dev_encrypted_1');
                  msg.should.have.a.property('payload',{ lux: 660.51, state: 1, tilt: 6 });
                  break;
              case 2:
                  msg.should.have.a.property('topic','dev_encrypted_2');
                  msg.should.have.a.property('payload',{ lux: 660.51, state: 0, tilt: 0 });
                  break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('counterMode', "none");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,185,49,198,170,133,200,48,253,111,234,66,0,17,34,51,42,184,90,0] // 69,0,128,5,3,2,1,0x2D,1,0x3F,60,0
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_encrypted_1",{pid:128,encrypted:true},"UnitTest",{lux:660.51,state:1,tilt:6});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:00:00:00:00:00",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,225,109,205,234,202,185,33,132,88,244,81,18,52,86,120,3,120,57,157] // 69,0,255,5,3,2,1,0x2D,0,0x3F,0,0
         } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_encrypted_2",{pid:255,encrypted:true},"UnitTest",{lux:660.51,state:0,tilt:0});
        n1.should.have.a.property('statistics',{ok:2,err:0,old:0,dup:0});
        c1.should.match( 2 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not decode invalid encrypted messages', function (done) {
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
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,186,49,198,170,133,200,48,253,111,234,66,0,17,34,51,42,184,90,0]
        } }); // ciphertext changed
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.data.should.have.a.property('dev_encrypted_1').which.is.an.Object();
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:00:00:00:00:00",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,225,109,205,234,202,185,33,132,88,244,81,18,52,86,120,3,120,57,158]
         } }); // mic changed
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        n1.data.should.have.a.property('dev_encrypted_2').which.is.an.Object();
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:00:00:00:00:00",
          rssi:    -50,
          time:    Date.now(),
          data:    [69,225,109,205,234,202,185,33,132,88,244,81,18,52,68,120,3,120,57,157]
        } }); // counter changed
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(3);
        n1.data.should.have.a.property('dev_encrypted_2').which.is.an.Object();
        n1.should.have.a.property('statistics',{ok:0,err:3,old:0,dup:0});
        c1.should.match( 0 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode encrypted messages, counterMode==time', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", counterMode:"time", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
          msg.should.have.a.property('topic','dev_encrypted_1');
          msg.should.have.a.property('payload',{ lux: 660.51, state: 1, tilt: 6 });
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('counterMode', "time");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            Math.floor( Date.now()/1000 - 60 ),
            '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.data.should.have.a.property('dev_encrypted_1').which.is.an.Object();
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            Math.floor( Date.now()/1000 + 30 ),
            '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        n1.data.should.have.a.property('dev_encrypted_1').which.is.an.Object();
        c1.should.match( 0 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            Math.floor( Date.now()/1000 ),
           '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_encrypted_1",{pid:128,encrypted:true},"UnitTest",{lux:660.51,state:1,tilt:6});
        n1.should.have.a.property('statistics',{ok:1,err:2,old:0,dup:0});
        c1.should.match( 1 );
        c2.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should decode encrypted messages, counterMode==rising', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", counterMode:"rising", devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
          msg.should.have.a.property('topic','dev_encrypted_1');
          msg.should.have.a.property('payload',{ lux: 660.51, state: 1, tilt: 6 });
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        c2++;
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('devices');
        n1.should.have.a.property('counterMode', "rising");
        n1.should.have.a.property('contextVar', "bthome");
        n1.should.have.a.property('contextStore', "none");
        await delay(50);
        n1.should.have.a.property('data', {} );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            512,
            '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data' );
        checkData(n1.data,"dev_encrypted_1",{pid:128,encrypted:true,lastCounter:512},"UnitTest",{lux:660.51,state:1,tilt:6});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,129,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            512,
            '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('data' );
        checkData(n1.data,"dev_encrypted_1",{pid:128,encrypted:true,lastCounter:512},"",{lux:660.51,state:1,tilt:6});
        c1.should.match( 1 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,130,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            513,
           '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_encrypted_1",{pid:130,encrypted:true,lastCounter:513},"UnitTest",{lux:660.51,state:1,tilt:6});
        c1.should.match( 2 );
        c2.should.match( 0 );
        n1.receive({ topic:"Shelly2/NodeRed/bleraw", payload: {
          gateway: "UnitTest",
          addr:    "00:10:20:30:40:50",
          rssi:    -50,
          time:    Date.now(),
          data:    Encrypt.encryptBthome(
            [69,0,131,5,3,2,1,0x2D,1,0x3F,60,0],
            '00:10:20:30:40:50',
            0,
           '00112233445566778899AABBCCDDEEFF'
          )
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        n1.should.have.a.property('data');
        checkData(n1.data,"dev_encrypted_1",{pid:130,encrypted:true,lastCounter:513},"",{lux:660.51,state:1,tilt:6});
        n1.should.have.a.property('statistics',{ok:2,err:2,old:0,dup:0});
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
