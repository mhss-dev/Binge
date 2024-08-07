require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
app.use(bodyParser.json());
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY; 

app.get('/api/nowplaying', async (req, res) => {
  try {
    const response = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
      params: {
        api_key: TMDB_API_KEY,
        language: 'fr-FR',
        page: 1
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API TMDb :", error);
    res.status(500).send('Erreur lors de la récupération des films');
  }
});

app.get('/api/search', async(req, res) => {
    try {
        const query = req.query.query;
        if (!query) {
          return res.status(400).json({ error: 'Il faut au moins une requête' });
        }
        const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
                api_key: TMDB_API_KEY,
                query: query,
            }
        })
        res.json(response.data);
    } catch {
        res.status(500).json({error: error.message})
    }
});

app.listen(3000, () => {
  console.log('Démarrage sur le port 3000');
});
