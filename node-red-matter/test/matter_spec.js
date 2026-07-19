var should = require("should");
var Matter = require("../matter.js");

describe( 'matter data handling', function () {
  "use strict";

  const rvc = '[{"node_id":8,"date_commissioned":"2026-07-09T11:07:04.901000","last_interview":"2026-07-19T13:11:49.075000","interview_version":6,"available":true,"is_bridge":false,"attributes":{"0/29/65533":2,"0/29/65532":0,"0/29/0":[{"0":22,"1":1}],"0/29/1":[29,31,40,48,50,51,60,62,63],"0/29/2":[],"0/29/3":[1],"0/29/65531":[0,1,2,3,65528,65529,65531,65532,65533],"0/29/65529":[],"0/29/65528":[],"0/31/65533":2,"0/31/65532":0,"0/31/0":[{"1":5,"2":2,"3":[112233],"4":null,"254":1}],"0/31/2":4,"0/31/3":3,"0/31/4":4,"0/31/65531":[0,2,3,4,65528,65529,65531,65532,65533],"0/31/65529":[],"0/31/65528":[],"0/40/13":"https://www.roborock.com","0/40/14":"Roborock Robotic Vacuum Cleaner","0/40/15":"RBFMZS52100492","0/40/18":"ABD3688954F9BC94","0/40/21":17039360,"0/40/22":1,"0/40/65533":4,"0/40/0":18,"0/40/1":"Roborock","0/40/2":5248,"0/40/3":"Roborock Robotic Vacuum Cleaner","0/40/4":770,"0/40/5":"Rocky","0/40/6":"XX","0/40/7":2,"0/40/8":"1.4","0/40/9":2,"0/40/10":"1.4","0/40/19":{"0":3,"1":65535},"0/40/65532":0,"0/40/65531":[0,1,2,3,4,5,6,7,8,9,10,13,14,15,18,19,21,22,65528,65529,65531,65532,65533],"0/40/65529":[],"0/40/65528":[],"0/48/65533":2,"0/48/65532":0,"0/48/0":0,"0/48/1":{"0":60,"1":900},"0/48/2":0,"0/48/3":2,"0/48/4":true,"0/48/65531":[0,1,2,3,4,65528,65529,65531,65532,65533],"0/48/65529":[0,2,4],"0/48/65528":[1,3,5],"0/50/65533":1,"0/50/65532":0,"0/50/65531":[65528,65529,65531,65532,65533],"0/50/65529":[0],"0/50/65528":[1],"0/51/3":6810,"0/51/65533":2,"0/51/65532":0,"0/51/0":[{"0":"ap0","1":false,"2":null,"3":null,"4":"Jp59NM/I","5":[],"6":[],"7":1},{"0":"wlan0","1":true,"2":null,"3":null,"4":"JJ59NM/I","5":["wKgKng=="],"6":["IAEKYQQVeoomnn3//jTPyA==","/oAAAAAAAAAmnn3//jTPyA=="],"7":1},{"0":"sit0","1":false,"2":null,"3":null,"4":"AAAAAAAA","5":[],"6":[],"7":0},{"0":"lo","1":true,"2":null,"3":null,"4":"AAAAAAAA","5":["fwAAAQ=="],"6":["AAAAAAAAAAAAAAAAAAAAAQ=="],"7":0}],"0/51/1":319,"0/51/2":10,"0/51/8":false,"0/51/65531":[0,1,2,3,8,65528,65529,65531,65532,65533],"0/51/65529":[0,1],"0/51/65528":[2],"0/60/65533":1,"0/60/65532":0,"0/60/0":0,"0/60/1":null,"0/60/2":null,"0/60/65531":[0,1,2,65528,65529,65531,65532,65533],"0/60/65529":[0,2],"0/60/65528":[],"0/62/65533":1,"0/62/0":[{"1":"FTABAQIkAgE3AyQUABgmBKntADAmBSkkrkQ3BiQVASQRCBgkBwEkCAEwCUEE33DnZFKYTkerzyF2vQHoYvfHZG5ZK13AAlO83gXtFJdeI7OUTMTe6CwCJmJB9JrgFmojTabeJ1xwgnD4zVqsbzcKNQEoARgkAgE2AwQCBAEYMAQUyWHkaLglJ5BL7TjZpqr9XDN52KkwBRQ86QyBjSSJ40IN5wtGaRSh5bWxbhgwC0Bhpp2od7Hz+qDxuSWCJBgdCSAxgQfkhx69cSrGERpmWDPdeVZQBkir8aNc5sWKnGDZhiuHiZyQLP5+W4MI5ZlGGA==","2":null,"254":1}],"0/62/1":[{"1":"BJCO3Fk6Ul2t/y7v+TWsXtPrwcz1XbuKwf9KDW/8ZZDLn1lakFhtLO80CHmoLLdQxjFEK0oDDep4XwguFqBMoOQ=","2":65521,"3":1,"4":8,"5":"FamSchaeffler","254":1}],"0/62/2":5,"0/62/3":1,"0/62/4":["FTABAQAkAgE3AyQUABgmBPK8/y8mBXLzrEQ3BiQUABgkBwEkCAEwCUEEkI7cWTpSXa3/Lu/5Naxe0+vBzPVdu4rB/0oNb/xlkMufWVqQWG0s7zQIeagst1DGMUQrSgMN6nhfCC4WoEyg5DcKNQEpARgkAmAwBBQ86QyBjSSJ40IN5wtGaRSh5bWxbjAFFDzpDIGNJInjQg3nC0ZpFKHltbFuGDALQPVuq7G5eILn6kQ4c7Uax43mnYtGnkrcQui8h5lS4Z9eo5f19bg219ssudUUn8HK7lUGawoSsx0iUVOGMNRt8O4Y"],"0/62/5":1,"0/62/65532":0,"0/62/65531":[0,1,2,3,4,5,65528,65529,65531,65532,65533],"0/62/65529":[0,2,4,6,7,9,10,11],"0/62/65528":[1,3,5,8],"0/63/65533":2,"0/63/65532":0,"0/63/0":[],"0/63/1":[],"0/63/2":4,"0/63/3":3,"0/63/65531":[0,1,2,3,65528,65529,65531,65532,65533],"0/63/65529":[0,1,3,4],"0/63/65528":[2,5],"1/29/65533":2,"1/29/65532":0,"1/29/0":[{"0":17,"1":1},{"0":116,"1":1}],"1/29/1":[3,29,47,84,85,97,336],"1/29/2":[],"1/29/3":[],"1/29/65531":[0,1,2,3,65528,65529,65531,65532,65533],"1/29/65529":[],"1/29/65528":[],"1/3/65533":5,"1/3/0":0,"1/3/1":3,"1/3/65532":0,"1/3/65531":[0,1,65528,65529,65531,65532,65533],"1/3/65529":[0],"1/3/65528":[],"1/47/65532":6,"1/47/12":200,"1/47/14":0,"1/47/15":false,"1/47/16":3,"1/47/17":true,"1/47/26":2,"1/47/28":true,"1/47/65533":3,"1/47/0":1,"1/47/1":0,"1/47/2":"Primary Battery","1/47/31":[],"1/47/65531":[0,1,2,12,14,15,16,17,26,28,31,65528,65529,65531,65532,65533],"1/47/65529":[],"1/47/65528":[],"1/84/65533":3,"1/84/65532":0,"1/84/0":[{"label":"Idle","mode":0,"modeTags":[{"value":16384}]},{"label":"Cleaning","mode":1,"modeTags":[{"value":16385}]},{"label":"Mapping","mode":2,"modeTags":[{"value":16386}]}],"1/84/1":0,"1/84/65531":[0,1,65528,65529,65531,65532,65533],"1/84/65529":[0],"1/84/65528":[1],"1/85/65533":3,"1/85/65532":0,"1/85/0":[{"label":"Quiet, Vacuum Only","mode":1,"modeTags":[{"value":2},{"value":16385}]},{"label":"Auto, Vacuum Only","mode":2,"modeTags":[{"value":0},{"value":16385}]},{"label":"Deep Clean, Vacuum Only","mode":3,"modeTags":[{"value":16384},{"value":16385}]},{"label":"Quiet, Mop Only","mode":4,"modeTags":[{"value":2},{"value":16386}]},{"label":"Auto, Mop Only","mode":5,"modeTags":[{"value":0},{"value":16386}]},{"label":"Deep Clean, Mop Only","mode":6,"modeTags":[{"value":16384},{"value":16386}]},{"label":"Quiet, Vacuum and Mop","mode":7,"modeTags":[{"value":2},{"value":16385},{"value":16386}]},{"label":"Auto, Vacuum and Mop","mode":8,"modeTags":[{"value":0},{"value":16385},{"value":16386}]},{"label":"Deep Clean, Vacuum and Mop","mode":9,"modeTags":[{"value":16384},{"value":16385},{"value":16386}]}],"1/85/1":8,"1/85/65531":[0,1,65528,65529,65531,65532,65533],"1/85/65529":[0],"1/85/65528":[1],"1/97/65533":2,"1/97/0":null,"1/97/1":null,"1/97/3":[{"0":0},{"0":1},{"0":2},{"0":3},{"0":64},{"0":65},{"0":66}],"1/97/4":66,"1/97/5":{"0":0},"1/97/65532":0,"1/97/65531":[0,1,3,4,5,65528,65529,65531,65532,65533],"1/97/65529":[0,3,128],"1/97/65528":[4],"1/336/65532":4,"1/336/1":[{"0":0,"1":"Karte OG"},{"0":1,"1":"Karte EG"},{"0":2,"1":"Karte DG"}],"1/336/65533":1,"1/336/0":[{"0":1,"1":0,"2":{"0":{"0":"Bad OG","1":null,"2":6},"1":null}},{"0":2,"1":0,"2":{"0":{"0":"Flur OG","1":null,"2":16},"1":null}},{"0":3,"1":0,"2":{"0":{"0":"Schlafzimmer","1":null,"2":7},"1":null}},{"0":4,"1":0,"2":{"0":{"0":"Treppe","1":null,"2":null},"1":null}},{"0":5,"1":0,"2":{"0":{"0":"Clara","1":null,"2":null},"1":null}},{"0":6,"1":1,"2":{"0":{"0":"Küche","1":null,"2":47},"1":null}},{"0":7,"1":1,"2":{"0":{"0":"Flur","1":null,"2":16},"1":null}},{"0":8,"1":1,"2":{"0":{"0":"Toilette","1":null,"2":null},"1":null}},{"0":9,"1":1,"2":{"0":{"0":"Wohnzimmer","1":null,"2":52},"1":null}},{"0":10,"1":2,"2":{"0":{"0":"Johanna","1":null,"2":null},"1":null}},{"0":11,"1":2,"2":{"0":{"0":"Flur","1":null,"2":16},"1":null}},{"0":12,"1":2,"2":{"0":{"0":"Bad DG","1":null,"2":6},"1":null}},{"0":13,"1":2,"2":{"0":{"0":"Schlafzimmer","1":null,"2":null},"1":null}}],"1/336/2":[],"1/336/65531":[0,1,2,65528,65529,65531,65532,65533],"1/336/65529":[0],"1/336/65528":[1]},"attribute_subscriptions":[],"matter_version":"1.4.0"}]';

  it('should work with vaccum robot', function (done) {
    try {
      let matter = new Matter();
      matter.storeNodes( JSON.parse(rvc) );
      matter.should.have.a.property("_dataById");
      matter._dataById.should.have.a.property("8");
      matter._dataById[8].should.have.a.property("online",true);
      matter._dataById[8].should.have.a.property("time");
      matter._dataById[8].time.should.be.approximately(Temporal.Now.instant().epochMilliseconds,5);
      matter._dataById[8].should.have.a.property("make","Roborock");
      matter._dataById[8].should.have.a.property("model","Roborock Robotic Vacuum Cleaner");
      matter._dataById[8].should.have.a.property("label","Rocky");
      matter._dataById[8].should.have.a.property("name","Rocky");
      matter._dataById[8].should.have.a.property("internal").which.is.an.Object();
      matter._dataById[8].should.have.a.property("data").which.is.an.Object();
      matter._dataById[8].should.not.have.a.property("ip4");
      matter._dataById[8].should.not.have.a.property("ip6");
      matter.should.have.a.property("_namesLut",{Rocky:{ node: 8, endpoint: 1 }});
      matter.should.have.a.property("_changed",{8:true});
      //
      //matter.sendChanged();
      //
      //matter.forAllIds();
      //
      matter.storeIP( 8, ["1.2.3.4","1:2:3::4:5:6"] );
      matter._dataById[8].should.have.a.property("ip4","1.2.3.4");
      matter._dataById[8].should.have.a.property("ip6","1:2:3::4:5:6");
      //
      //matter.setAttribute();
      //
      matter.deleteNode( 8 );
      matter._dataById[8].should.have.a.property("online",false);
      matter.should.have.a.property("_changed",{8:true});
      done();
    }
    catch(err) {
      done(err);
    }
  });

  it('should encrypt bthome messages with timestamp as counter', function (done) {
    try {
    /*
      Encrypt.encryptBthome(
        [69,0,128,5,3,2,1,0x2D,1,0x3F,60,0],
        '00:10:20:30:40:50',
        Math.floor( Date.now()/1000 ),
        '00112233445566778899AABBCCDDEEFF'
      ).should.be.an.Array();
      */
      done();
    }
    catch(err) {
      done(err);
    }
  });

});
