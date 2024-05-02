var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../collect_chart.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'collect_chart Node', function () {
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
    var flow = [{ id: "n1", type: "collectChart", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('topics', []);
        n1.should.have.a.property('cyclic', 60);
        n1.should.have.a.property('hours', 24);
        n1.should.have.a.property('steps', false);
        n1.should.have.a.property('showState', false);
        await delay(750);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should collect data and get a reset', function (done) {
    this.timeout( 10000 );
    const numbers1 = [0,1,2,3,4];
    const numbers2 = ["128","255"];
    var flow = [{ id: "n1", type: "collectChart", cyclic: 1, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
          switch( c )
          {
            case 1:
              msg.should.have.property('init',true);
              msg.should.have.property('payload',[]);
              break;
            case 2:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers1.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series1');
                v.should.have.a.property('t').which.is.approximately(Date.now()-250,20);
                v.should.have.a.property('v',Number(numbers1[i]));
              }
              break;
            case 3:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers1.length+numbers2.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c',i<numbers1.length?'series1':'series2');
                v.should.have.a.property('t').which.is.approximately(Date.now()-(i<numbers1.length?1250:750),20);
                v.should.have.a.property('v',Number(i<numbers1.length?numbers1[i]:numbers2[i-numbers1.length]));
              }
              break;
            case 4:
              msg.should.not.have.property('init');
              msg.should.have.property('payload',[]);
              break;
            case 5:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(1);
              msg.payload[0].should.be.a.Object();
              msg.payload[0].should.have.a.property('c','series3');
              msg.payload[0].should.have.a.property('t').which.is.approximately(Date.now()-750,50);
              msg.payload[0].should.have.a.property('v',42);
              break;
            default:
              done("too much output messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 1);
      }
      catch(err) {
        done(err);
      }
      await delay(750);
      c.should.match(1);
      for( const i of numbers1 )
      {
        n1.receive({ topic:"series1", payload: i });
      }
      await delay(500);
      c.should.match(2);
      for( const i of numbers2 )
      {
        n1.receive({ topic:"series2", payload: i });
      }
      await delay(2000);
      c.should.match(3);
      n1.receive({ reset:true });
      await delay(2000);
      c.should.match(4);
      n1.receive({ topic:"series3", payload: 42 });
      await delay(2000);
      c.should.match(5);
      done();
    });
  });

  it('should have preset topics', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", topics: '["s1","s2"]', cyclic:1, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          c.should.match(1);
          msg.should.have.property('init',true);
          msg.should.have.property('payload').which.is.an.Array().of.length(2);
          msg.payload[0].should.match({c:"s1"});
          msg.payload[1].should.match({c:"s2"});
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topics', ['s1','s2']);
      }
      catch(err) {
        done(err);
      }
      await delay(2500);
      c.should.match(1);
      done();
    });
  });

  it('should not collect invalid data', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cyclic: 1, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          c.should.match(1);
          msg.should.have.property('init',true);
          msg.should.have.a.property('payload',[]);
        }
        catch(err) { done(err);
        }
      });
      await delay(750);
      n1.receive({ invalid:true, topic:"s", payload: 12.345 });
      n1.receive({ invalid:true, topic:"s", payload: -12.345 });
      n1.receive({ invalid:true, topic:"s", payload: 0 });
      n1.receive({ topic:"s", payload: NaN });
      n1.receive({ topic:"s", payload: "Test-Text" });
      await delay(1750);
      c.should.match(1);
      done();
    });
  });

  it('should work with objects', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cyclic: 1, name: "test", property:"payload.value", wires: [["n2"]] },
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
              msg.should.have.property('init',true);
              msg.should.have.property('payload',[])
              break;
            case 2:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(1);
              msg.payload[0].should.be.a.Object();
              msg.payload[0].should.have.a.property('c','object');
              msg.payload[0].should.have.a.property('t');
              msg.payload[0].should.have.a.property('v',98);
              break;
            default:
              done("too much output messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
      }
      catch(err) {
        done(err);
      }
      await delay(750);
      n1.receive({ topic:"object", payload: {a:1,value:98,b:88} });
      await delay(2750);
      c.should.match(2);
      done();
    });
  });

  it('should have Jsonata', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cyclic: 1, name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
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
              msg.should.have.property('init',true);
              msg.should.have.property('payload',[])
              break;
            case 2:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(1);
              msg.payload[0].should.be.a.Object();
              msg.payload[0].should.have.a.property('c','jsonata');
              msg.payload[0].should.have.a.property('t');
              msg.payload[0].should.have.a.property('v',25);
              break;
            default:
              done("too much output messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload+5");
        n1.should.have.a.property('propertyType', "jsonata");
      }
      catch(err) {
        done(err);
      }
      await delay(750);
      n1.receive({ topic:"jsonata", payload: 20 });
      await delay(2750);
      c.should.match(2);
      done();
    });
  });

});
