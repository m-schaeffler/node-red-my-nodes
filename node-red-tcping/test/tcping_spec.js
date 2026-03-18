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

  it('should ping a fixed URL, IPv4', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "www.google.com", port: "443", family: "4", name: "test", wires: [["n2"]], z: "flow" },
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
          msg.ping.should.have.property('family',4);
          msg.ping.should.have.property('ip');
          net.isIPv4( msg.ping.ip ).should.match( true );
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
        n1.should.have.a.property('family', 4);
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

  it('should ping a fixed URL, IPv6', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host: "www.google.com", port: "443", family: "6", name: "test", wires: [["n2"]], z: "flow" },
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
          msg.ping.should.have.property('family',6);
          msg.ping.should.have.property('ip');
          net.isIPv6( msg.ping.ip ).should.match( true );
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
        n1.should.have.a.property('family', 6);
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

  it('should ping with string payload', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", family: "0", name: "test", wires: [["n2"]], z: "flow" },
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
          msg.ping.should.have.property('host','www.google.de');
          msg.ping.should.have.property('port',c==1?443:80);
          msg.ping.should.have.property('family').which.is.within(4,6);
          msg.ping.should.have.property('ip').which.is.a.String();
          msg.ping.should.not.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','');
        n1.should.have.a.property('port', 80);
        n1.should.have.a.property('family', 0);
        await delay(50);
        n1.receive({ topic:"foobar", payload:"www.google.de" });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"foobar", payload:"www.google.de:443" });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:"" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:"www.google.de:" });
        n1.receive({ topic:"foobar", payload:"www.google.de:0" });
        n1.receive({ topic:"foobar", payload:"www.google.de:-1" });
        n1.receive({ topic:"foobar", payload:"www.google.de:0x10000" });
        n1.receive({ topic:"foobar", payload:"www.google.de:foobar" });
        n1.receive({ topic:"foobar", payload:"www.google.de:80.5" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(7);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should ping with object payload', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", family: "4", name: "test", wires: [["n2"]], z: "flow" },
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
          msg.ping.should.have.property('host','www.nodejs.org');
          msg.ping.should.have.property('port',c==1?443:80);
          msg.ping.should.have.property('family',c==1?6:4);
          msg.ping.should.have.property('ip').which.is.a.String();
          msg.ping.should.not.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','');
        n1.should.have.a.property('port', 80);
        n1.should.have.a.property('family', 4);
        await delay(50);
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org"} });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:443,family:6} });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{} });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:""} });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:0} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:-1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:0x10000} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:"foobar"} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:80.5} });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(7);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:"foobar"} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:-1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:3} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:5} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:7} });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(13);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should ping with fixed URL and object payload', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "tcPing", host:"www.nodered.org", family: "4", name: "test", wires: [["n2"]], z: "flow" },
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
          msg.ping.should.have.property('host','www.nodejs.org');
          msg.ping.should.have.property('port',c==1?443:80);
          msg.ping.should.have.property('family',c==1?6:4);
          msg.ping.should.have.property('ip').which.is.a.String();
          msg.ping.should.not.have.property('error');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host','www.nodered.org');
        n1.should.have.a.property('port', 80);
        n1.should.have.a.property('family', 4);
        await delay(50);
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org"} });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:443,family:6} });
        await delay(300);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{} });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:""} });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:0} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:-1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:0x10000} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:"foobar"} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",port:80.5} });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(7);
        c.should.match( 2 );
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:"foobar"} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:-1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:1} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:3} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:5} });
        n1.receive({ topic:"foobar", payload:{host:"www.nodejs.org",family:7} });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(13);
        c.should.match( 2 );
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
        n1.error.should.have.callCount(1);
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
        n1.error.should.have.callCount(1);
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
        n1.error.should.have.callCount(1);
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
