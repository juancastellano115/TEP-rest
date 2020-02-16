require("dotenv").config();
var express = require("express");
var app = express();
var cors = require("cors");
var Twit = require("twit");
const PORT = process.env.PORT || 3000;
var T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true // optional - requires SSL certificates to be valid.
});

//Enable C.O.R.S.
app.use(cors({
  origin: 'https://juancastellano.gq'
}));

app.get("/:usuario", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  let data = req.params.usuario;
  Promise.all([promesaUsuario(data), promesaEstadisticas(data)]).then(function(
    resultados
  ) {
    res.end(
      JSON.stringify({ usuario: resultados[0], estadisticas: resultados[1] })
    );
  });
});

var server = app.listen(PORT, function() {
  var port = server.address().port;
  console.log("T.E.P. Rest escuchando en el puerto %s", PORT);
});

function queryUser(name, callback) {
  T.get("users/show", { screen_name: name }, function(err, data) {
    if (err) {
      callback(null);
    } else {
      callback(data);
    }
  });
}

function getStadistics(name, callback) {
  T.get("statuses/user_timeline", { screen_name: name, include_rts: false }, function(err, data) {
    if (err) {
      callback(null);
    } else {
      callback(data);
    }
  });
}

function promesaUsuario(data) {
  return new Promise(function(resolve, reject) {
    queryUser(data, function(datos) {
      try {
        let modeledObject = {
          nombre: datos.name,
          screen_name: datos.screen_name,
          description: datos.description,
          seguidores: datos.followers_count,
          siguiendo: datos.friends_count,
          numero_tweets: datos.statuses_count,
          color: datos.profile_background_color,
          foto: datos.profile_image_url.slice(0, -11) + ".jpg",
          encabezado: datos.profile_banner_url,
          fecha: datos.created_at
        };
        resolve(modeledObject);
      } catch (error) {
        resolve({ message: "error" });
      }
    });
  });
}

function promesaEstadisticas(data) {
  return new Promise(function(resolve, reject) {
    getStadistics(data, function(datos) {
      try {
        let mentions = {};
        let tweetsSemana = 0;
        let fechaActual = new Date();
        fechaActual.setDate(fechaActual.getDate() - 7);

        for (const iterator of datos) {
          let tweetdate = new Date(iterator.created_at);
          if (fechaActual < tweetdate) {
            tweetsSemana += 1;
          }
          if (iterator.entities.user_mentions != null) {
            for (const iteratormentions of iterator.entities.user_mentions) {
              if (mentions[iteratormentions.screen_name] == null) {
                mentions[iteratormentions.screen_name] = 1;
              } else {
                mentions[iteratormentions.screen_name] += 1;
              }
            }
          }
        }
        resolve({ tweetsSemana: tweetsSemana, menciones: mentions });
      } catch (error) {
        resolve({ message: "error" });
      }
    });
  });
}
