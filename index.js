const express = require('express');
const routing = require('./routing');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    }
}));

app.get('/routing/route', (req, res, next) => {
    var values = req.query;
    console.log(values);    
    let stops = values.stops.split(',');
    routing.route(stops[0], stops[1])
        .then(result => {
            res.status(200).json(result);
        })
        .catch(reason => {
            res.status(500).json(reason);
        });
});

app.get('/routing/distance', (req, res, next) => {
    var values = req.query;
    console.log(values);    
    let stops = values.stops.split(',');
    routing.distance(stops[0], stops[1])
        .then(result => {
            res.status(200).json(result);
        })
        .catch(reason => {
            res.status(500).json(reason);
        });
});

app.get('/routing/closest', (req, res, next) => {
    let values = req.query;
    let geom = `POINT(${values.lon} ${values.lat})`;
    console.log('geom', geom);
    routing.closest(geom)
        .then(result => {
            res.status(200).json(result);
        })
        .catch(reason => {
            res.status(500).json(reason);
        });
});

app.listen(3000, () => "listening on 3000");

/**
 * http://localhost:3000/routing/distance?stops=1,2
 * http://localhost:3000/routing/closest?lat=-97.06343&lon=40.82186
 */