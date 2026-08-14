var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../matter_shelly_sim.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'matter_shelly_sim Node', function () {
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
    var flow = [{ id: "n1", type: "matterShellySim", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should just forward unknown messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"FooBar");
          msg.should.have.a.property('payload',{ command:"levelcontrol.movetolevel", data: 50 });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"FooBar", payload: { command:"levelcontrol.movetolevel", data: 50 } });
        await delay(50);
        n1.log.should.have.callCount(0);
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

  it('should convert output messages with simple data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Output");
          msg.should.have.a.property('payload',{ command:c<12?(c%2?"onoff.off":"onoff.on"):"onoff.toggle", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: true } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: false } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "true" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "false" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: 1 } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: 0 } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "1" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "0" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "on" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "off" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "on" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "disabled" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "toggle" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "invalid" } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 13 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert output messages with complex data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Output");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: { turn:true } } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: { turn:false } } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: { on:true } } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: { on:false } } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert relay messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Relay");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: true } });
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
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

  it('should convert switch messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Switch");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Switch", payload: { command:"switch", data: true } });
        await delay(50);
        n1.receive({ topic:"Switch", payload: { command:"switch", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
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

  it('should convert light messages with simple data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Light");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: true } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
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

  it('should convert light messages with complex data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Light");
          switch( c )
          {
            case 5:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:127,transitionTime:1} });
              break;
            case 6:
            case 12:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:0,transitionTime:1} });
              break;
            case 7:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:254,transitionTime:50} });
              break;
            case 8:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetocolortemperature", data: {colorTemperatureMireds:370,transitionTime:1} });
              break;
            case 9:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:191,transitionTime:1} });
              break;
            case 10:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetocolortemperature", data: {colorTemperatureMireds:222,transitionTime:1} });
              break;
            case 11:
            case 13:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetohueandsaturation", data: {hue:0,saturation:0,transitionTime:1} });
              break;
            case 14:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:254,transitionTime:1} });
              break;
            case 16:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:199,transitionTime:1} });
              break;
            case 15:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetohueandsaturation", data: {hue:0,saturation:254,transitionTime:1} });
              break;
            case 18:
            case 22:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:149,transitionTime:1} });
              break;
            case 17:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetohueandsaturation", data: {hue:85,saturation:254,transitionTime:1} });
              break;
            case 20:
              msg.should.have.a.property('payload',{ command: "levelcontrol.movetolevel", data: {level:100,transitionTime:1} });
              break;
            case 19:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetohueandsaturation", data: {hue:169,saturation:254,transitionTime:1} });
              break;
            case 21:
              msg.should.have.a.property('payload',{ command: "colorcontrol.movetohueandsaturation", data: {hue:148,saturation:169,transitionTime:1} });
              break;
            default:
              msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          }
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { turn:true } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { turn:false } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { on:true } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { on:false } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { on:true, brightness:50 } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { brightness:0 } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { brightness:100, transition:5 } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { transition:1 } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { temp:2700 } } });
        await delay(50);
        c.should.match( 9 );
        n1.receive({ topic:"Light", payload: { command:"light", data: { brightness:75, temp:4500 } } });
        await delay(50);
        c.should.match( 11 );
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:{red:0,green:0,blue:0} } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:{red:255,green:255,blue:255} } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:{red:200,green:0,blue:0} } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:[0,150,0] } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:[0,0,100] } } });
        await delay(50);
        n1.receive({ topic:"Light", payload: { command:"light", data: { rgb:[50,100,150 ] } } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 23 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert cover messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Cover");
          switch( c )
          {
            case 0:
              msg.should.have.a.property('payload',{ command: "windowcovering.open", data: null });
              break;
            case 1:
              msg.should.have.a.property('payload',{ command: "windowcovering.close", data: null });
              break;
            case 2:
              msg.should.have.a.property('payload',{ command: "windowcovering.stop", data: null });
              break;
            case 3:
              msg.should.have.a.property('payload',{ command: "windowcovering.gotolift", data: 80 });
              break;
            default:
              done("too much messages");
          }
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Cover", payload: { command:"cover", data: "open" } });
        await delay(50);
        n1.receive({ topic:"Cover", payload: { command:"cover", data: "close" } });
        await delay(50);
        n1.receive({ topic:"Cover", payload: { command:"cover", data: "stop" } });
        await delay(50);
        n1.receive({ topic:"Cover", payload: { command:"position", data: 80 } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert roller messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Roller");
          switch( c )
          {
            case 0:
              msg.should.have.a.property('payload',{ command: "windowcovering.open", data: null });
              break;
            case 1:
              msg.should.have.a.property('payload',{ command: "windowcovering.close", data: null });
              break;
            case 2:
              msg.should.have.a.property('payload',{ command: "windowcovering.stop", data: null });
              break;
            case 3:
              msg.should.have.a.property('payload',{ command: "windowcovering.gotolift", data: 80 });
              break;
            default:
              done("too much messages");
          }
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Roller", payload: { command:"roller", data: "open" } });
        await delay(50);
        n1.receive({ topic:"Roller", payload: { command:"roller", data: "close" } });
        await delay(50);
        n1.receive({ topic:"Roller", payload: { command:"roller", data: "stop" } });
        await delay(50);
        n1.receive({ topic:"Roller", payload: { command:"position", data: 80 } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 4 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

