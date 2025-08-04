var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../logic_and.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'logic_and Node', function () {
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
    var flow = [{ id: "n1", type: "and", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', "");
        n1.should.have.a.property('property', 'payload');
        //n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('minData', 1);
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

  it('should and two bool values, mindata=1', function (done) {
    var flow = [{ id: "n1", type: "and", topic:"Und", minData:"1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('topic',"Und");
          msg.should.have.property('payload',c===4);
          msg.should.have.property('count',c===1?1:2);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 1);
        await delay(50);
        n1.receive({ topic: "a", payload: false });
        await delay(50);
        n1.receive({ topic: "b", payload: false });
        await delay(50);
        n1.receive({ topic: "a", payload: true });
        await delay(50);
        n1.receive({ topic: "b", payload: true });
        await delay(50);
        n1.receive({ topic: "b", payload: false });
        await delay(50);
        c.should.match( 5 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should and two bool values, mindata=2', function (done) {
    var flow = [{ id: "n1", type: "and", topic:"", minData:"2", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('topic',c==2?"a":"b");
          msg.should.have.property('payload',c===3);
          msg.should.have.property('count',2);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 2);
        await delay(50);
        n1.receive({ topic: "a", payload: false });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ topic: "b", payload: false });
        await delay(50);
        n1.receive({ topic: "a", payload: true });
        await delay(50);
        n1.receive({ topic: "b", payload: true });
        await delay(50);
        n1.receive({ topic: "b", payload: false });
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

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "and", name: "test", wires: [["n2"]] },
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

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "and", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', false);
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 1 });
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

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "and", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', true);
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 0 });
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

  it('should have reset', function (done) {
    var flow = [{ id: "n1", type: "and", minData:"3", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('payload',c===3);
          msg.should.have.property('count',3);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 3);
        await delay(50);
        n1.receive({ topic: "a", payload: false });
        await delay(50);
        n1.receive({ topic: "b", payload: false });
        await delay(50);
        n1.receive({ topic: "c", payload: false });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ topic: "a", payload: false });
        await delay(50);
        n1.receive({ topic: "b", payload: false });
        await delay(50);
        n1.receive({ topic: "c", payload: false });
        await delay(50);
        n1.receive({ topic: "init" });
        await delay(50);
        n1.receive({ topic: "a", payload: true });
        await delay(50);
        n1.receive({ topic: "b", payload: true });
        await delay(50);
        n1.receive({ topic: "c", payload: true });
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

  it('should have reset with output', function (done) {
    var flow = [{ id: "n1", type: "and", minData:"0", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          switch( c )
          {
            case 1:
              msg.should.have.property('topic','a');
              msg.should.have.property('payload',true);
              msg.should.have.property('count',1);
              break;
            case 2:
              msg.should.have.property('topic','init');
              msg.should.have.property('payload',false);
              msg.should.have.property('count',0);
              break;
            case 3:
              msg.should.have.property('topic','s');
              msg.should.have.property('payload',false);
              msg.should.have.property('count',1);
              break;
            default:
              done("additinal message")
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('minData', 0);
        await delay(50);
        n1.receive({ topic: "a", payload: true });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ topic: "s", payload: false });
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
    var flow = [{ id: "n1", type: "and", name: "test", property:"payload.value", wires: [["n2"]] },
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
    var flow = [{ id: "n1", type: "and", name: "test", property:"payload=5", propertyType:"jsonata", wires: [["n2"]] },
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
