var should = require("should");
var sinon  = require("sinon");
var helper = require("node-red-node-test-helper");
var node   = require("../sendmail.js");
var child_process = require('child_process');

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
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('from', 'node-red');
        n1.should.have.a.property('to', 'root');
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
      arg4(null,arg1,arg1.toUpperCase());
    });
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('from', 'unittest@mail.lan');
        n1.should.have.a.property('to', 'postmaster@mail.lan');
        n1.receive({ topic: "Unit Test", payload: "this is a test mail for nodered/sendmail unit tests." });
        child_process.execFile.calledOnce.should.be.true();
        child_process.execFile.restore();
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
      arg4(null,arg1,arg1.toUpperCase());
    });
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "Unit Test", payload: "this is a test mail for nodered/sendmail unit tests.", from: "nodered@mail.lan", to: "root@mail.lan" });
        child_process.execFile.calledOnce.should.be.true();
        child_process.execFile.restore();
        done();
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
    });
  });

});
