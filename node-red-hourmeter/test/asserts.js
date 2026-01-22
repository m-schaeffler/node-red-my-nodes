var should = require('should');

let cnt = 0;

should.Assertion.add(
  "ValidData",
  function(state)
  {
    this.params = { operator: 'to be a valid data object for hourmeter' };
    const data = this.obj;

    data.should.be.an.Object();
    //console.log(data);
    data.should.have.a.property('counter').which.is.aboveOrEqual(cnt);
    cnt = data.counter;
    data.should.have.a.property('state',state);
    if( state )
    {
      data.should.have.a.property('switchOn').which.is.above(0);
    }
    else
    {
      data.should.not.have.a.property('switchOn');
    }
  },
  false
);
