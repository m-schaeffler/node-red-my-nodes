var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
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

  function initContext(done) {
    Context.init({
      contextStorage: {
        memoryOnly: {
          module: "memory"
        },
        storeInFile: {
          module: "memory"
        }
      }
    });
    Context.load().then(function () {
      done();
    });
  }

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
    var flow = [{ id: "n1", type: "collectChart", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('contextStore', 'none');
        n1.should.have.a.property('topics', []);
        n1.should.have.a.property('cyclic', 60);
        n1.should.have.a.property('eraseCycles',10);
        n1.should.have.a.property('hours', 24);
        n1.should.have.a.property('steps', false);
        n1.should.have.a.property('showState', false);
        n1.should.have.a.property('cycleJitter', 2000);
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
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", showState:true, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
        n1.should.have.a.property('cycleJitter', 0);
        n1.should.have.a.property('showState', true);
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
        should.not.exist( n1.context().get("last") );
        should.not.exist( n1.context().get("data") );
        should.not.exist( n1.context().get("data", "memoryOnly") );
        should.not.exist( n1.context().get("data", "storeInFile") );
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should collect data with steps', function (done) {
    this.timeout( 10000 );
    const numbers1 = [0,0,0,10,10,5];
    const numbers2 = [0,0,0,0,10,10,10,5];
    const time = [0,200,400,570,600,800,970,1000];
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "2", steps: true, name: "test", wires: [["n2"]] },
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
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers2.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','steps');
                v.should.have.a.property('t').which.is.approximately(Date.now()-1250+time[i],20);
                v.should.have.a.property('v',Number(numbers2[i]));
              }
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
        n1.should.have.a.property('steps', true);
        await delay(750);
        c.should.match(1);
        for( const i of numbers1 )
        {
          n1.receive({ topic:"steps", payload: i });
          await delay(200);
        }
        await delay(3750);
        c.should.match(2);
        should.exist( n1.context().get("last") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should collect data with partial steps', function (done) {
    this.timeout( 10000 );
    const numbers1 = [0,0,0,10,10,5];
    const numbers2 = [0,0,0,0,10,10,10,5];
    const time = [0,200,400,570,600,800,970,1000];
    const topics = [{topic:"direct"},{topic:"step",step:true}];
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "2", topics: JSON.stringify(topics), name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var cS = 0;
      var cD = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
          switch( c )
          {
            case 1:
              msg.should.have.property('init',true);
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length);
              for( const i in topics )
              {
                msg.payload[i].should.match({c:topics[i].topic});
              }
              break;
            case 2:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length+numbers1.length+numbers2.length);
              for(const i in msg.payload)
              {
                if( i < 2 )
                {
                  msg.payload[i].should.match({c:topics[i].topic});
                }
                else
                {
                  const v = msg.payload[i];
                  v.should.be.a.Object();
                  switch( v.c )
                  {
                    case 'step':
                      v.should.have.a.property('t').which.is.approximately(Date.now()-1250+time[cS],20);
                      v.should.have.a.property('v',Number(numbers2[cS++]));
                      break;
                    case "direct":
                      v.should.have.a.property('t').which.is.approximately(Date.now()-1250+cD*200,20);
                      v.should.have.a.property('v',Number(numbers1[cD++]));
                      break;
                    default:
                      done("wrong v.c");
                  }
                }
              }
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
        n1.should.have.a.property('steps', false);
        n1.should.have.a.property('topics', topics);
        await delay(750);
        c.should.match(1);
        for( const i of numbers1 )
        {
          n1.receive({ topic:"step", payload: i });
          n1.receive({ topic:"direct", payload: i });
          await delay(200);
        }
        await delay(3750);
        c.should.match(2);
        should.exist( n1.context().get("last") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have preset topics', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", topics: '["s1","s2"]', cyclic:"1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
          c.should.match(1);
          msg.should.have.property('init',true);
          msg.should.have.property('payload').which.is.an.Array().of.length(2);
          msg.payload[0].should.have.a.property('c',"s1");
          msg.payload[0].should.have.a.property('t',null);
          msg.payload[0].should.not.have.a.property('v');
          msg.payload[1].should.have.a.property('c',"s2");
          msg.payload[1].should.have.a.property('t',null);
          msg.payload[1].should.not.have.a.property('v');
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topics', ['s1','s2']);
        await delay(2500);
        c.should.match(1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should delete old data', function (done) {
    this.timeout( 30000 );
    const numbers = [0,1,2,3,4,5,6,7,8,9];
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "0.5", eraseCycles: "5", hours: 4/3600, name: "test", wires: [["n2"]] },
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
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series');
                v.should.have.a.property('t').which.is.approximately(Date.now()-250,20);
                v.should.have.a.property('v',Number(i));
              }
              break;
            case 3:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(2*numbers.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series');
                v.should.have.a.property('t').which.is.approximately(Date.now()-(i<numbers.length?2750:250),30);
                v.should.have.a.property('v',Number(i));
              }
              break;
            case 4:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series');
                v.should.have.a.property('t').which.is.approximately(Date.now()-1750,40);
                v.should.have.a.property('v',Number(i)+10);
              }
              break;
            case 5:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(2*numbers.length);
              //console.log(msg.payload[0].t-Date.now())
              //console.log(msg.payload[10].t-Date.now())
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series');
                v.should.have.a.property('t').which.is.approximately(Date.now()-(i<numbers.length?2750:250),50);
                v.should.have.a.property('v',Number(i)+10);
              }
              break;
            case 6:
              msg.should.not.have.property('init');
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers.length);
              //console.log(msg.payload[0].t-Date.now())
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','series');
                v.should.have.a.property('t').which.is.approximately(Date.now()-1750,50);
                v.should.have.a.property('v',Number(i)+20);
              }
              break;
            case 7:
              msg.should.not.have.property('init');
              msg.should.have.property('payload',[]);
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
        n1.should.have.a.property('cyclic', 0.5);
        n1.should.have.a.property('eraseCycles', 5);
        n1.should.have.a.property('hours', 4/3600);
        await delay(750);
        c.should.be.equal(1);
        for( const i of numbers )
        {
          n1.receive({ topic:"series", payload: i });
        }
        await delay(2500);
        c.should.be.equal(2);
        for( const i of numbers )
        {
          n1.receive({ topic:"series", payload: i+10 });
        }
        await delay(2500);
        c.should.be.equal(4);
        for( const i of numbers )
        {
          n1.receive({ topic:"series", payload: i+20 });
        }
        await delay(8000);
        c.should.be.equal(7);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should store data in memory context', function (done) {
    this.timeout( 10000 );
    const numbers = [0,1,2,3,4];
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", contextStore:"memoryOnly", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','memory');
                v.should.have.a.property('t').which.is.approximately(Date.now()-250,20);
                v.should.have.a.property('v',Number(numbers[i]));
              }
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
        n1.should.have.a.property('contextStore', 'memoryOnly');
        await delay(750);
        c.should.match(1);
        for( const i of numbers )
        {
          n1.receive({ topic:"memory", payload: i });
        }
        await delay(500);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        should.exist( n1.context().get("data") );
        should.exist( n1.context().get("data", "memoryOnly") );
        should.not.exist( n1.context().get("data", "storeInFile") );
        var q = n1.context().get("data");
        q.should.be.an.Array().of.length(numbers.length);
        for(const i in q)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c','memory');
          v.should.have.a.property('t').which.is.approximately(Date.now()-500,20);
          v.should.have.a.property('v',Number(numbers[i]));
        }
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should store data in file context', function (done) {
    this.timeout( 10000 );
    const numbers = [0,1,2,3,4];
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", contextStore:"storeInFile", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(numbers.length);
              for(const i in msg.payload)
              {
                const v = msg.payload[i];
                v.should.be.a.Object();
                v.should.have.a.property('c','file');
                v.should.have.a.property('t').which.is.approximately(Date.now()-250,20);
                v.should.have.a.property('v',Number(numbers[i]));
              }
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
        n1.should.have.a.property('contextStore', 'storeInFile');
        await delay(750);
        c.should.match(1);
        for( const i of numbers )
        {
          n1.receive({ topic:"file", payload: i });
        }
        await delay(500);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        should.not.exist( n1.context().get("data") );
        should.not.exist( n1.context().get("data", "memoryOnly") );
        should.exist( n1.context().get("data", "storeInFile") );
        var q = n1.context().get("data", "storeInFile");
        q.should.be.an.Array().of.length(numbers.length);
        for(const i in q)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c','file');
          v.should.have.a.property('t').which.is.approximately(Date.now()-500,20);
          v.should.have.a.property('v',Number(numbers[i]));
        }
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should not collect invalid data', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", name: "test", wires: [["n2"]] },
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
      n1.receive({ topic:"s", payload: 37 });
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
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", name: "test", property:"payload.value", wires: [["n2"]] },
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
        await delay(750);
        n1.receive({ topic:"object", payload: {a:1,value:98,b:88} });
        await delay(2750);
        c.should.match(2);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", cycleJitter: "0", cyclic: "1", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
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
        await delay(750);
        n1.receive({ topic:"jsonata", payload: 20 });
        await delay(2750);
        c.should.match(2);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should reload from context', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: "n1", type: "collectChart", contextStore:"memoryOnly", cycleJitter: "0", cyclic: "1",  showState:true, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(2);
              msg.payload[0].should.match({c:'old',t:0,v:0});
              msg.payload[1].should.match({c:'old',t:100,v:100});
              break;
            case 2:
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
        n1.should.have.a.property('contextStore', 'memoryOnly');
        n1.context().set("data", [{c:'old',t:0,v:0},{c:'old',t:100,v:100}], "memoryOnly");
        await delay(750);
        c.should.match(1);
        n1.receive({ topic:"end", payload: 255 });
        await delay(2750);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        const q = n1.context().get("data", "memoryOnly");
        q.should.be.an.Array().of.length(3);
        q[0].should.match({c:'old',t:0,v:0});
        q[1].should.match({c:'old',t:100,v:100});
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should fix changed topics, to few data points', function (done) {
    this.timeout( 10000 );
    const topics = ["a","b","c","d"];
    var flow = [{ id: "n1", type: "collectChart", topics: JSON.stringify(topics), contextStore:"memoryOnly", cycleJitter: "0", cyclic: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length);
              for( const i in topics )
              {
                msg.payload[i].should.have.a.property('c',topics[i]);
                msg.payload[i].should.have.a.property('t',null);
                msg.payload[i].should.not.have.a.property('v');
              }
              break;
            case 2:
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
        n1.should.have.a.property('topics', topics);
        n1.should.have.a.property('contextStore', 'memoryOnly');
        n1.context().set("data", [{c:'old',t:null},{c:'old2',t:null}], "memoryOnly");
        await delay(750);
        c.should.match(1);
        n1.receive({ topic:"end", payload: 255 });
        await delay(2750);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        const q = n1.context().get("data", "memoryOnly");
        q.should.be.an.Array().of.length(topics.length+1);
        for(const i in topics)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c',topics[i]);
          v.should.have.a.property('t',null);
          v.should.not.have.a.property('v');
        }
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should fix changed topics, wrong data points', function (done) {
    this.timeout( 10000 );
    const topics = ["a","b","c","d"];
    var flow = [{ id: "n1", type: "collectChart", topics: JSON.stringify(topics), contextStore:"memoryOnly", cycleJitter: "0", cyclic: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length+2);
              for( const i in topics )
              {
                msg.payload[i].should.have.a.property('c',topics[i]);
                msg.payload[i].should.have.a.property('t',null);
                msg.payload[i].should.not.have.a.property('v');
              }
              break;
            case 2:
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
        n1.should.have.a.property('topics', topics);
        n1.should.have.a.property('contextStore', 'memoryOnly');
        n1.context().set("data", [{c:'old',t:null},{c:'old2',t:null},{c:'old3',t:null},{c:'old4',t:null},{c:'old',t:0,v:0},{c:'old',t:100,v:100}], "memoryOnly");
        await delay(750);
        c.should.match(1);
        n1.receive({ topic:"end", payload: 255 });
        await delay(2750);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        const q = n1.context().get("data", "memoryOnly");
        q.should.be.an.Array().of.length(topics.length+3);
        for(const i in topics)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c',topics[i]);
          v.should.have.a.property('t',null);
          v.should.not.have.a.property('v');
        }
        q[4].should.match({c:'old',t:0,v:0});
        q[5].should.match({c:'old',t:100,v:100});
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should fix changed topics, added topic', function (done) {
    this.timeout( 10000 );
    const topics = ["a","b","c","d"];
    var flow = [{ id: "n1", type: "collectChart", topics: JSON.stringify(topics), contextStore:"memoryOnly", cycleJitter: "0", cyclic: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length+2);
              for( const i in topics )
              {
                msg.payload[i].should.have.a.property('c',topics[i]);
                msg.payload[i].should.have.a.property('t',null);
                msg.payload[i].should.not.have.a.property('v');
              }
              break;
            case 2:
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
        n1.should.have.a.property('topics', topics);
        n1.should.have.a.property('contextStore', 'memoryOnly');
        n1.context().set("data", [{c:'a',t:null},{c:'b',t:null},{c:'c',t:null},{c:'toDelete',t:-1,v:-1},{c:'old',t:0,v:0},{c:'old',t:100,v:100}], "memoryOnly");
        await delay(750);
        c.should.match(1);
        n1.receive({ topic:"end", payload: 255 });
        await delay(2750);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        const q = n1.context().get("data", "memoryOnly");
        q.should.be.an.Array().of.length(topics.length+3);
        for(const i in topics)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c',topics[i]);
          v.should.have.a.property('t',null);
          v.should.not.have.a.property('v');
        }
        q[4].should.match({c:'old',t:0,v:0});
        q[5].should.match({c:'old',t:100,v:100});
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

  it('should fix changed topics, deleted topic', function (done) {
    this.timeout( 10000 );
    const topics = ["a","b","c","d"];
    var flow = [{ id: "n1", type: "collectChart", topics: JSON.stringify(topics), contextStore:"memoryOnly", cycleJitter: "0", cyclic: "1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
     initContext(async function () {
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
              msg.should.have.property('payload').which.is.an.Array().of.length(topics.length+2);
              for( const i in topics )
              {
                msg.payload[i].should.have.a.property('c',topics[i]);
                msg.payload[i].should.have.a.property('t',null);
                msg.payload[i].should.not.have.a.property('v');
              }
              break;
            case 2:
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
        n1.should.have.a.property('topics', topics);
        n1.should.have.a.property('contextStore', 'memoryOnly');
        n1.context().set("data", [{c:'a',t:null},{c:'b',t:null},{c:'c',t:null},{c:'d',t:null},{c:'e',t:null},{c:'old',t:0,v:0},{c:'old',t:100,v:100}], "memoryOnly");
        await delay(750);
        c.should.match(1);
        n1.receive({ topic:"end", payload: 255 });
        await delay(2750);
        c.should.match(2);
        should.not.exist( n1.context().get("last") );
        const q = n1.context().get("data", "memoryOnly");
        q.should.be.an.Array().of.length(topics.length+3);
        for(const i in topics)
        {
          const v = q[i];
          v.should.be.a.Object();
          v.should.have.a.property('c',topics[i]);
          v.should.have.a.property('t',null);
          v.should.not.have.a.property('v');
        }
        q[4].should.match({c:'old',t:0,v:0});
        q[5].should.match({c:'old',t:100,v:100});
        done();
      }
      catch(err) {
        done(err);
      }
     });
    });
  });

});
