import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import CreateNewForm from './components/CreateNewForm'
import AnimalCard from './components/AnimalCard'

function App() {
  const [animals, setAnimals] = useState([])

  useEffect(() => {
    async function go() {
      const response = await axios.get('/api/animals')
      setAnimals(response.data)
    }
    go()
  }, [])

  return (
    <div className='container'>
      <p>
        <a href='/'>&laquo; Back to Homepage</a>
      </p>
      <CreateNewForm setAnimals={setAnimals} />
      <div className='animal-grid'>
        {animals.map((animal) => {
          return (
            <AnimalCard
              key={animal._id}
              photo={animal.photo}
              id={animal._id}
              setAnimals={setAnimals}
              name={animal.name}
              species={animal.species}
            />
          )
        })}
      </div>
    </div>
  )
}

const root = createRoot(document.querySelector('#app'))
root.render(<App />)
