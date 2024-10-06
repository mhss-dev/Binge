require("dotenv").config();

const express = require("express");
const session = require("express-session");
const PgSession = require('connect-pg-simple')(session); 
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const watchlistRoutes = require('./routes/watchlist');
const watchedRoutes = require('./routes/watched');
const members = require('./routes/members');
const cookieParser = require('cookie-parser')


const app = express();
app.use(express.json());
app.use(cookieParser())

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const sessionStore = new PgSession({
  pool: db,
  tableName: "session",
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.get("/api/trending", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/trending/movie/week",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr-FR",
          page: 1,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API TMDb :", error);
    res.status(500).send("Erreur lors de la récupération des films");
  }
});


app.get("/api/top", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/top_rated",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr-FR",
          page: 1,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API TMDb :", error);
    res.status(500).send("Erreur lors de la récupération des films");
  }
});

app.get("/api/upcoming", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/upcoming",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr-FR",
          region: "FR",
          page: 1,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API TMDb :", error);
    res.status(500).send("Erreur lors de la récupération des films");
  }
});


app.get('/api/nowplaying', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'fr-FR',
          region: 'FR',
          page: 1,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API TMDb :', error);
    res.status(500).send('Erreur lors de la récupération des films');
  }
});

app.get("/api/logo/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/images`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      `Erreur lors de l'appel à l'API TMDb pour le film ${movieId} :`,
      error
    );
    res.status(500).send("Erreur lors de la récupération des détails du film");
  }
});


app.get("/api/films", async (req, res) => {
  try {
    const { page = parseInt(req.query.page), sort_by = 'popularity.desc', actorId, genre } = req.query;

    const limit = 12;
    const maxItems = 500;

    const response = await axios.get(
      "https://api.themoviedb.org/3/discover/movie",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr-FR",
          page: page,
          with_genres: genre,
          include_adult: false,
          sort_by: sort_by,
          with_people: actorId,
        },
      }
    );

    const data = response.data;
    const totalItems = Math.min(data.total_results, maxItems);
    const totalPages = Math.ceil(totalItems / limit);
    const results = data.results.slice(0, limit);

    res.json({
      items: results,
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API TMDb :", error);
    res.status(500).send("Erreur lors de la récupération des films");
  }
});


app.get("/api/actorid", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const actorId = req.query.with_people;

    if (!actorId) {
      return res.status(400).send("Actor ID is required.");
    }

    const limit = 12;
    const maxItems = 500;

    const movieResponse = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: {
        api_key: TMDB_API_KEY,
        language: "fr-FR",
        page: page,
        with_people: actorId,
        append_to_response: 'credits'
      }
    });

    const moviesData = movieResponse.data;
    const totalItems = Math.min(moviesData.total_results, maxItems);
    const totalPages = Math.ceil(totalItems / limit);
    const results = moviesData.results.slice(0, limit);

    const actorResponse = await axios.get(`https://api.themoviedb.org/3/person/${actorId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: "fr-FR"
      }
    });

    const actorData = actorResponse.data;

    res.json({
      actor: actorData,
      movies: results,
      totalItems: totalItems,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur sur la récupération des films");
  }
});

app.get('/api/films/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits',
          language: 'fr-FR',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de l'appel à l'API pour le film ${movieId} :`, error);
    res.status(500).send('Erreur lors de la récupération des détails du film');
  }
});

app.get('/api/teaser/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        params: {
          api_key: TMDB_API_KEY,
          language: 'fr-FR',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(`Erreur lors de l'appel à l'API pour le film ${movieId} :`, error);
    res.status(500).send('Erreur lors de la récupération des détails du film');
  }
});


app.get('/api/providers/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
      {
        params: {
          api_key: TMDB_API_KEY,
        },
      }
    );
    res.json(response.data);
    
  } catch (error) {
    console.error(`Erreur lors de l'appel à l'API pour le provider ${movieId} :`, error);
    res.status(500).send('Erreur lors de la récupération des providers');
  }
});


app.get("/api/similar/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/recommendations`,
      {
          params: {
          api_key: TMDB_API_KEY,
          language: 'fr'
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      `Erreur lors de l'appel à l'API TMDb pour le film ${movieId} :`,
      error
    );
    res.status(500).send("Erreur lors de la récupération des détails du film");
  }
});



app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Il faut au moins une requête' });
    }
    const response = await axios.get(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la recherche dans l\'API TMDb :', error);
    res.status(500).json({ error: 'Erreur lors de la recherche dans l\'API TMDb', details: error.message });
  }
});


app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/watched', watchedRoutes);
app.use('/api/members', members);


app.listen(3000, () => {
  console.log("Démarrage sur le port 3000");
});
