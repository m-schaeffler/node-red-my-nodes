var should = require('should');

should.Assertion.add(
  "ValidData",
  function(topic)
  {
    this.params = { operator: 'to be a valid data object for hourmeter' };
    const data = this.obj;

    data.should.be.an.Object();
    console.log(data);
    //data.should.have.a.property(topic).which.is.a.Object();
    data.should.have.a.property('counter',0);
    //data[topic].should.have.a.property('message',null);
  },
  false
);
