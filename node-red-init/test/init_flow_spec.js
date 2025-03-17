var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../init_flow.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'init-flow Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memoryOnly: {
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
    var flow = [{ id: "n1", type: "init-flow" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'name');
        n1.should.have.a.property('value', 'value');
        n1.should.have.a.property('valueType', 'str');
        done();
      }
      catch(err) {
        done(err);
      }
   });
  });

  it('should set contest variable to a string', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:"Qwertzu", valueType:"str" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        await delay(100);
        should.exist( n1.context().get("contextVar") );
        n1.context().get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        n1.context().get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        n1.context().get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        n1.context().get("contextVar").should.be.equal( "Qwertzu" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
/*
  it('should forward numbers rounded to two digits', function (done) {
    const numbers = [-1,0,1,12.345,-12.345,"-1","0","1","34.5","-34.5",true,false,null];
    var flow = [{ id: "n1", type: "formatNumber", digits: "2", name: "test", wires: [["n2"]] },
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
    var flow = [{ id: "n1", type: "formatNumber", decimal: ",", digits: "2", name: "test", wires: [["n2"]] },
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
          msg.should.have.property('payload',Number(numbers[c]).toFixed(0)+'\u202FVAr');
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
        n1.should.have.a.property('unit', '\u202FVAr');
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
