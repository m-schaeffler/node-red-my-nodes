var should = require('should');

let cnt = 0;

should.Assertion.add(
  "ValidData",
  function(state,start=false)
  {
    this.params = { operator: 'to be a valid data object for hourmeter' };
    const data = this.obj;

    if( start )
    {
      cnt = 0;
    }

    data.should.be.an.Object();
    //console.log(data);
    switch( state )
    {
      case true:
        data.should.have.a.property('state',state);
        data.should.have.a.property('switchOn').which.is.above(0);
        break;
      case false:
        data.should.have.a.property('state',state);
        data.should.not.have.a.property('switchOn');
        break;
      case "reset":
        cnt = 0;
        data.should.not.have.a.property('state');
        data.should.not.have.a.property('switchOn');
        break;
      case "invalid":
        data.should.have.a.property('state');
        data.should.not.have.a.property('switchOn');
        break;
      case "set":
        cnt=12*3600;
        data.should.not.have.a.property('state');
        data.should.not.have.a.property('switchOn');
    }
    data.should.have.a.property('counter').which.is.aboveOrEqual(cnt);
    cnt = data.counter;
  },
  false
);
