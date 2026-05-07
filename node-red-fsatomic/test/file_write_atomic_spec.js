var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../file_write_atomic.js");
var fs     = require("fs");

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
    var flow = [{ id: "n1", filename:fn, encoding:"utf8", type: "fileWriteAtomic", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        fs.existsSync(fn).should.be.False();
        n1.should.have.a.property('filename', fn);
        n1.should.have.a.property('encoding', "utf8");
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
        fs.statSync(fn).size.should.match(utf.length+4);
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
