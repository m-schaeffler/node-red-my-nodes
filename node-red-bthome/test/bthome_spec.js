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
        n1.should.have.a.property('data', {} );
        should.not.exist( n1.context().flow.get("bthome") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
