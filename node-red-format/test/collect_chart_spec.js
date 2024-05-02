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

  it('should collect data', function (done) {
    this.timeout( 10000 );
    const numbers1 = [0,1,2,3,4];
    const numbers2 = ["128","255"];
    var flow = [{ id: "n1", type: "collectChart", cyclic: 2, name: "test", wires: [["n2"]] },
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
              msg.should.have.property('payload',[])
              break;
            case 2:
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
            default:
              done("too much output messages");
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 2);
      }
      catch(err) {
        done(err);
      }
      await delay(750);
      for( const i of numbers1 )
      {
        n1.receive({ topic:"series1", payload: i });
      }
      await delay(500);
      for( const i of numbers2 )
      {
        n1.receive({ topic:"series2", payload: i });
      }
      await delay(5000);
      done();
    });
  });
/*
  it('should forward numbers rounded to two digits', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "formatNumber", digits: 2, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(2));
          if( ++c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('digits', 2);
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should forward numbers rounded to two digits and changed decimal', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "formatNumber", decimal: ",", digits: 2, name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(2).replace('.',','));
          if( ++c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('decimal', ",");
        n1.should.have.a.property('digits', 2);
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should forward numbers with an added unit', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "formatNumber", unit: "VAr", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(0)+'\u2009VAr');
          if( ++c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('unit', '\u2009VAr');
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should forward numbers without grouping', function (done) {
    const numbers = [-12345,123,1234,12345,123456,1234567,12345678,1234.1,1233.9,0,1,-1];
    const results = ["-12345","123","1234","12345","123456","1234567","12345678","1234","1234","0","1","-1"];
    var flow = [{ id: "n1", type: "formatNumber", grouping: "", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',results[c]);
          if( ++c === results.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('grouping', "");
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should forward numbers with grouping', function (done) {
    const numbers = [-12345,123,1234,12345,123456,1234567,12345678,1234.1,1233.9,0,1,-1];
    const results = ["-12'345","123","1'234","12'345","123'456","1'234'567","12'345'678","1'234","1'234","0","1","-1"];
    var flow = [{ id: "n1", type: "formatNumber", grouping: "'", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',results[c]);
          if( ++c === results.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('grouping', "$1'");
      }
      catch(err) {
        done(err);
      }
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"255");
          done();
        }
        catch(err) { done(err);
        }
      });
      n1.receive({ invalid:true, payload: 12.345 });
      n1.receive({ invalid:true, payload: -12.345 });
      n1.receive({ invalid:true, payload: 0 });
      n1.receive({ payload: 255 });
    });
  });

  it('should forward NaN data as it is', function (done) {
    const numbers = [undefined,"FooBar",NaN,{}];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',numbers[c]);
          if( ++c === numbers.length )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      for( const i of numbers )
      {
        n1.receive({ payload: i });
      }
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4?"255":"2");
          if( c === 4 && msg.payload === "255" )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', false);
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 2 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 255 });
    });
  });

  it('should filter data', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2?"255":"2");
          if( c === 2 && msg.payload === "255" )
          {
            done();
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('filter', true);
      }
      catch(err) {
        done(err);
      }
      n1.receive({ payload: 2 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 2 });
      n1.receive({ payload: 255 });
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"98");
          done();
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
      n1.receive({ payload: {a:1,value:98,b:88} });
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"25");
          done();
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
      n1.receive({ payload: 20 });
    });
  });
*/
});
