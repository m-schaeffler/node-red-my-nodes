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

  it('should receive PULL_DATA messages and afterwards send a message', function (done) {
    var flow = [{ id: "n1", type: "lorawan-server", name: "test", wires: [["n2"],["n3"]] },
                { id: "n2", type: "helper" },
                { id: "n3", type: "helper" }];
    var receiveLora;
    var c = 0;
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
              c++;
              arg1.should.be.eql(Buffer.from(c===1?[2,35,1,4]:[0x02,0x00,0x01,0x03,0x7b,0x22,0x66,0x72,0x65,0x71,0x22,0x3a,0x38,0x36,0x39,0x2e,0x35,0x32,0x35,0x2c,0x22,0x6d,0x6f,0x64,0x75,0x22,0x3a,0x22,0x4c,0x4f,0x52,0x41,0x22,0x2c,0x22,0x63,0x6f,0x64,0x72,0x22,0x3a,0x22,0x34,0x2f,0x35,0x22,0x7d]));
              arg2.should.be.eql(30000);
              arg3.should.be.eql("10.11.12.13");
              if( c === 2 ) {
                done();
              }
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
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
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
        n1.receive({payload:{freq:869.525,modu:"LORA",codr:"4/5"}});
        dgram.createSocket.restore();
      }
      catch(err) {
        dgram.createSocket.restore();
        done(err);
      }
    });
  });

  it('should not send message without a PULL_DATA messages', function (done) {
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
            try {
              arg1.should.fail();
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
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        dgram.createSocket.calledOnce.should.be.true();
        receiveLora.should.be.a.Function();
        n1.should.have.a.property('gateway',null);
        n1.receive({payload:{freq:869.525,modu:"LORA",codr:"4/5"}});
        done();
        dgram.createSocket.restore();
      }
      catch(err) {
        dgram.createSocket.restore();
        done(err);
      }
    });
  });

  it('should receive PUSH_DATA messages', function (done) {
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
              arg1.should.be.eql(Buffer.from([2,35,1,1]));
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
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          console.log(msg.payload);
          msg.should.fail();
        }
        catch(err) {
          done(err);
        }
      });
      try {
        dgram.createSocket.calledOnce.should.be.true();
        receiveLora.should.be.a.Function();
        receiveLora(Buffer.from([2,19,132,0,168,64,65,255,255,31,142,184,123,34,115,116,97,116,34,58,123,34,116,105,109,101,34,58,34,50,48,50,52,45,48,49,45,49,53,32,48,56,58,49,56,58,48,53,32,85,84,67,34,44,34,114,120,110,98,34,58,48,44,34,114,120,111,107,34,58,48,44,34,114,120,102,119,34,58,48,44,34,97,99,107,114,34,58,57,57,46,56,44,34,100,119,110,98,34,58,51,55,57,56,44,34,116,120,110,98,34,58,48,44,34,112,102,114,109,34,58,34,83,88,49,51,48,56,34,44,34,109,97,105,108,34,58,34,100,114,97,103,105,110,111,45,49,102,56,101,98,56,64,100,114,97,103,105,110,111,46,99,111,109,34,44,34,100,101,115,99,34,58,34,68,114,97,103,105,110,111,32,76,111,82,97,87,65,78,32,71,97,116,101,119,97,121,34,125,125]),{address:"10.11.12.13",port:30000});
        n1.should.have.a.property('gateway',null);
        done();
        dgram.createSocket.restore();
      }
      catch(err) {
        dgram.createSocket.restore();
        done(err);
      }
    });
  });

});
