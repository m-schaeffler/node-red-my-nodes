var should = require('should');

should.Assertion.add(
  // the name of the custom assertion
  'NumberOrNull',

  // the implementation of the custom assertion
  function() {
      // `this.params` defines what text is associated with the
      // pass/fail state of your custom assertion
      this.params = { operator: 'to ba a number or null' };

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

