var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../tcping.js");
var net    = require("net");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'tcPing Node', function () {
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
    var flow = [{ id: "n1", type: "tcPing", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', '');
        n1.should.have.a.property('port', 80);
        n1.should.have.a.property('family', 0);
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

 it('should ping a fixed URL', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "www.google.com", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          msg.should.have.property('topic',"foobar");
          msg.should.have.property('payload').which.is.within(1,150);
          msg.should.have.property('ping').which.is.an.Object();
          msg.ping.should.have.property('host','www.google.com');
          msg.ping.should.have.property('port',443);
          msg.ping.should.have.property('family').which.is.a.Number();
          msg.ping.should.have.property('ip');
          switch( msg.ping.family )
          {
              case 4:
                  net.isIPv4( msg.ping.ip ).should.match( true );
                  break;
              case 6:
                  net.isIPv6( msg.ping.ip ).should.match( true );
                  break;
              default:
                  done("invalid family");
          }
          msg.ping.should.not.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','www.google.com');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
        await delay(300);
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

  it('should ping an invalid URL', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "foo:bar", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"foobar");
          msg.should.have.property('payload',false);
          msg.should.have.property('ping').which.is.an.Object();
          msg.ping.should.have.property('host','foo:bar');
          msg.ping.should.have.property('port',443);
          msg.ping.should.have.property('family',null);
          msg.ping.should.have.property('ip',null);
          msg.ping.should.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','foo:bar');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
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

  it('should ping an invalid Address', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "foo.bar", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"foobar");
          msg.should.have.property('payload',false);
          msg.should.have.property('ping').which.is.an.Object();
          msg.ping.should.have.property('host','foo.bar');
          msg.ping.should.have.property('port',443);
          msg.ping.should.have.property('family',null);
          msg.ping.should.have.property('ip',null);
          msg.ping.should.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','foo.bar');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
        await delay(100);
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

  it('should ping an invalid IP', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "192.168.254.254", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"foobar");
          msg.should.have.property('payload',false);
          msg.should.have.property('ping').which.is.an.Object();
          msg.ping.should.have.property('host','192.168.254.254');
          msg.ping.should.have.property('port',443);
          msg.ping.should.have.property('family',4);
          msg.ping.should.have.property('ip','192.168.254.254');
          msg.ping.should.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','192.168.254.254');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
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

  it('should timeout', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "192.168.3.254", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic',"foobar");
          msg.should.have.property('payload',false);
          msg.should.have.property('ping').which.is.an.Object();
          msg.ping.should.have.property('host','192.168.3.254');
          msg.ping.should.have.property('port',443);
          msg.ping.should.have.property('family',4);
          msg.ping.should.have.property('ip','192.168.3.254');
          msg.ping.should.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','192.168.3.254');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
        await delay(4000);
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

  it('should be closed while connecting', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "192.168.3.254", port:"443", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c;
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','192.168.3.254');
        n1.should.have.a.property('port', 443);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});
