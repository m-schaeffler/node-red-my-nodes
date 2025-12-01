var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../pwm_output.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'pmw_output Node', function () {
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
    var flow = [{ id: "n1", type: "pwmOutput", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('cyclic', 60000);
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

  it('should be switched on and off', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.1", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic',"input"+c);
          msg.should.have.property('payload',!Boolean(c%2));
          msg.should.have.property('pwm');
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('cyclic', 100);
        await delay(50);
        n1.receive({ topic: "input1", payload: 0 });
        await delay(1000);
        c.should.match( 1 );
        n1.receive({ topic: "input2", payload: 1 });
        await delay(1000);
        c.should.match( 2 );
        n1.receive({ topic: "input3", payload: 0 });
        await delay(1000);
        c.should.match( 3 );
        n1.receive({ topic: "input4", payload: 100 });
        await delay(50);
        c.should.match( 4 );
        n1.receive({ topic: "input5", payload: -100 });
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

  it('should generate PWM 0.25, ends with 0', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload',Boolean(c%2));
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( c<6 ? 500*0.25 : 50, 10 );
          }
          if( c == 1 || c == 6 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.25 });
        await delay(50);
        c.should.match( 1 );
        await delay(1000);
        c.should.match( 5 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 6 );
        await delay(1000);
        c.should.match( 6 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.25, ends with 1', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload', Boolean(c%2) );
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( 500*0.25, 10 );
          }
          if( c == 1 || c == 6 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.25 });
        await delay(50);
        c.should.match( 1 );
        await delay(1000);
        c.should.match( 5 );
        n1.receive({ topic:"PWM", payload: 1 });
        await delay(50);
        c.should.match( 5 );
        await delay(1000);
        c.should.match( 5 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.25 after on', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload', c==1?true:Boolean((c-1)%2) );
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( c==2?750:500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( 500*0.25, 10 );
          }
          if( c <= 2 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 1 });
        await delay(50);
        c.should.match( 1 );
        await delay(700);
        c.should.match( 1 );
        n1.receive({ topic:"PWM", payload: 0.25 });
        await delay(50);
        c.should.match( 2 );
        await delay(1100);
        c.should.match( 7 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 7 );
        await delay(1000);
        c.should.match( 7 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.5, ends with 0', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload',Boolean(c%2));
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( c<6 ? 500*0.5 : 50, 10 );
          }
          if( c == 1 || c == 6 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.5 });
        await delay(50);
        c.should.match( 1 );
        await delay(1000);
        c.should.match( 5 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 6 );
        await delay(1000);
        c.should.match( 6 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.75, ends with 0', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload',Boolean(c%2));
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( c<6 ? 500*0.75 : 50, 10 );
          }
          if( c == 1 || c == 6 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.75 });
        await delay(50);
        c.should.match( 1 );
        await delay(1000);
        c.should.match( 5 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 6 );
        await delay(1000);
        c.should.match( 6 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.01, ends with 0', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload',Boolean(c%2));
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( 500*0.01, 10 );
          }
          if( c == 1 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.01 });
        await delay(50);
        c.should.match( 2 );
        await delay(1000);
        c.should.match( 6 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 6 );
        await delay(1000);
        c.should.match( 6 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should generate PWM 0.99, ends with 0', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      var start;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','PWM');
          msg.should.have.property('payload',Boolean(c%2));
          if( msg.payload )
          {
              if( start )
              {
                  const delta = Date.now() - start;
                  delta.should.be.approximately( 500, 10 );
              }
              start = Date.now();
          }
          else
          {
              const delta = Date.now() - start;
              delta.should.be.approximately( c<6 ? 500*0.99 : 50, 10 );
          }
          if( c == 1 || c == 6 )
          {
               msg.should.have.property('pwm');
          }
          else
          {
               msg.should.not.have.property('pwm');
          }
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('cyclic', 500);
        await delay(50);
        n1.receive({ topic:"PWM", payload: 0.99 });
        await delay(50);
        c.should.match( 1 );
        await delay(1000);
        c.should.match( 5 );
        n1.receive({ topic:"PWM", payload: 0 });
        await delay(50);
        c.should.match( 6 );
        await delay(1000);
        c.should.match( 6 )
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not use invalid data', function (done) {
    var flow = [{ id: "n1", type: "pwmOutput", cyclicTime:"0.1", name: "test", wires: [["n2"]] },
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
      try{
        n1.should.have.a.property('cyclic', 100);
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0.5 });
        await delay(50);
        n1.receive({ invalid:true, payload: 1 });
        await delay(50);
        n1.receive({ invalid:true, payload: false });
        await delay(50);
        n1.receive({ invalid:true, payload: true });
        await delay(50);
        n1.receive({ invalid:true, payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: 0 });
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

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "pwmOutput", name: "test", property:"payload.value", wires: [["n2"]] },
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
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
        await delay(50);
        n1.receive({ payload: {a:0,value:1,b:0} });
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

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "pwmOutput", name: "test", property:"1-payload", propertyType:"jsonata", wires: [["n2"]] },
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
        n1.should.have.a.property('property', "1-payload");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: 0 });
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

});
