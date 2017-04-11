const pool = require('./db');

function distanceAsQuery(a, b) {
    let query = `SELECT seq, id1 AS node, id2 AS edge, cost FROM pgr_dijkstra(
        'SELECT fid as id, source, target, length as cost FROM "north-america".routing', 
        ${a}, ${b}, false, false
    )`;
    return query;
}

function routeAsQuery(a, b) {
    let query = `
    SELECT seq, ST_AsText(R.geom) geom, cost 
    FROM pgr_dijkstra(
            'SELECT fid as id, source, target, length as cost FROM "north-america".routing', 
            ${a}, ${b}, false, false
        )
    JOIN "north-america".routing R
    ON R.fid=id2
`;
    return query;
}

/**
 * 
 * @param {*} geom ex. POINT(-97.06343 40.82186)
 * @param {*} limit 
 */
function nearbyAsQuery(geom, limit, buffer = 0.0001) {
    limit = limit || 1;
    geom = `ST_GeomFromText('${geom}', 4326)`;
    let query = `
    SELECT id, ST_AsText(the_geom) geom, ST_Distance(the_geom, ${geom}) distance
    FROM "north-america".routing_vertices_pgr
    WHERE ST_DWithin(the_geom, ${geom}, ${buffer})
    ORDER BY ST_Distance(the_geom, ${geom}) asc
    LIMIT ${limit}`;
    return query;
}

function route(a, b) {
    return new Promise((resolve, reject) => {
        pool.query(routeAsQuery(a, b), (err, res) => {
            if (err) {
                reject('error running query', err);
                return;
            }

            resolve({
                route: res.rows.map(r => ({
                    geom: r.geom,
                    cost: r.cost
                }))
            });
        });
    });
}

function distance(a, b) {
    return new Promise((resolve, reject) => {
        pool.query(distanceAsQuery(a, b), (err, res) => {
            if (err) {
                reject('error running query', err);
                return;
            }

            let cost = res.rows.map(r => r.cost).reduce((a, b) => a + b);
            resolve({
                distance: cost
            });
        });
    });
}

function closest(geom) {
    return new Promise((resolve, reject) => {
        pool.query(nearbyAsQuery(geom, 1, 0.1), (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res.rows);
        });
    });
}


module.exports = {
    route: route,
    distance: distance,
    closest: closest
};