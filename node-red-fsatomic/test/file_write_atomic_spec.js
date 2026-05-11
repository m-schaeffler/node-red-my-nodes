
var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../file_write_atomic.js");
var fs     = require("fs");
var os     = require("os");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fileWriteAtomic Node', function () {
    "use strict";

  const fn  = "/tmp/test_1.txt";
  const dir = "/tmp/foobar";
  const fn2 = dir+"/test_2.txt";
  const fn3 = "/tmp/test_2.txt";
  const utf = "Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich";
  const str = "Franz jagt im komplett verwahrlosten Taxi quer durch Bayern";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('jsonPretty', null);
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
    var flow = [{ id: "n1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: "Test" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid messages', function (done) {
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: str, invalid: true });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn).should.be.False();
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should write a string to a file', function (done) {
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: str });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(str.length);
        fs.readFileSync(fn,{encoding:"utf8"}).should.match(str);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should append EOL to a string', function (done) {
    var flow = [{ id: "n1", filename:fn, appendNewline:true, encoding:"latin1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "latin1");
        n1.should.have.a.property('appendNewline', true);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: str });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(str.length+1);
        fs.readFileSync(fn,{encoding:"latin1"}).should.match(str+os.EOL);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should not create missing directories', function (done) {
    var flow = [{ id: "n1", encoding:"utf8", createDir:false, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(dir).should.be.False();
        fs.existsSync(fn2).should.be.False();
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ filename: fn2, payload: str });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        fs.existsSync(dir).should.be.False();
        fs.existsSync(fn2).should.be.False();
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should create missing directories', function (done) {
    var flow = [{ id: "n1", encoding:"utf8", createDir:true, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(dir).should.be.False();
        fs.existsSync(fn2).should.be.False();
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', "utf8");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', true);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ filename: fn2, payload: str });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(dir).should.be.True();
        fs.existsSync(fn2).should.be.True();
        fs.statSync(fn2).size.should.match(str.length);
        fs.readFileSync(fn2,{encoding:"utf8"}).should.match(str);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn2,{force:true});
        fs.rmdirSync(dir);
      }
    });
  });

  it('should write unicode to a file as unicode', function (done) {
    var flow = [{ id: "n1", filename:fn, encoding:"message", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: utf, encoding: "utf8" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(utf.length+4);
        fs.readFileSync(fn,{encoding:"utf8"}).should.match(utf);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write unicode to a file as latin1', function (done) {
    var flow = [{ id: "n1", filename:fn, encoding:"latin1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "latin1");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: utf });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(utf.length);
        fs.readFileSync(fn,{encoding:"latin1"}).should.match(utf);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write unicode to a file as 16bit unicode', function (done) {
    var flow = [{ id: "n1", filename:fn, encoding:"utf16le", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "utf16le");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload: utf, encoding: "utf8" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(utf.length*2);
        fs.readFileSync(fn,{encoding:"utf16le"}).should.match(utf);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write an empty file', function (done) {
    var flow = [{ id: "n1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ filename: fn });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(0);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write a payload==null', function (done) {
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:null });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(0);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write an empty string', function (done) {
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:"" });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(0);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write a number', function (done) {
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:123456 });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(6);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write an object', function (done) {
    const obj = {test:"test",value:123,flag:true};
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('jsonPretty', null);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:obj });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(39);
        JSON.parse(fs.readFileSync(fn,{encoding:"utf8"})).should.match(obj);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write a formated object', function (done) {
    const obj = {test:"test",value:123,flag:true};
    var flow = [{ id: "n1", filename:fn, jsonPretty:true, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('jsonPretty', 3);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:obj });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(55);
        JSON.parse(fs.readFileSync(fn,{encoding:"utf8"})).should.match(obj);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write a buffer', function (done) {
    const buf = Buffer.from(utf);
    var flow = [{ id: "n1", filename:fn, encoding:"latin1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "latin1");
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:buf });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(utf.length+4);
        fs.readFileSync(fn,{encoding:"utf8"}).should.match(utf);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should write a binary buffer', function (done) {
    const buf = Buffer.alloc(25,0xA5);
    var flow = [{ id: "n1", filename:fn, type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ payload:buf });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(25);
        fs.readFileSync(fn).should.match(buf);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

  it('should have locking', function (done) {
    var flow = [{ id: "n1", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', "");
        n1.should.have.a.property('encoding', null);
        n1.should.have.a.property('appendNewline', false);
        n1.should.have.a.property('createDir', false);
        n1.should.have.a.property('showState', false);
        await delay(50);
        n1.receive({ filename:fn,  payload: str });
        n1.receive({ filename:fn,  payload: utf });
        n1.receive({ filename:fn3, payload: str });
        n1.receive({ filename:fn3, payload: utf });
        await delay(100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        fs.existsSync(fn+".tmp").should.be.False();
        fs.existsSync(fn).should.be.True();
        fs.statSync(fn).size.should.match(str.length);
        fs.readFileSync(fn,{encoding:"utf8"}).should.match(str);
        fs.existsSync(fn3+".tmp").should.be.False();
        fs.existsSync(fn3).should.be.True();
        fs.statSync(fn3).size.should.match(str.length);
        fs.readFileSync(fn3,{encoding:"utf8"}).should.match(str);
        done();
      }
      catch(err) {
        done(err);
      }
      finally{
        fs.rmSync(fn,{force:true});
      }
    });
  });

});
