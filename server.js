const { MongoClient } = require('mongodb')
const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.set('views', './views')

let db

app.get('/', async (req, res) => {
  const allAnimals = await db.collection('Animals').find().toArray()

  res.render('home', { allAnimals })
})

app.get('/admin', (req, res) => {
  res.send('Hello Admin!')
})

async function start() {
  const client = new MongoClient(
    'mongodb://root:root@localhost:27017/mernApp?&authSource=admin'
  )

  await client.connect()
  db = client.db()
  app.listen(3001)
}
start()
