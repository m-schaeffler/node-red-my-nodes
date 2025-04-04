var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../init_flow.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'init-flow Node (global context)', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  /*
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
  */

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
    var flow = [{ id: "n1", type: "init-flow", global:"true" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'name');
        n1.should.have.a.property('value', 'value');
        n1.should.have.a.property('valueType', 'str');
        n1.should.not.have.a.property('global');
        n1.should.have.a.property('force', false);
        done();
      }
      catch(err) {
        done(err);
      }
   });
  });

  it('should set contest variable to a string', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:"Qwertzu", valueType:"str", global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should set contest variable to a number', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:3.141592, valueType:"num", global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 3.141592);
        n1.should.have.a.property('valueType', 'num');
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( 3.141592 );
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( 3.141592 );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( 3.141592 );
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( 3.141592 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should set contest variable to a boolean', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:true, valueType:"bool", global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', true);
        n1.should.have.a.property('valueType', 'bool');
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( true );
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( true );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( true );
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( true );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should set contest variable to a JSON', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:'{"foo":21,"bar":25}', valueType:"json", global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value').which.is.an.Object();
        n1.should.have.a.property('valueType', 'json');
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        let cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.have.a.property('foo', 21);
        cv.should.have.a.property('bar', 25);
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.have.a.property('foo', 21);
        cv.should.have.a.property('bar', 25);
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.have.a.property('foo', 21);
        cv.should.have.a.property('bar', 25);
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.have.a.property('foo', 21);
        cv.should.have.a.property('bar', 25);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should set contest variable to a empty object', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:"{}", valueType:"json", global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', {});
        n1.should.have.a.property('valueType', 'json');
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        let cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.be.empty();
        n1.receive({ invalid: true, payload: "ungültiger Wert" });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.be.empty();
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        n1.receive({ reset: true });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.be.empty();
        n1.receive({ payload: "dritter Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "dritter Wert" );
        n1.receive({ topic: "init" });
        await delay(100);
        cv = n1.context().global.get("contextVar");
        cv.should.be.an.Object();
        cv.should.be.empty();
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have force parameter as false', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:"Qwertzu", valueType:"str", force:false, global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        n1.should.have.a.property('force', false);
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        n1.should.have.a.property('force', false);
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
  it('should have force parameter as true', function (done) {
    var flow = [{ id: "n1", type: "init-flow", name: "contextVar", value:"Qwertzu", valueType:"str", force:true, global:"true" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        n1.should.have.a.property('force', true);
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        n1.receive({ payload: "anderer Wert" });
        await delay(100);
        n1.context().global.get("contextVar").should.be.equal( "anderer Wert" );
        await helper._redNodes.stopFlows();
        await helper._redNodes.startFlows();
        n1 = helper.getNode("n1");
        n1.should.have.a.property('name', 'contextVar');
        n1.should.have.a.property('value', 'Qwertzu');
        n1.should.have.a.property('valueType', 'str');
        n1.should.have.a.property('force', true);
        await delay(100);
        should.exist( n1.context().global.get("contextVar") );
        n1.context().global.get("contextVar").should.be.equal( "Qwertzu" );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
