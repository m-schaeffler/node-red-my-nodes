var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../format_number.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'format_number Node', function () {
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
    var flow = [{ id: "n1", type: "formatNumber", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('unit', '');
        n1.should.have.a.property('grouping', "");
        n1.should.have.a.property('decimal', ".");
        n1.should.have.a.property('digits', 0);
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

  it('should forward numbers rounded to integer', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(0));
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward numbers rounded to two digits', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false];
    var flow = [{ id: "n1", type: "formatNumber", digits: "2", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(2));
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('digits', 2);
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

  it('should forward numbers rounded to two digits and changed decimal', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false];
    var flow = [{ id: "n1", type: "formatNumber", decimal: ",", digits: "2", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(2).replace('.',','));
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('decimal', ",");
        n1.should.have.a.property('digits', 2);
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

  it('should forward numbers with an added unit', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false];
    var flow = [{ id: "n1", type: "formatNumber", unit: "VAr", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',Number(numbers[c]).toFixed(0)+'\u202FVAr');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('unit', '\u202FVAr');
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

  it('should forward numbers without grouping', function (done) {
    const numbers = [-12345,123,1234,12345,123456,1234567,12345678,1234.1,1233.9,0,1,-1];
    const results = ["-12345","123","1234","12345","123456","1234567","12345678","1234","1234","0","1","-1"];
    var flow = [{ id: "n1", type: "formatNumber", grouping: "", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',results[c]);
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('grouping', "");
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
          await delay(50);
        }
        c.should.match( results.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward numbers with grouping', function (done) {
    const numbers = [-12345,123,1234,12345,123456,1234567,12345678,1234.1,1233.9,0,1,-1];
    const results = ["-12'345","123","1'234","12'345","123'456","1'234'567","12'345'678","1'234","1'234","0","1","-1"];
    var flow = [{ id: "n1", type: "formatNumber", grouping: "'", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          msg.should.have.property('payload',results[c]);
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('grouping', "$1'");
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ payload: i });
          await delay(50);
        }
        c.should.match( results.length );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"255");
          c++;
        }
        catch(err) { done(err);
        }
      });
      try{
        await delay(50);
        n1.receive({ invalid:true, payload: 12.345 });
        await delay(50);
        n1.receive({ invalid:true, payload: -12.345 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ payload: 255 });
        await delay(50);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should forward NaN data as it is', function (done) {
    const numbers = [undefined,"FooBar",NaN,{}];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',numbers[c]);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not filter data', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===4?"255":"2");
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
        n1.receive({ payload: 255 });
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
    var flow = [{ id: "n1", type: "formatNumber", name: "test", filter:true, wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.a.property('payload',c===2?"255":"2");
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
        n1.receive({ payload: 255 });
        await delay(50);
        c.should.match( 2 );
        doned();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"98");
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
    var flow = [{ id: "n1", type: "formatNumber", name: "test", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',"25");
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

  it('should handle payload == null', function (done) {
    const numbers = [-1,null,1];
    var flow = [{ id: "n1", type: "formatNumber", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg.payload);
        try {
          msg.should.have.property('payload',c==1 ? null : Number(numbers[c]).toFixed(0));
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
        console.log(msg.payload);
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
        console.log(msg.payload);
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
        console.log(msg.payload);
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
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
