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

app.listen(3000, () => {
  console.log('Démarrage sur le port 3000');
});
