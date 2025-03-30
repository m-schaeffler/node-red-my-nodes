var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_minus.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_minus Node', function () {
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
    var flow = [{ id: "n1", type: "negate", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('filter', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward numbers', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "negate", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',-Number(numbers[c]));
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
        c.should.match( numbers.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "negate", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',255);
        }
        catch(err) {
          done(err);
        }
      });
      try
      {
        await delay(50);
        n1.receive({ invalid:true, payload: 12.345 });
        await delay(50);
        n1.receive({ invalid:true, payload: -12.345 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: NaN });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: -255 });
        await delay(50);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "negate", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4?255:-2);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', false);
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: -255 });
        await delay(50);
        c.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "negate", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2?255:-2);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', true);
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: 2 });
        await delay(50);
        n1.receive({ payload: -255 });
        await delay(50);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "negate", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',-98);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "negate", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',-25);
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
        n1.receive({ payload: 20 });
        await delay(50);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
