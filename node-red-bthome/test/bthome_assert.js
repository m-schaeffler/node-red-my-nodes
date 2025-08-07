var should = require('should');

should.Assertion.add(
  // the name of the custom assertion
  'NumberOrNull',

  // the implementation of the custom assertion
  function() {
      // `this.params` defines what text is associated with the
      // pass/fail state of your custom assertion
      this.params = { operator: 'to be a number or null' };

      // `this.obj` refers to the object in the should.js chain upon
      // which the assertion will be applied.
      // the assertion itself, just as above
      const obj = this.obj;

      if( obj !== null )
      {
          obj.should.be.a.Number();
      }
  },

  // is this a getter, meaning no function call?
  //     foo.should.be.a.String         // getter
  //     foo.should.be.equal('string'); // not a getter
  //
  false
);

should.Assertion.add(
  "ValidData",
  function(t,values,gw,tests=null)
  {
    this.params = { operator: 'to be a valid data object for a bthome device' };
    const data = this.obj;

    data.should.be.an.Object();
    data.should.have.a.property(t);
    const v = data[t];
    v.should.be.an.Object();
    v.should.have.a.property("pid").which.is.a.NumberOrNull();
    v.should.have.a.property("gw").which.is.an.Object();
    if( gw )
    {
      v.should.have.a.property("time").which.is.approximately(Date.now()-50,20);
      v.gw.should.have.a.property(gw).which.is.an.Object();
      v.gw[gw].should.have.a.property("time").which.is.approximately(Date.now()-50,20);
      v.gw[gw].should.have.a.property("rssi").which.is.within(-100,-40);
    }
    if( values )
    {
      for( const i in values )
      {
        v.should.have.a.property(i,values[i]);
      }
    }
    if( tests )
    {
      v.should.have.a.property("data").which.is.an.Object();
      for( const i in tests )
      {
        v.data.should.have.a.property(i,tests[i]);
      }
    }
    else
    {
      v.should.not.have.a.property("data");
    }
  },
  false
);
