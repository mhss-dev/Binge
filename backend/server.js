require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const watchlistRoutes = require('./routes/watchlist');
const watchedRoutes = require('./routes/watched');

const app = express();
app.use(express.json());

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

const sessionStore = new MySQLStore({}, db);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

app.get("/api/nowplaying", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
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

app.get("/api/films", async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = 12;
    const maxItems = 500;

    const response = await axios.get(
      "https://api.themoviedb.org/3/discover/movie",
      {
        params: {
          api_key: TMDB_API_KEY,
          language: "fr-FR",
          page: page,
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


app.get("/api/films/:id", async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "credits",
          language: "fr-FR",
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

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Il faut au moins une requête" });
    }
    const response = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
        },
      }
    );
    res.json(response.data);
    console.log(response.data);
  } catch {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/watched', watchedRoutes);


app.listen(5000, () => {
  console.log("Démarrage sur le port 5000");
});
