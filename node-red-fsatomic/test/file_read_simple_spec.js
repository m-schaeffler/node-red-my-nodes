var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../file_read_simple.js");
var fs     = require("fs");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fileReadSimple Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  const fn_utf    = "test/test_utf.txt";
  const fn_utf16  = "test/test_utf16le.txt";
  const fn_latin1 = "test/test_latin1.txt";
  const fn_base64 = "test/test.base64";
  const fn_json   = "test/test.json";
  const fn_empty  = "test/test.empty";

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "fileReadSimple", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('encoding', "utf8");
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

  it('needs a filename', function (done) {
    var flow = [{ id: "n1", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid messages', function (done) {
    var flow = [{ id: "n1", filename:fn_utf, type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg.payload);
        try {
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_utf);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger", invalid: true });
        await delay(100);
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

  it('should read a utf8 file', function (done) {
    var flow = [{ id: "n1", filename:fn_utf, encoding:"utf8", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_utf);
          msg.should.have.property('encoding','utf8');
          msg.should.have.property('payload',fs.readFileSync(fn_utf,{encoding:"utf8"}));
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_utf);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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

  it('should read a utf16 file', function (done) {
    var flow = [{ id: "n1", encoding:"message", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_utf16);
          msg.should.have.property('encoding','utf16le');
          msg.should.have.property('payload',fs.readFileSync(fn_utf,{encoding:"utf8"}));
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', "");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger", filename:fn_utf16, encoding:"utf16le" });
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

  it('should read a latin1 file', function (done) {
    var flow = [{ id: "n1", filename:fn_latin1, encoding:"latin1", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_latin1);
          msg.should.have.property('encoding','latin1');
          msg.should.have.property('payload',fs.readFileSync(fn_utf,{encoding:"utf8"}));
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_latin1);
        n1.should.have.a.property('encoding', "latin1");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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

  it('should read an empty file', function (done) {
    var flow = [{ id: "n1", filename:fn_empty, type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_empty);
          msg.should.have.property('encoding','utf8');
          msg.should.have.property('payload',"");
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_empty);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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
/*
  it('should read a base64 file', function (done) {
    var flow = [{ id: "n1", filename:fn_base64, encoding:"base64", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_base64);
          msg.should.have.property('payload',"");
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_base64);
        n1.should.have.a.property('encoding', "base64");
        n1.should.have.a.property('format', "string");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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
*/
  it('should read a json file', function (done) {
    var flow = [{ id: "n1", filename:fn_json, format:"json", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_json);
          msg.should.have.property('encoding','utf8');
          msg.should.have.property('payload', { topic: 'test', value: 123456, flag: true });
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_json);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "json");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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

  it('should not read invalid json', function (done) {
    var flow = [{ id: "n1", filename:fn_utf, encoding:"utf8", format:"json", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_utf);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "json");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should read to a buffer', function (done) {
    var flow = [{ id: "n1", filename:fn_utf, format:"buffer", type: "fileReadSimple", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          ++c;
          msg.should.have.property('topic',"trigger");
          msg.should.have.property('filename',fn_utf);
          msg.should.have.property('encoding',null);
          msg.should.have.property('payload',fs.readFileSync(fn_utf));
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('filename', fn_utf);
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('format', "buffer");
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ topic: "trigger" });
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

});
