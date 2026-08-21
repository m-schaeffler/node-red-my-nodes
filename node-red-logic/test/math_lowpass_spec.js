var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_lowpass.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_lowpass Node', function () {
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
    var flow = [{ id: "n1", type: "lowpass", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('alpha', 0.5);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
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

  it('should caclulate low pass filtered values', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.5,1.75,0.875,0.4375,0.21875,0.609375,1.3046875,2.15234375];
    var flow = [{ id: "n1", type: "lowpass", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload);
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('alpha', 0.5);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have zeroIsZero', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.5,1.75,0,0,0,0.5,1.25,2.125];
    var flow = [{ id: "n1", type: "lowpass", zeroIsZero:true, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload)
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('alpha', 0.5);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', true);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should caclulate low pass values, with reduced decimals', function (done) {
    const numbers = [3,2,1,0,0,0,1,2,3];
    const results = [3,2.5,1.75,0.88,0.44,0.22,0.61,1.3,2.15];
    var flow = [{ id: "n1", type: "lowpass", decimals:"2", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg.payload)
          msg.should.have.property('topic',1);
          msg.should.have.property('payload',results[c]);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('alpha', 0.5);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', 100 );
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:1, payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data in time domain', function (done) {
    var flow = [{ id: "n1", type: "lowpass", filter: "1000", filterUnit:"msec", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(10);
              msg.should.have.a.property('payload',3);
              break;
            case 2:
              delta.should.be.approximately(1100,25);
              msg.should.have.a.property('payload',1.75);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 1000);
        n1.should.have.a.property('filterLongTime', 10000);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 3 });
        await delay(900);
        n1.receive({ payload: 2 });
        await delay(200);
        n1.receive({ payload: 1 });
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

  it('should filter data in value domain', function (done) {
    var flow = [{ id: "n1", type: "lowpass", filterVal: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',3);
              break;
            case 2:
              msg.should.have.a.property('payload',1.75);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterValue', 1);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 3 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 1 });
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

  it('should filter data in both domains 1', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "lowpass", filter: "250", filterUnit:"msec", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(2900,50);
              msg.should.have.a.property('payload',1021.125);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 2500);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(200);
        n1.receive({ payload: 1002 });
        await delay(100);
        n1.receive({ payload: 1004 });
        await delay(2000);
        n1.receive({ payload: 1006 });
        await delay(600);
        n1.receive({ payload: 1038 });
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

  it('should filter data in both domains 2', function (done) {
    var flow = [{ id: "n1", type: "lowpass", filter: "0.25", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(300,25);
              msg.should.have.a.property('payload',1500);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 2500);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(300);
        n1.receive({ payload: 2000 });
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

  it('should filter data in both domains 3', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "lowpass", filter: "0.25", filterMul: "0", filterVal: "100", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        c++;
        try {
          var delta = Date.now() - start;
          switch( c )
          {
            case 1:
              delta.should.be.lessThan(20);
              msg.should.have.a.property('payload',1000);
              break;
            case 2:
              delta.should.be.approximately(3500,50);
              msg.should.have.a.property('payload',1510.5625);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filterTime', 250);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('filterValue', 100);
        await delay(50);
        start = Date.now();
        n1.receive({ payload: 1000 });
        await delay(200);
        n1.receive({ payload: 1002 });
        await delay(100);
        n1.receive({ payload: 1004 });
        await delay(2000);
        n1.receive({ payload: 1006 });
        await delay(600);
        n1.receive({ payload: 1038 });
        await delay(600);
        n1.receive({ payload: 2000 });
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

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "lowpass", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('alpha', 0.5);
        n1.should.have.a.property('filterTime', 0);
        n1.should.have.a.property('filterValue', 0);
        n1.should.have.a.property('filterLongTime', 0);
        n1.should.have.a.property('zeroIsZero', false);
        n1.should.have.a.property('round', null );
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: NaN });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: 5000 });
        await delay(50);
        c.should.match( 1 );
        n1.warn.should.have.callCount(2);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "lowpass", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',0);
              break;
            case 2:
              msg.should.have.a.property('payload',1000);
              break;
            case 3:
              msg.should.have.a.property('payload',5000);
              break;
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ payload: 1000 });
        await delay(50);
        n1.receive({ topic: "init" });
        await delay(50);
        n1.receive({ payload: 5000 });
        await delay(50);
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

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "lowpass", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
        await delay(50);
        n1.receive({ payload: {a:1,value:98,b:88} });
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

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "lowpass", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',98+5);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload+5");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: 98 });
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

});

