var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../logic_timerelay.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'logic_timerrelay Node', function () {
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
    var flow = [{ id: "n1", type: "timerelay", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('delay', 0);
        n1.should.have.a.property('postrun', 0);
        n1.should.have.a.property('minOn', 0);
        n1.should.have.a.property('maxOn', 0);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward and filter bool values', function (done) {
    const numbers = [false,0,"0","false","off",true,1,"1","true","on"];
    var flow = [{ id: "n1", type: "timerelay", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',Boolean(c));
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
          await delay(50);
        }
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "timerelay", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        n1.receive({ invalid:true, payload: false });
        await delay(50);
        n1.receive({ invalid:true, payload: true });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: NaN });
        await delay(50);
        n1.receive({ payload: null });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: true });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not have any delays', function (done) {
    var flow = [{ id: "n1", type: "timerelay", delay:0, postrun:0, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',Boolean(c%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('delay', 0);
        n1.should.have.a.property('postrun', 0);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 2 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 3 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 4 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should delay switching on', function (done) {
    var flow = [{ id: "n1", type: "timerelay", delay:250, postrun:0, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c<3 ? Boolean(c%2) : false);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('delay', 250);
        n1.should.have.a.property('postrun', 0);
        await delay(50);
        // normal
        n1.receive({ payload: 1 });
        await delay(225);
        c.should.match( 0 );
        await delay(50);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 2 );
        // change of mind
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 2 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 3 );
        await delay(250);
        c.should.match( 3 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should delay switching off', function (done) {
    var flow = [{ id: "n1", type: "timerelay", delay:0, postrun:250, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c<4 ? Boolean(c%2) : true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('delay', 0);
        n1.should.have.a.property('postrun', 250);
        await delay(50);
        // normal
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(225);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        // change of mind
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 3 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 3 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 4 );
        await delay(250);
        c.should.match( 4 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should delay switching on and off', function (done) {
    var flow = [{ id: "n1", type: "timerelay", delay:250, postrun:250, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',Boolean(c%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('delay', 250);
        n1.should.have.a.property('postrun', 250);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(225);
        c.should.match( 0 );
        await delay(50);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(225);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not have max on time', function (done) {
    var flow = [{ id: "n1", type: "timerelay", maxOn:150, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',Boolean(c%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('maxOn', 150);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 2 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 3 );
        await delay(75);
        c.should.match( 3 );
        await delay(50);
        c.should.match( 4 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 5 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 6 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 7 );
        await delay(75);
        c.should.match( 7 );
        await delay(50);
        c.should.match( 8 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 8 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not have min on time', function (done) {
    var flow = [{ id: "n1", type: "timerelay", minOn:150, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',Boolean(c%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minOn', 150);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 1 );
        await delay(200);
        c.should.match( 1 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 2 );
        n1.receive({ payload: 1 });
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 3 );
        await delay(75);
        c.should.match( 3 );
        await delay(50);
        c.should.match( 4 );
        n1.receive({ payload: 1 });
        await delay(50);
        c.should.match( 5 );
        await delay(200);
        c.should.match( 5 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 6 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "timerelay", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',false);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        //n1.should.have.a.property('propertyType', "msg");
        await delay(50);
        n1.receive({ payload: {a:1,value:false,b:88} });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

/*
  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "tobool", name: "test", property:"payload=5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',true);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload=5");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: 5 });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
*/

});
