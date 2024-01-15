var should = require("should");
var sinon  = require("sinon");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-server.js");
var dgram  = require('dgram');

require("./keys_spec.js");

describe( 'lorawan-server Node', function () {
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
    var flow = [{ id: "n1", type: "lorawan-server", name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('port', 1700);
        n1.should.have.a.property('gateway', null);
        n1.should.have.a.property('stamp', 0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should receive PULL_DATA messages', function (done) {
    var flow = [{ id: "n1", type: "lorawan-server", name: "test", wires: [["n2"],["n3"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" }];
    var receiveLora;
    var spy = sinon.stub(dgram, 'createSocket').callsFake( function(arg1) {
      try {
        arg1.should.be.eql('udp4');
        return {
          bind: function(port) {
            try {
              port.should.be.eql(1700);
            }
            catch(err) {
              done(err);
            }
          },
          on: function(arg1,arg2) {
            try {
              arg1.should.be.oneOf("listening","error","message");
              arg2.should.be.a.Function();
              if( arg1 === "message" )
              {
                receiveLora = arg2;
              }
            }
            catch(err) {
              done(err);
            }
          },
          send: function(arg1,arg2,arg3) {
            //console.log("send");
            //console.log(arg1);
            try {
              arg1.should.be.eql(Buffer.from([2,35,1,4]));
              arg2.should.be.eql(30000);
              arg3.should.be.eql("10.11.12.13");
            }
            catch(err) {
              done(err);
            }
          },
          close: function() {}
        };
      }
      catch(err) {
        dgram.createSocket.restore();
        done(err);
      }
    });
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", function (msg) {
        try {
          console.log(msg.payload);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        dgram.createSocket.calledOnce.should.be.true();
        receiveLora.should.be.a.Function();
        receiveLora(Buffer.from([2,35,1,2,168,64,65,255,255,31,142,184]),{address:"10.11.12.13",port:30000});
        n1.should.have.a.property('gateway').which.is.an.Object();
        n1.gateway.should.have.a.property('port', 30000);
        n1.gateway.should.have.a.property('ip', '10.11.12.13');
        n1.gateway.should.have.a.property('id').which.is.eql('a84041ffff1f8eb8');
        done();
        dgram.createSocket.restore();
      }
      catch(err) {
        dgram.createSocket.restore();
        done(err);
      }
    });
  });

/*
  it('should send out messages', function (done) {
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
              done();
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
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.receive({ topic: "Unit Test", payload: "this is a test mail for nodered/sendmail unit tests.", from: "nodered@mail.lan", to: "root@mail.lan" });
        child_process.execFile.calledOnce.should.be.true();
        child_process.execFile.restore();
      }
      catch(err) {
        child_process.execFile.restore();
        done(err);
      }
    });
  });
*/
});
