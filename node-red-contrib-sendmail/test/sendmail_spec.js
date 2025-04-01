var should = require("should");
var sinon  = require("sinon");
var helper = require("node-red-node-test-helper");
var node   = require("../sendmail.js");
var child_process = require('child_process');

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'sendmail Node', function () {
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
    var flow = [{ id: "n1", type: "sendmail", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('from', 'node-red');
        n1.should.have.a.property('to', 'root');
        await delay(50);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should send an email with defaults', function (done) {
    var flow = [{ id: "n1", type: "sendmail", from:"unittest@mail.lan", to:"postmaster@mail.lan", name: "test" }];
    var spy = sinon.stub(child_process, 'execFile').callsFake( function(arg1, arg2, arg3, arg4) {
      try {
        arg1.should.be.eql('/usr/bin/mail');
        arg2.should.be.an.Array();
        arg2[0].should.be.eql('-s');
        arg2[1].should.be.eql('Unit Test');
        arg2[2].should.be.eql('-r');
        arg2[3].should.be.eql('unittest@mail.lan');
        arg2[4].should.be.eql('-a');
        arg2[5].should.be.eql('Content-type: text/html');
        arg2[6].should.be.eql('--');
        arg2[7].should.be.eql('postmaster@mail.lan');
        arg3.should.be.an.Object();
        arg4.should.be.a.Function();
        arg4(null,arg1,arg1.toUpperCase());
        return {
          stdin: {
            write:function(str){
              try {
                str.should.be.eql('this is a test mail for nodered/sendmail unit tests.\0x0B.\x0B\x04');
              }
              catch(err) {
                done(err);
              }
            },
            end:function(){
              //done();
            }
          }
        };
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
    });
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('from', 'unittest@mail.lan');
        n1.should.have.a.property('to', 'postmaster@mail.lan');
        await delay(50);
        n1.receive({ topic: "Unit Test", payload: "this is a test mail for nodered/sendmail unit tests." });
        await delay(50);
        child_process.execFile.calledOnce.should.be.true();
        child_process.execFile.restore();
        await delay(50);
        done();
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
    });
  });

  it('should send an email with from / to', function (done) {
    var flow = [{ id: "n1", type: "sendmail", name: "test" }];
    var spy = sinon.stub(child_process, 'execFile').callsFake( function(arg1, arg2, arg3, arg4) {
      try {
        arg1.should.be.eql('/usr/bin/mail');
        arg2.should.be.an.Array();
        arg2[0].should.be.eql('-s');
        arg2[1].should.be.eql('Unit Test');
        arg2[2].should.be.eql('-r');
        arg2[3].should.be.eql('nodered@mail.lan');
        arg2[4].should.be.eql('-a');
        arg2[5].should.be.eql('Content-type: text/html');
        arg2[6].should.be.eql('--');
        arg2[7].should.be.eql('root@mail.lan');
        arg3.should.be.an.Object();
        arg4.should.be.a.Function();
        return {
          stdin: {
            write:function(str){
              try {
                str.should.be.eql('this is a test mail for nodered/sendmail unit tests.\0x0B.\x0B\x04');
              }
              catch(err) {
                done(err);
              }
            },
            end:function(){
              //done();
            }
          }
        };
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
      arg4(null,arg1,arg1.toUpperCase());
    });
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic: "Unit Test", payload: "this is a test mail for nodered/sendmail unit tests.", from: "nodered@mail.lan", to: "root@mail.lan" });
        await delay(50);
        child_process.execFile.calledOnce.should.be.true();
        child_process.execFile.restore();
        await delay(50);
        done();
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
    });
  });

});
