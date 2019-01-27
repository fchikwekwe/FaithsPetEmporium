const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const Pet = require('../models/pet');

const fido =     {
    "name": "Norman",
    "species": "Greyhound",
    "birthday": "2008-11-11",
    "favoriteFood": "Liver",
    "picUrl": "http://www.gpamass.com/s/img/emotionheader713297504.jpg",
    "picUrlSq": "https://www.collinsdictionary.com/images/thumb/greyhound_21701074_250.jpg",
    "description": "Fido is a dog and he's a good dog who loves to play and hang out with his owners. He also likes to nap and enjoys eating dog food"
}

chai.use(chaiHttp);

describe('Pets', ()  => {

  after(() => {
    Pet.deleteMany({$or: [{name: 'Norman'}, {name: 'Spider'}] }).exec((err, pets) => {
      console.log(pets)
      pets.remove();
    })
  });

  // TEST INDEX
  it('should index ALL pets on / GET', (done) => {
    chai.request(server)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
  });

  // TEXT INDEX JSON
  it('should list ALL pets on /pets GET JSON', function(done) {
  chai.request(server)
      .get('/')
      .set('content-type', 'application/json')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        done();
      });
  });

  // TEST NEW
  it('should display new form on /pets/new GET', (done) => {
    chai.request(server)
      .get(`/pets/new`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html
          done();
        });
  });

  // TEXT NEW JSON
  it('should send json on /pets/new GET JSON', (done) => {
    chai.request(server)
      .get(`/pets/new`)
        .set('content-type', 'application/json')
          .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
  });


  // TEST CREATE
  it('should create a SINGLE pet on /pets POST', (done) => {
    chai.request(server)
        .post('/pets')
        .send(fido)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html
          done();
        });
  });

  // TEST SHOW
  it('should show a SINGLE pet on /pets/<id> GET', (done) => {
    var pet = new Pet(fido);
    pet.save(() => {
      chai.request(server)
        .get(`/pets/${pet._id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html
          done();
         });
     });

  });

  // TEST SHOW JSON
  it('should show a SINGLE pet on /pets/<id> GET JSON', (done) => {
    var pet = new Pet(fido);
    pet.save(() => {
      chai.request(server)
        .get(`/pets/${pet._id}`)
        .set('content-type', 'application/json')
          .end((err, res) => {
            res.should.have.status(200);
            res.should.be.json
            done();
         });
     });

  });

  // TEST EDIT
  it('should edit a SINGLE pet on /pets/<id>/edit GET', (done) => {
    var pet = new Pet(fido);
     pet.save(() => {
       chai.request(server)
         .get(`/pets/${pet._id}/edit`)
         .end((err, res) => {
           res.should.have.status(200);
           res.should.be.html
           done();
         });
     });
  });


  // TEST UPDATE
  it('should update a SINGLE pet on /pets/<id> PUT', (done) => {
    var pet = new Pet(fido);
    pet.save(()  => {
     chai.request(server)
      .put(`/pets/${pet._id}?_method=PUT`)
      .send({'name': 'Spider'})
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html
        done();
      });
    });
  });

  // TEST DELETE
  it('should delete a SINGLE pet on /pets/<id> DELETE', (done) => {
    var pet = new Pet(fido);
    pet.save(()  => {
     chai.request(server)
      .delete(`/pets/${pet._id}?_method=DELETE`)
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html
        done();
      });
    });
  });

  // TEST SEARCH
  it('should search ALL pets by name on /search GET', (done) => {
      chai.request(server)
        .get('/seach?term=norman')
        .end((err, res) => {
            res.should.have.status(200);
            res.should.be.html;
            done();
        });
  });
});
