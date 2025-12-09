var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../ws90.js");

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
    let flow = [{ id: "n1", type: "ws90", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('contextStore', "none");
        n1.should.have.a.property('refheight', 0);
        n1.should.have.a.property('timebase', 60000);
        await delay(50);
        n1.should.have.a.property('storage', {RegenHeute: 0, RegenGestern: 0, WindMax: 0} );
        should.not.exist( n1.context().get("storage") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should ignore invalid input', function (done) {
    let flow = [{ id: "n1", type: "ws90", refheight:"500", name: "test", wires: [["n2"],["n3"],["n4"],["n5"],["n6"],["n7"],["n8"],["n9"],["n10"],["n11"],["n12"],["n13"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "n6", type: "helper", z: "flow" },
                { id: "n7", type: "helper", z: "flow" },
                { id: "n8", type: "helper", z: "flow" },
                { id: "n9", type: "helper", z: "flow" },
                { id: "n10", type: "helper", z: "flow" },
                { id: "n11", type: "helper", z: "flow" },
                { id: "n12", type: "helper", z: "flow" },
                { id: "n13", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");
      let n5 = helper.getNode("n5");
      let n6 = helper.getNode("n6");
      let n7 = helper.getNode("n7");
      let n8 = helper.getNode("n8");
      let n9 = helper.getNode("n9");
      let n10 = helper.getNode("n10");
      let n11 = helper.getNode("n11");
      let n12 = helper.getNode("n12");
      let n13 = helper.getNode("n13");
      let c = [0,0,0,0,0,0,0,0,0,0,0,0];
      n2.on("input", function (msg) {
        c[0]++;
      });
      n3.on("input", function (msg) {
        c[1]++;
      });
      n4.on("input", function (msg) {
        c[2]++;
      });
      n5.on("input", function (msg) {
        c[3]++;
      });
      n6.on("input", function (msg) {
        c[4]++;
      });
      n7.on("input", function (msg) {
        c[5]++;
      });
      n8.on("input", function (msg) {
        c[6]++;
      });
      n9.on("input", function (msg) {
        c[7]++;
      });
      n10.on("input", function (msg) {
        c[8]++;
      });
      n11.on("input", function (msg) {
        c[9]++;
      });
      n12.on("input", function (msg) {
        c[10]++;
      });
      n13.on("input", function (msg) {
        c[11]++;
      });
      try {
        n1.should.have.a.property('contextStore', "none");
        n1.should.have.a.property('refheight', 500);
        n1.should.have.a.property('timebase', 60000);
        await delay(50);
        n1.receive( { topic:"WS90", invalid:true, payload:{ temperature:20} });
        n1.receive( { topic:"WS90" });
        n1.receive( { topic:"WS90", payload:25 });
        n1.receive( { topic:"WS90", payload:{ foobar:25 } });
        await delay(50);
        for( const i of c )
        {
            i.should.match( 0 );
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(3);
        n1.should.have.a.property('storage', {RegenHeute: 0, RegenGestern: 0, WindMax: 0} );
        should.not.exist( n1.context().get("storage") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should process data', function (done) {
    this.timeout( 5000 );
    const temp      = [11.425, 24];
    const dewPoint  = [10.24, 15];
    const humidity  = [92, 40];
    const rainToday = [0, 1.2, 1.2];
    const uv        = [2, 6];
    const uvClass   = ["greenValue", "redValue"];
    const air       = [1016.1804342610798, 1037.379594212174];
    const windDir   = [167, 0];
    const wind      = [10.08, 0, 11.16];
    const windMax   = [10.08, 11.16];
    const illuminat = [8920, 0];
    let flow = [{ id: "n1", type: "ws90", refheight:"500", timebase:"0.1", name: "test", wires: [["n2"],["n3"],["n4"],["n5"],["n6"],["n7"],["n8"],["n9"],["n10"],["n11"],["n12"],["n13"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "n6", type: "helper", z: "flow" },
                { id: "n7", type: "helper", z: "flow" },
                { id: "n8", type: "helper", z: "flow" },
                { id: "n9", type: "helper", z: "flow" },
                { id: "n10", type: "helper", z: "flow" },
                { id: "n11", type: "helper", z: "flow" },
                { id: "n12", type: "helper", z: "flow" },
                { id: "n13", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");
      let n5 = helper.getNode("n5");
      let n6 = helper.getNode("n6");
      let n7 = helper.getNode("n7");
      let n8 = helper.getNode("n8");
      let n9 = helper.getNode("n9");
      let n10 = helper.getNode("n10");
      let n11 = helper.getNode("n11");
      let n12 = helper.getNode("n12");
      let n13 = helper.getNode("n13");
      let c = [0,0,0,0,0,0,0,0,0,0,0,0];
      n2.on("input", function (msg) {
        c[0]++;
        msg.should.have.a.property('topic','outside temperature');
        msg.should.have.a.property('payload',temp[c[0]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n3.on("input", function (msg) {
        c[1]++;
        msg.should.have.a.property('topic','dew point');
        msg.should.have.a.property('payload',dewPoint[c[1]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n4.on("input", function (msg) {
        c[2]++;
        msg.should.have.a.property('topic','humidity');
        msg.should.have.a.property('payload',humidity[c[2]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n5.on("input", function (msg) {
        c[3]++;
        msg.should.have.a.property('topic','raining');
        msg.should.have.a.property('payload',c[3]==1);
        msg.should.not.have.a.property('ui_update');
      });
      n6.on("input", function (msg) {
        c[4]++;
        msg.should.have.a.property('topic','rain yesterday');
        msg.should.have.a.property('payload',0);
        msg.should.not.have.a.property('ui_update');
      });
      n7.on("input", function (msg) {
        c[5]++;
        msg.should.have.a.property('topic','rain today');
        msg.should.have.a.property('payload').which.is.approximately(rainToday[c[5]-1],0.00001);
        msg.should.have.a.property('ui_update', { class: c[5]<=2?'blueValue':'' } );
      });
      n8.on("input", function (msg) {
        c[6]++;
        msg.should.have.a.property('topic','uv index');
        msg.should.have.a.property('payload',uv[c[6]-1]);
        msg.should.have.a.property('ui_update', { class: uvClass[c[6]-1] } );
      });
      n9.on("input", function (msg) {
        c[7]++;
        msg.should.have.a.property('topic','air pressure');
        msg.should.have.a.property('payload',air[c[7]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n10.on("input", function (msg) {
        c[8]++;
        msg.should.have.a.property('topic','wind direction');
        msg.should.have.a.property('payload',windDir[c[8]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n11.on("input", function (msg) {
        c[9]++;
        msg.should.have.a.property('topic','wind');
        msg.should.have.a.property('payload',wind[c[9]-1]);
        msg.should.have.a.property('ui_update', { class: '' } );
      });
      n12.on("input", function (msg) {
        c[10]++;
        msg.should.have.a.property('topic','wind_max');
        msg.should.have.a.property('payload',windMax[c[10]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      n13.on("input", function (msg) {
        c[11]++;
        msg.should.have.a.property('topic','illumination');
        msg.should.have.a.property('payload',illuminat[c[11]-1]);
        msg.should.not.have.a.property('ui_update');
      });
      try {
        n1.should.have.a.property('contextStore', "none");
        n1.should.have.a.property('refheight', 500);
        n1.should.have.a.property('timebase', 100);
        await delay(50);
        // first message
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:true,wind:[2.8,2.8],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        // second message with some rain
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:true,wind:[2.8,2.8],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,2,1,1,1,1,1,1] );
        // dry
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[2.8,2.8],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,3,1,1,1,1,1,1] );
        // not raining
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[2.8,2.8],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(1750);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,3,1,1,1,1,1,1] );
        await delay(200);
        c.should.match( [1,1,1,1,1,3,1,1,1,1,1,1] );
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[2.8,2.8],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,2,1,3,1,1,1,1,1,1] );
        // no wind
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[2.8,0],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,2,1,3,1,1,1,2,1,1] );
        // more wind
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[2.8,3.1],uv:2,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,2,1,3,1,1,1,3,2,1] );
        // others different
        n1.receive( { topic:"WS90", payload:{lux:0,moisture:false,wind:[2.8,3.1],uv:6,direction:0,pressure:980,dewpoint:15,humidity:40,temperature:24,precipitation:1235.2} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [2,2,2,2,1,3,2,2,2,3,2,2] );
        n1.should.have.a.property('storage');
        should.not.exist( n1.context().get("storage") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
  
  
  
  it('should process raining without rain', function (done) {
    this.timeout( 5000 );
    let flow = [{ id: "n1", type: "ws90", refheight:"500", timebase:"0.1", name: "test", wires: [["n2"],["n3"],["n4"],["n5"],["n6"],["n7"],["n8"],["n9"],["n10"],["n11"],["n12"],["n13"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "n6", type: "helper", z: "flow" },
                { id: "n7", type: "helper", z: "flow" },
                { id: "n8", type: "helper", z: "flow" },
                { id: "n9", type: "helper", z: "flow" },
                { id: "n10", type: "helper", z: "flow" },
                { id: "n11", type: "helper", z: "flow" },
                { id: "n12", type: "helper", z: "flow" },
                { id: "n13", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");
      let n5 = helper.getNode("n5");
      let n6 = helper.getNode("n6");
      let n7 = helper.getNode("n7");
      let n8 = helper.getNode("n8");
      let n9 = helper.getNode("n9");
      let n10 = helper.getNode("n10");
      let n11 = helper.getNode("n11");
      let n12 = helper.getNode("n12");
      let n13 = helper.getNode("n13");
      let c = [0,0,0,0,0,0,0,0,0,0,0,0];
      n2.on("input", function (msg) {
        c[0]++;
        msg.should.have.a.property('topic','outside temperature');
        msg.should.have.a.property('payload',11.425);
        msg.should.not.have.a.property('ui_update');
      });
      n3.on("input", function (msg) {
        c[1]++;
        msg.should.have.a.property('topic','dew point');
        msg.should.have.a.property('payload',10.24);
        msg.should.not.have.a.property('ui_update');
      });
      n4.on("input", function (msg) {
        c[2]++;
        msg.should.have.a.property('topic','humidity');
        msg.should.have.a.property('payload',92);
        msg.should.not.have.a.property('ui_update');
      });
      n5.on("input", function (msg) {
        c[3]++;
        msg.should.have.a.property('topic','raining');
        msg.should.have.a.property('payload',c[3]==1);
        msg.should.not.have.a.property('ui_update');
      });
      n6.on("input", function (msg) {
        c[4]++;
        msg.should.have.a.property('topic','rain yesterday');
        msg.should.have.a.property('payload',0);
        msg.should.not.have.a.property('ui_update');
      });
      n7.on("input", function (msg) {
        c[5]++;
        msg.should.have.a.property('topic','rain today');
        msg.should.have.a.property('payload',0);
        msg.should.have.a.property('ui_update', { class: c[5]<=2?'blueValue':'' } );
      });
      n8.on("input", function (msg) {
        c[6]++;
        msg.should.have.a.property('topic','uv index');
        msg.should.have.a.property('payload',5);
        msg.should.have.a.property('ui_update', { class: "yellowValue" } );
      });
      n9.on("input", function (msg) {
        c[7]++;
        msg.should.have.a.property('topic','air pressure');
        msg.should.have.a.property('payload',1016.1804342610798);
        msg.should.not.have.a.property('ui_update');
      });
      n10.on("input", function (msg) {
        c[8]++;
        msg.should.have.a.property('topic','wind direction');
        msg.should.have.a.property('payload',167);
        msg.should.not.have.a.property('ui_update');
      });
      n11.on("input", function (msg) {
        c[9]++;
        msg.should.have.a.property('topic','wind');
        msg.should.have.a.property('payload',72);
        msg.should.have.a.property('ui_update', { class: 'redValue' } );
      });
      n12.on("input", function (msg) {
        c[10]++;
        msg.should.have.a.property('topic','wind_max');
        msg.should.have.a.property('payload',72;
        msg.should.not.have.a.property('ui_update');
      });
      n13.on("input", function (msg) {
        c[11]++;
        msg.should.have.a.property('topic','illumination');
        msg.should.have.a.property('payload',8920);
        msg.should.not.have.a.property('ui_update');
      });
      try {
        n1.should.have.a.property('contextStore', "none");
        n1.should.have.a.property('refheight', 500);
        n1.should.have.a.property('timebase', 100);
        await delay(50);
        // first message
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:true,wind:[20,20],uv:5,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        // dry
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[20,20],uv:5,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        await delay(1250);
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[20,20],uv:5,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        await delay(200);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[20,20],uv:5,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,2,1,1,1,1,1,1,1,1] );
        n1.should.have.a.property('storage');
        should.not.exist( n1.context().get("storage") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
  
  it('should have reset command', function (done) {
    let flow = [{ id: "n1", type: "ws90", refheight:"500", name: "test", wires: [["n2"],["n3"],["n4"],["n5"],["n6"],["n7"],["n8"],["n9"],["n10"],["n11"],["n12"],["n13"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" },
                { id: "n6", type: "helper", z: "flow" },
                { id: "n7", type: "helper", z: "flow" },
                { id: "n8", type: "helper", z: "flow" },
                { id: "n9", type: "helper", z: "flow" },
                { id: "n10", type: "helper", z: "flow" },
                { id: "n11", type: "helper", z: "flow" },
                { id: "n12", type: "helper", z: "flow" },
                { id: "n13", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let n4 = helper.getNode("n4");
      let n5 = helper.getNode("n5");
      let n6 = helper.getNode("n6");
      let n7 = helper.getNode("n7");
      let n8 = helper.getNode("n8");
      let n9 = helper.getNode("n9");
      let n10 = helper.getNode("n10");
      let n11 = helper.getNode("n11");
      let n12 = helper.getNode("n12");
      let n13 = helper.getNode("n13");
      let c = [0,0,0,0,0,0,0,0,0,0,0,0];
      n2.on("input", function (msg) {
        c[0]++;
        msg.should.have.a.property('topic','outside temperature');
        msg.should.have.a.property('payload',11.425);
        msg.should.not.have.a.property('ui_update');
      });
      n3.on("input", function (msg) {
        c[1]++;
        msg.should.have.a.property('topic','dew point');
        msg.should.have.a.property('payload',10.24);
        msg.should.not.have.a.property('ui_update');
      });
      n4.on("input", function (msg) {
        c[2]++;
        msg.should.have.a.property('topic','humidity');
        msg.should.have.a.property('payload',92);
        msg.should.not.have.a.property('ui_update');
      });
      n5.on("input", function (msg) {
        c[3]++;
        msg.should.have.a.property('topic','raining');
        msg.should.have.a.property('payload',false);
        msg.should.not.have.a.property('ui_update');
      });
      n6.on("input", function (msg) {
        c[4]++;
        msg.should.have.a.property('topic','rain yesterday');
        msg.should.have.a.property('payload',0);
        msg.should.not.have.a.property('ui_update');
      });
      n7.on("input", function (msg) {
        c[5]++;
        msg.should.have.a.property('topic','rain today');
        msg.should.have.a.property('payload',0);
        msg.should.have.a.property('ui_update', { class: '' } );
      });
      n8.on("input", function (msg) {
        c[6]++;
        msg.should.have.a.property('topic','uv index');
        msg.should.have.a.property('payload',3);
        msg.should.have.a.property('ui_update', { class: "yellowValue" } );
      });
      n9.on("input", function (msg) {
        c[7]++;
        msg.should.have.a.property('topic','air pressure');
        msg.should.have.a.property('payload',1016.1804342610798);
        msg.should.not.have.a.property('ui_update');
      });
      n10.on("input", function (msg) {
        c[8]++;
        msg.should.have.a.property('topic','wind direction');
        msg.should.have.a.property('payload',167);
        msg.should.not.have.a.property('ui_update');
      });
      n11.on("input", function (msg) {
        c[9]++;
        msg.should.have.a.property('topic','wind');
        msg.should.have.a.property('payload',36);
        msg.should.have.a.property('ui_update', { class: 'yellowValue' } );
      });
      n12.on("input", function (msg) {
        c[10]++;
        msg.should.have.a.property('topic','wind_max');
        msg.should.have.a.property('payload',36);
        msg.should.not.have.a.property('ui_update');
      });
      n13.on("input", function (msg) {
        c[11]++;
        msg.should.have.a.property('topic','illumination');
        msg.should.have.a.property('payload',8920);
        msg.should.not.have.a.property('ui_update');
      });
      try {
        n1.should.have.a.property('contextStore', "none");
        n1.should.have.a.property('refheight', 500);
        await delay(50);
        // first message
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[10,10],uv:3,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        // second message
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[10,10],uv:3,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [1,1,1,1,1,1,1,1,1,1,1,1] );
        // third message
        n1.receive( { reset: true } );
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[10,10],uv:3,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [2,2,2,2,2,2,2,2,2,2,2,2] );
        // 4th message
        n1.receive( { topic:"WS90", payload:{lux:8920,moisture:false,wind:[10,10],uv:3,direction:167,pressure:957.6,dewpoint:10.24,humidity:92,temperature:11.425,precipitation:1234} } );
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( [2,2,2,2,2,2,2,2,2,2,2,2] );
        n1.should.have.a.property('storage');
        should.not.exist( n1.context().get("storage") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
/*
  it('should not store into a context variable', function (done) {
    let flow = [{ id:'flow', type:'tab' },
                { id: "n1", type: "bthome", name: "test", contextVar:"shellyBlu", contextStore:"none", devices:testDevices, batteryState:true, wires: [["n2"],["n3"]], z:"flow" },
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
        n1.should.have.a.property('batteryState', true);
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
        n1.data.should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false},"UnitTest",{temperature:12.5,humidity:57,battery:94});
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
        n1.data.should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false},"UnitTest",{temperature:12.5,humidity:57,battery:90});
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
                { id: "n1", type: "bthome", name: "test", contextVar:"shellyBlu", contextStore:"memory", batteryState:false, devices:testDevices, wires: [["n2"],["n3"]], z:"flow" },
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
        n1.should.have.a.property('batteryState', false);
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
        n1.data.should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
        n1.context().flow.get("shellyBlu").should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:94},"UnitTest",{temperature:12.5,humidity:57});
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
        n1.data.should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:94},null,{temperature:12.5,humidity:57});
        n1.context().flow.get("shellyBlu").should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:94},null,{temperature:12.5,humidity:57});
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
        n1.data.should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:90},null,{temperature:12.5,humidity:57});
        n1.context().flow.get("shellyBlu").should.have.ValidData("dev_unencrypted_1",{pid:54,encrypted:false,battery:90},null,{temperature:12.5,humidity:57});
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
*/
});
