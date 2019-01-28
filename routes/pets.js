// MODELS
const Pet = require('../models/pet');

// Require Nodemailer / Mailgun
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const auth = {
    auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.EMAIL_DOMAIN,
    }
}

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

// UPLOADING TO AWS S3
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

const client = new Upload(process.env.s3_BUCKET, {
    aws: {
        path: 'pets/avatar',
        region: process.env.S3_REGION,
        acl: 'public-read',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    cleanup: {
        versions: true,
        original: true,
    },
    versions: [{
        maxWidth: 400,
        aspect: '16:10',
        suffix: '-standard',
    }, {
        maxWidth: 300,
        aspect: '1:1',
        suffix: '-square',
    }],
});

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
      if (req.header('content-type') == 'application/json') {
          res.json({})
      } else {
          res.render('pets-new');
      }

  });

  // CREATE PET
  app.post('/pets', upload.single('avatar'), (req, res, next) => {
    // Instantiate a new Pet object
    var pet = new Pet(req.body);

    pet.save(function (err) {
        if (req.file) {
            client.upload(req.file.path, {}, function (err, versions, meta) {
                if (err) { return res.status(400).send({ err: err }) };

                versions.forEach((image) => {
                    const urlArray = image.url.split('-');
                    urlArray.pop();
                    const url = urlArray.join('-');
                    pet.avatarUrl = url;
                    pet.save();
                });
                if (req.header('content-type') == 'application/json') {
                    res.json({ pet: pet });
                } else {
                    res.send({ pet: pet });
                }
            });
        } else {
            if (req.header('content-type') == 'application/json') {
                res.json({ pet: pet });
            } else {
                res.send({ pet: pet });
            }
        }
      })
  });

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
      console.log("req params", req.params);
      Pet.findOne({ _id: req.params.id })
        .then((pet) => {
            // console.log("inside route", pet);
            if (req.header('content-type') == 'application/json') {
                res.json ({
                    pet: pet,
                    // For some reason app.locals was not working for this
                    PUBLIC_STRIPE_API_KEY: process.env.PUBLIC_STRIPE_API_KEY,
                })
            } else {
                res.render('pets-show', {
                    pet: pet,
                    // For some reason app.locals was not working for this
                    PUBLIC_STRIPE_API_KEY: process.env.PUBLIC_STRIPE_API_KEY,
                });
            }
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
        if (req.header('content-type') == 'application/json') {
            res.json({ pet: pet });
        } else {
            res.render('pets-edit', { pet: pet });
        }
    });
  });

  // UPDATE PET
  app.put('/pets/:id', (req, res) => {
    Pet.findByIdAndUpdate(req.params.id, req.body)
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`)
      })
      .catch((err) => {
        // Handle Errors
      });
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      return res.redirect('/')
    });
  });

  // SEARCH PET
  app.get('/search', (req, res) => {
      Pet
        .find(
            { $text : { $search : req.query.term } },
            { score : { $meta : 'textScore' } },
        )
        .sort({ score : { $meta : 'textScore' } })
        .limit(20)
        .exec((err, pets) => {
            if (err) { return res.status(400).send(err) }

            if (req.header('Content-Type') == 'application/json') {
                return res.json({
                    pets: pets,
                    term: req.query.term,
                });
            } else {
                return res.render('pets-index', {
                    pets: pets,
                    term: req.query.term
                });
            }
        });
      });

    // PURCHASE PET
    app.post('/pets/:id/purchase', (req, res) => {
        console.log(req.body);

        var stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);

        const token = req.body.stripeToken;
        Pet.findById(req.body.petId).exec((err, pet) => {
            const charge = stripe.charges.create({
                amount: pet.price * 100,
                currency: 'usd',
                description: `Purchased ${pet.name}, ${pet.species}`,
                source: token,
            })
            .then((charge) => {
                // SEND EMAIL
                const user = {
                  email: req.body.stripeEmail,
                  amount: charge.amount / 100,
                  petName: pet.name,
                };

                nodemailerMailgun.sendMail({
                  from: 'no-reply@example.com',
                  to: user.email, // An array if you have multiple recipients.
                  subject: 'Pet Purchased!',
                  template: {
                    name: 'views/email.handlebars',
                    engine: 'handlebars',
                    context: user
                  }
                }).then(info => {
                  console.log('Response: ' + info);
                  res.redirect(`/pets/${req.params.id}`);
                }).catch(err => {
                  console.log('Error: ' + err);
                  res.redirect(`/pets/${req.params.id}`);
                });
            });
        });
    });
}
