const { MongoClient, ObjectId } = require('mongodb')
const express = require('express')
const multer = require('multer')
const upload = multer()
const sanitizeHTML = require('sanitize-html')
const fse = require('fs-extra')
const sharp = require('sharp')
const path = require('path')
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const AnimalCard = require('./src/components/AnimalCard').default

//when the app first launches make sure the upload folder exists
fse.ensureDirSync(path.join('public', 'uploaded-photos'))

const app = express()

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('public'))

let db

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function passwordProtected(req, res, next) {
  res.set('WWW-Authenticate', 'Basic realm="Animal App"')
  console.log(req.headers.authorization)
  if (req.headers.authorization === 'Basic YWRtaW46YWRtaW4=') {
    next()
  } else {
    console.log(req.headers.authorization)
    res.status(401).send('Authentication required')
  }
}

app.get('/', async (req, res) => {
  const allAnimals = await db.collection('Animals').find().toArray()
  const generatedHTML = ReactDOMServer.renderToString(
    <div className='container'>
      {!allAnimals.length && (
        <p>There are no animals yet, the admin needs to add some :) </p>
      )}
      <div className='animal-grid mb-3'>
        {allAnimals.map((animal) => (
          <AnimalCard
            key={animal._id}
            name={animal.name}
            species={animal.species}
            photo={animal.photo}
            id={animal._id}
            readOnly={true}
          />
        ))}
      </div>
      <p>
        <a href='/admin'>Login / manage the animal listings.</a>
      </p>
    </div>
  )
  res.render('home', { generatedHTML })
})

app.use(passwordProtected) // ensures all routes below are password protected

app.get('/admin', (req, res) => {
  res.render('admin')
})

app.get('/api/animals', async (req, res) => {
  const allAnimals = await db.collection('Animals').find().toArray()
  res.json(allAnimals)
})

app.post(
  '/create-animal',
  upload.single('photo'),
  cleanup,
  async (req, res) => {
    if (req.file) {
      const photoFile = `${Date.now()}.jpg`
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(path.join('public', 'uploaded-photos', photoFile))
      req.cleanData.photo = photoFile
    }

    console.log(req.body)
    const info = await db.collection('Animals').insertOne(req.cleanData)
    const newAnimal = await db
      .collection('Animals')
      .findOne({ _id: new ObjectId(info.insertedId) })

    res.send(newAnimal)
  }
)

app.delete('/animal/:id', async (req, res) => {
  if (typeof req.params.id != 'string') req.params.id = ''
  const doc = await db
    .collection('Animals')
    .findOne({ _id: new ObjectId(req.params.id) })
  if (doc.photo) {
    fse.remove(path.join('public', 'uploaded-photos', doc.photo))
  }
  db.collection('Animals').deleteOne({ _id: new ObjectId(req.params.id) })
  res.send('niceee')
})

app.post(
  '/update-animal',
  upload.single('photo'),
  cleanup,
  async (req, res) => {
    if (req.file) {
      const photoFile = `${Date.now()}.jpg`
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(path.join('public', 'uploaded-photos', photoFile))
      const info = await db
        .collection('Animals')
        .findOneAndUpdate(
          { _id: new ObjectId(req.body._id) },
          { $set: req.cleanData }
        )
      if (info.value.photo) {
        fse.remove(path.join('public', 'uploaded-photos', info.value.photo))
      }
      res.send(photoFile)
    } else {
      db.collection('Animals').findOneAndUpdate(
        { _id: new ObjectId(req.body._id) },
        { $set: req.cleanData }
      )
      res.send(false)
    }
  }
)

function cleanup(req, res, next) {
  if (typeof req.body.name != 'string') req.body.name = ''
  if (typeof req.body.species != 'string') req.body.species = ''
  if (typeof req.body._id != 'string') req.body._id = ''

  req.cleanData = {
    name: sanitizeHTML(req.body.name.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
    species: sanitizeHTML(req.body.species.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
  }
  next()
}

async function start() {
  const client = new MongoClient(
    'mongodb://root:root@localhost:27017/mernApp?&authSource=admin'
  )

  await client.connect()
  db = client.db()
  app.listen(3001)
}
start()
