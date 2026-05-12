var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../format_bool.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'format_bool Node', function () {
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
    var flow = [{ id: "n1", type: "formatBool", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('falseValue', 0);
        n1.should.have.a.property('trueValue', 1);
        n1.should.have.a.property('timeout', 0);
        n1.should.have.a.property('timeoutValue', null);
        n1.should.have.a.property('filter', false);
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

  it('should forward booleans', function (done) {
    const values = [false,true,0,1,"","Test"];
    var flow = [{ id: "n1", type: "formatBool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"FooBar");
          msg.should.have.property('payload',c&1);
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('falseValue', 0);
        n1.should.have.a.property('trueValue', 1);
        n1.should.have.a.property('timeout', 0);
        n1.should.have.a.property('timeoutValue', null);
        n1.should.have.a.property('filter', false);
        await delay(50);
        for( const i of values )
        {
          n1.receive({ topic: "FooBar", payload: i });
          await delay(50);
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( values.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert to defined numbers', function (done) {
    const values = [false,true,0,1,"","Test"];
    var flow = [{ id: "n1", topic:"new Topic", falseValue:20, trueValue:24, type:"formatBool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"new Topic");
          msg.should.have.property('payload',20+4*(c&1));
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('topic', 'new Topic');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('falseValue', 20);
        n1.should.have.a.property('trueValue', 24);
        n1.should.have.a.property('timeout', 0);
        n1.should.have.a.property('timeoutValue', null);
        n1.should.have.a.property('filter', false);
        await delay(50);
        for( const i of values )
        {
          n1.receive({ topic: "FooBar", payload: i });
          await delay(50);
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( values.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert to defined strings', function (done) {
    const values = [false,true,0,1,"","Test"];
    var flow = [{ id: "n1", falseValue:"off", falseValueType:"str", trueValue:"on", trueValueType:"str", type:"formatBool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"FooBar");
          msg.should.have.property('payload',c&1?"on":"off");
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('falseValue', "off");
        n1.should.have.a.property('trueValue', "on");
        n1.should.have.a.property('timeout', 0);
        n1.should.have.a.property('timeoutValue', null);
        n1.should.have.a.property('filter', false);
        await delay(50);
        for( const i of values )
        {
          n1.receive({ topic: "FooBar", payload: i });
          await delay(50);
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( values.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "formatBool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        c++;
      });
      try{
        await delay(50);
        n1.receive({ invalid:true, payload: true });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "formatBool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4?0:1);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', false);
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: false });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "formatBool", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2?0:1);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', true);
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: true });
        await delay(50);
        n1.receive({ payload: false });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "formatBool", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',0);
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
        n1.receive({ payload: {a:1,value:false,b:88} });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "formatBool", name: "test", property:"$not(payload)", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',1);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "$not(payload)");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: false });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
/*
  it('should handle payload == null', function (done) {
    const numbers = [null,null,-1,null,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          const h = numbers[c];
          msg.should.have.property('payload',typeof h == "number" ? h.toFixed(0) : h );
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
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

  it('should handle payload == null with filtering', function (done) {
    const numbers = [null,null,-1,-1,null,null,null,1,1];
    const results = [null,-1,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          const h = results[c];
          msg.should.have.property('payload',typeof h == "number" ? h.toFixed(0) : h );
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        await delay(50);
        n1.should.have.a.property('filter', true);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
          await delay(50);
        }
        c.should.match( results.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle payload == null with objects', function (done) {
    const numbers = [-1,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          switch( c )
          {
            case 1:
            case 3:
              msg.should.have.property('payload',null);
              break;
            case 4:
              msg.should.have.property('payload',"255");
              break;
            default:
              msg.should.have.property('payload',Number(numbers[c]).toFixed(0));
          }
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: {value:i} });
          await delay(50);
        }
        n1.receive({ payload: null });
        await delay(50);
        n1.receive({ payload: {value:255} });
        await delay(50);
        c.should.match( numbers.length + 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle payload == null with Jsonata', function (done) {
    const numbers = [-1,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',c==1 ? null : (Number(numbers[c])+5).toFixed(0));
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        await delay(100);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
          await delay(50);
        }
        c.should.match( numbers.length );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle payload == null with Jsonata and objects', function (done) {
    const numbers = [-1,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload.value+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          switch( c )
          {
            case 1:
            case 3:
              msg.should.have.property('payload',null);
              break;
            case 4:
              msg.should.have.property('payload',"260");
              break;
            default:
              msg.should.have.property('payload',(Number(numbers[c])+5).toFixed(0));
          }
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        await delay(100);
        for( const i of numbers )
        {
          n1.receive({ payload: {value:i} });
          await delay(50);
        }
        n1.receive({ payload: null });
        await delay(50);
        n1.receive({ payload: {value:255} });
        await delay(50);
        c.should.match( numbers.length + 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
*/
});
