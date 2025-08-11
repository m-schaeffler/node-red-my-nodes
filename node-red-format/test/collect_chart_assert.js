var should = require('should');

should.Assertion.add(
  "ValidItem",
  function(c,t,v)
  {
    this.params = { operator: 'to be a valid data point of a chart' };
    const data = this.obj;

    data.should.be.an.Object();
    data.should.have.a.property('c',c);
    if( t != null )
       data.should.have.a.property('t').which.is.approximately(Date.now()-t,30);
    else
       data.should.have.a.property('t',null);
    if( v !== null )
       data.should.have.a.property('v',Number(v));
    else
       data.should.not.have.a.property('v');
  },
  false
);
