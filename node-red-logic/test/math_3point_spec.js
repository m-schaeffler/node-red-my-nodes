var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_3point.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
 }

describe( 'math_threePoint Node', function () {
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
    var flow = [{ id: "n1", type: "threePoint", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('thresholdUpRise', NaN);
        n1.should.have.a.property('thresholdUpFall', NaN);
        n1.should.have.a.property('thresholdLowRise', NaN);
        n1.should.have.a.property('thresholdLowFall', NaN);
        n1.should.have.a.property('output', { '0': 0, '1': 1, '-1': -1 });
        n1.should.have.a.property('noInit', false);
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

  it('should check for edges', function (done) {
    const numbers = [1000,10,69.9,70,70.1,80,89.9,90,90.1,100,90,80.1,80,79.9,70,60.1,60,59.9,0];
    var flow = [{ id: "n1", type: "threePoint", outputUpper: "up", outputUpperType:"str", outputMiddle: "mid", outputMiddleType:"str", outputLower: "down", outputLowerType:"str", name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          c++;
          switch( c )
          {
            case 1:
               msg.should.have.property('topic','const1');
               msg.should.have.property('payload','down');
               msg.should.have.property('value',50);
               msg.should.have.property('edge',-1);
               msg.should.have.property('init',true);
               break;
             case 2:
               msg.should.have.property('topic','const2');
               msg.should.have.property('payload','up');
               msg.should.have.property('value',250);
               msg.should.have.property('edge',+1);
               msg.should.have.property('init',true);
               break;
             case 3:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','up');
               msg.should.have.property('value',1000);
               msg.should.have.property('edge',+1);
               msg.should.have.property('init',true);
               break;
             case 4:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','down');
               msg.should.have.property('value',10);
               msg.should.have.property('edge',-1);
               msg.should.have.property('init',false);
               break;
             case 5:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','mid');
               msg.should.have.property('value',70.1);
               msg.should.have.property('edge',0);
               msg.should.have.property('init',false);
               break;
             case 6:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','up');
               msg.should.have.property('value',90.1);
               msg.should.have.property('edge',+1);
               msg.should.have.property('init',false);
               break;
             case 7:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','mid');
               msg.should.have.property('value',79.9);
               msg.should.have.property('edge',0);
               msg.should.have.property('init',false);
               break;
             case 8:
               msg.should.have.property('topic','edge');
               msg.should.have.property('payload','down');
               msg.should.have.property('value',59.9);
               msg.should.have.property('edge',-1);
               msg.should.have.property('init',false);
               break;
             default:
               done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('thresholdUpRise', 90);
        n1.should.have.a.property('thresholdUpFall', 80);
        n1.should.have.a.property('thresholdLowRise', 70);
        n1.should.have.a.property('thresholdLowFall', 60);
        n1.should.have.a.property('output', { '0': "mid", '1': "up", '-1': "down" });
        n1.should.have.a.property('noInit', false);
        await delay(50);
        c.should.match( 0 );
        for( const i of numbers )
        {
          n1.receive({ topic:"const1", payload: 50 });
          n1.receive({ topic:"const2", payload: 250 });
          n1.receive({ topic:"edge",   payload: i });
          await delay(50);
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 8 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should check for edges, without init msg', function (done) {
    const numbers = [1000,10,69.9,70,70.1,80,89.9,90,90.1,100,90,80.1,80,79.9,70,60.1,60,59.9,0];
    var flow = [{ id: "n1", type: "threePoint", topic:"newtopic", noInit:true, outputUpper: "up", outputUpperType:"str", outputMiddle: "mid", outputMiddleType:"str", outputLower: "down", outputLowerType:"str", name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          c++;
          msg.should.have.property('topic','newtopic');
          switch( c )
          {
             case 1:
               msg.should.have.property('payload','down');
               msg.should.have.property('value',10);
               msg.should.have.property('edge',-1);
               msg.should.have.property('init',false);
               break;
             case 2:
               msg.should.have.property('payload','mid');
               msg.should.have.property('value',70.1);
               msg.should.have.property('edge',0);
               msg.should.have.property('init',false);
               break;
             case 3:
               msg.should.have.property('payload','up');
               msg.should.have.property('value',90.1);
               msg.should.have.property('edge',+1);
               msg.should.have.property('init',false);
               break;
             case 4:
               msg.should.have.property('payload','mid');
               msg.should.have.property('value',79.9);
               msg.should.have.property('edge',0);
               msg.should.have.property('init',false);
               break;
             case 5:
               msg.should.have.property('payload','down');
               msg.should.have.property('value',59.9);
               msg.should.have.property('edge',-1);
               msg.should.have.property('init',false);
               break;
             default:
               done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', 'newtopic');
        n1.should.have.a.property('thresholdUpRise', 90);
        n1.should.have.a.property('thresholdUpFall', 80);
        n1.should.have.a.property('thresholdLowRise', 70);
        n1.should.have.a.property('thresholdLowFall', 60);
        n1.should.have.a.property('output', { '0': "mid", '1': "up", '-1': "down" });
        n1.should.have.a.property('noInit', true);
        await delay(50);
        for( const i in numbers )
        {
          n1.receive({ topic:i, payload: numbers[i] });
          await delay(50);
        }
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 5 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "threePoint", name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',+1);
          msg.should.have.property('value',5000);
          msg.should.have.property('init',true);
        }
        catch(err) {
          done(err);
        }
      });
      try {
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

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "threePoint", outputUpper:"false", outputUpperType:"bool", outputLower:"true", outputLowerType:"bool",name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',false);
          msg.should.have.property('value',c*1000);
          msg.should.have.property('topic',c===1?"A":"B");
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', { '0': 0, '1': false, '-1': true });
        await delay(50);
        n1.receive({ topic:"A", payload: 1000 });
        await delay(50);
        n1.receive({ topic:"B", payload: 2000 });
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

  it('should have reset', function (done) {
    const jsonR = { text:"Text R", num:42 };
    const jsonF = { text:"Text F", num:-1 };
    var flow = [{ id: "n1", type: "threePoint", outputUpper:JSON.stringify(jsonR), outputUpperType:"json", outputMiddle:"null", outputMiddleType:"json", outputLower:JSON.stringify(jsonF), outputLowerType:"json",name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        c++;
        try {
          switch( c ) {
            case 1:
            case 2:
              msg.should.have.property('payload',jsonF);
              msg.should.have.a.property('value',0);
              msg.should.have.property('init',true);
              break;
            case 3:
              msg.should.have.property('payload',jsonR);
              msg.should.have.a.property('value',1000);
              msg.should.have.property('init',false);
              break;
            case 4:
              msg.should.have.property('payload',null);
              msg.should.have.a.property('value',75);
              msg.should.have.property('init',true);
              break;
            case 5:
              msg.should.have.property('payload',jsonR);
              msg.should.have.a.property('value',150);
              msg.should.have.property('init',true);
              break;
            case 6:
              msg.should.have.property('payload',null);
              msg.should.have.a.property('value',75);
              msg.should.have.property('init',false);
              break;
            default:
              done("too much messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', { '0': null, '1': jsonR, '-1': jsonF } );
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 1000 });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ payload:75  });
        await delay(50);
        n1.receive({ topic: "init" });
        await delay(50);
        n1.receive({ payload: 150 });
        await delay(50);
        n1.receive({ payload: 75 });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 6 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have query', function (done) {
    var flow = [{ id: "n1", type: "threePoint", name: "test", thresholdUpRise:"2.90", thresholdUpFall:"2.10", thresholdLowRise:"1.90", thresholdLowFall:"1.1", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',(c%4).toString());
          let h;
          switch( c % 4 )
          {
              case 0:
              case 1: h = -1; break;
              case 2: h =  0; break;
              case 3: h = +1; break;
          }
          msg.should.have.property('payload',h);
          msg.should.have.property('edge',h);
          if( c <= 3 )
          {
            msg.should.have.a.property('value',c);
            msg.should.have.a.property('init',true);
            msg.should.not.have.a.property('query');
          }
          else
          {
            msg.should.not.have.a.property('value');
            msg.should.not.have.a.property('init');
            msg.should.have.a.property('query',true);
          }
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        await delay(50);
        n1.receive({ topic:'0', payload:0 });
        n1.receive({ topic:'1', payload:1 });
        n1.receive({ topic:'2', payload:2 });
        n1.receive({ topic:'3', payload:3 });
        await delay(50);
        c.should.match( 4 );
        n1.receive({ query: true });
        await delay(50);
        c.should.match( 2*4 );
        n1.receive({ topic: "query" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 3*4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "threePoint", property:"payload.value", name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',+1);
          msg.should.have.property('value',210);
          msg.should.have.property('init',true);
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
        n1.receive({ payload: {value:65} });
        await delay(50);
        n1.receive({ payload: {a:1,value:210,b:88} });
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
    var flow = [{ id: "n1", type: "threePoint", property:"payload+5", propertyType:"jsonata", name: "test", thresholdUpRise:"90", thresholdUpFall:"80", thresholdLowRise:"70", thresholdLowFall:"60", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',+1);
          msg.should.have.property('value',88+5);
          msg.should.have.property('init',true);
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
        n1.receive({ payload: 81 });
        await delay(50);
        n1.receive({ payload: 88 });
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

});
