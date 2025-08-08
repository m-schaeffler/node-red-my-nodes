var should = require('should');

should.Assertion.add(
  "ValidData",
  function(topic)
  {
    this.params = { operator: 'to be a valid data object for debouncing' };
    const data = this.obj;

    data.should.be.an.Object();
    data.should.have.a.property(topic).which.is.a.Object();
    data[topic].should.have.a.property('timer',null);
    data[topic].should.have.a.property('message',null);
  },
  false
);
