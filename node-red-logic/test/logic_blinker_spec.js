var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../logic_blinker.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function c2payload(c,max)
{
    if( c == 1 )
    {
      return "first";
    }
    else if( c < max )
    {
      return c%2 ? "on" : "off";
    }
    else
    {
      return "last";
    }
}

describe( 'logic_blinker Node', function () {
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
    var flow = [{ id: "n1", type: "blinker", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 1000);
        n1.should.have.a.property('offTime', 1000);
        n1.should.have.a.property('firstType', "bool");
        n1.should.have.a.property('lastType', "bool");
        n1.should.have.a.property('outputFirst', true);
        n1.should.have.a.property('outputOn', true);
        n1.should.have.a.property('outputOff', false);
        n1.should.have.a.property('outputLast', false);
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
    const numbers = [true,1,"1","true","on",false,0,"0","false","off"];
    var flow = [{ id: "n1", type: "blinker", onTimeUnit:"mins", offTimeUnit:"mins", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg)
        c++;
        try {
          msg.should.have.property("topic","FooBar");
          msg.should.have.property('payload',c==1);
          msg.should.have.property('state',c==1);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 60000);
        n1.should.have.a.property('offTime', 60000);
        n1.should.have.a.property('outputFirst', true);
        n1.should.have.a.property('outputOn', true);
        n1.should.have.a.property('outputOff', false);
        n1.should.have.a.property('outputLast', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic: "FooBar", payload: i });
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
    var flow = [{ id: "n1", type: "blinker", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 1000);
        n1.should.have.a.property('offTime', 1000);
        n1.should.have.a.property('outputFirst', true);
        n1.should.have.a.property('outputOn', true);
        n1.should.have.a.property('outputOff', false);
        n1.should.have.a.property('outputLast', false);
        n1.should.have.a.property('showState', false);
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

  it('should blink, off in on phase', function (done) {
    var flow = [{ id: "n1", type: "blinker", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirst:'first', outputFirstType:"str", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLast:'last', outputLastType:"str", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',c2payload(c,10));
          msg.should.have.property('state',c<10);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('outputFirst', "first");
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        n1.should.have.a.property('outputLast', "last");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(25);
        c.should.match( 1 );
        await delay(100);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 3 );
        await delay(800);
        c.should.match( 9 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 10 );
        await delay(500);
        c.should.match( 10 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should blink, off in pause phase', function (done) {
    var flow = [{ id: "n1", type: "blinker", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirst:'first', outputFirstType:"str", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLast:'last', outputLastType:"str", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',c2payload(c,9));
          msg.should.have.property('state',c<9);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('outputFirst', "first");
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        n1.should.have.a.property('outputLast', "last");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(25);
        c.should.match( 1 );
        await delay(100);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 3 );
        await delay(650);
        c.should.match( 8 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 9 );
        await delay(500);
        c.should.match( 9 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should blink forever', function (done) {
    var flow = [{ id: "n1", type: "blinker", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirst:'first', outputFirstType:"str", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLast:'last', outputLastType:"str", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',c2payload(c,65535));
          msg.should.have.property('state',true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('outputFirst', "first");
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        n1.should.have.a.property('outputLast', "last");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(25);
        c.should.match( 1 );
        await delay(100);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 3 );
        await delay(800);
        c.should.match( 9 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should blink, without first message', function (done) {
    var flow = [{ id: "n1", type: "blinker", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirstType:"nul", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLast:'last', outputLastType:"str", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',c2payload(c+1,10));
          msg.should.have.property('state',c+1<10);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('firstType', "nul");
        n1.should.have.a.property('lastType', "str");
        //n1.should.have.a.property('outputFirst', null);
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        n1.should.have.a.property('outputLast', "last");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(25);
        c.should.match( 0 );
        await delay(100);
        c.should.match( 0 );
        await delay(50);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(800);
        c.should.match( 8 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 9 );
        await delay(500);
        c.should.match( 9 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should blink, without last message', function (done) {
    var flow = [{ id: "n1", type: "blinker", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirst:'first', outputFirstType:"str", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLastType:"nul", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('payload',c2payload(c,65535));
          msg.should.have.property('state',true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('firstType', "str");
        n1.should.have.a.property('lastType', "nul");
        n1.should.have.a.property('outputFirst', "first");
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        //n1.should.have.a.property('outputLast', null);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: 1 });
        await delay(25);
        c.should.match( 1 );
        await delay(100);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 3 );
        await delay(800);
        c.should.match( 9 );
        n1.receive({ payload: 0 });
        await delay(50);
        c.should.match( 9 );
        await delay(500);
        c.should.match( 9 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should blink, with input messages as first and last', function (done) {
    var flow = [{ id: "n1", type: "blinker", property:"payload.on", onTime:150, onTimeUnit:"msecs", offTime:100, offTimeUnit:"msecs", outputFirstType:"msg", outputOn:'on', outputOnType:"str", outputOff:'off', outputOffType:"str",  outputLastType:"msg", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg)
        c++;
        try {
          msg.should.have.a.property('topic','FooBar');
          switch( c )
          {
            case 1:
              msg.should.have.a.property('payload',{ on: 'on', brightness: 80 });
              break;
            case 10:
              msg.should.have.a.property('payload',{ on: 'off', brightness: 1 });
              break;
            default:
              msg.should.have.a.property('payload',c2payload(c,10));
          }
          msg.should.have.property('state',c<10);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', 'payload.on');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('onTime', 150);
        n1.should.have.a.property('offTime', 100);
        n1.should.have.a.property('firstType', "msg");
        n1.should.have.a.property('lastType', "msg");
        //n1.should.have.a.property('outputFirst', null);
        n1.should.have.a.property('outputOn', "on");
        n1.should.have.a.property('outputOff', "off");
        //n1.should.have.a.property('outputLast', "last");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic:"FooBar", payload: { on:"on", brightness: 80 } });
        await delay(25);
        c.should.match( 1 );
        await delay(100);
        c.should.match( 1 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 2 );
        await delay(50);
        c.should.match( 3 );
        await delay(800);
        c.should.match( 9 );
        n1.receive({ topic:"FooBar", payload: { on:"off", brightness: 1 } });
        await delay(50);
        c.should.match( 10 );
        await delay(500);
        c.should.match( 10 );
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
    var flow = [{ id: "n1", type: "blinker", name: "test", property:"payload.value", wires: [["n2"]] },
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
