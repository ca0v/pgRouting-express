const pool = require('./db');

const feetPerMeter = 3.2808399;
const feetPerMile = 5280;

function toMiles(meters) {
    return (feetPerMeter * meters / feetPerMile);
}

function distanceAsSql(a, b) {
    let query = `SELECT seq, id1 AS node, id2 AS edge, cost FROM pgr_dijkstra(
        'SELECT fid as id, source, target, length as cost FROM "north-america".routing', 
        ${a}, ${b}, false, false
    )`;
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
    SELECT id, ST_Distance(the_geom, ${geom}) distance 
    FROM "north-america".routing_vertices_pgr
    WHERE ST_DWithin(the_geom, ${geom}, ${buffer})
    ORDER BY ST_Distance(the_geom, ${geom}) asc
    LIMIT ${limit}`;
    return query;
}

function distance(a, b) {
    //to run a query we just pass it to the pool
    //after we're done nothing has to be taken care of
    //we don't have to return any client to the pool or close a connection
    return new Promise((resolve, reject) => {
        pool.query(distanceAsSql(4, 10), (err, res) => {
            if (err) {
                reject('error running query', err);
                return;
            }

            let cost = res.rows.map(r => r.cost).reduce((a, b) => a + b);
            let distance = toMiles(cost);
            resolve({
                distance: distance
            });
        });
    });
}

function closest(geom) {
    return new Promise((resolve, reject) => {
        pool.query(nearbyAsQuery(geom, 1, 0.0001), (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve({
                ids: res.rows.map(r => r.id)
            });
        });
    });
}


module.exports = {
    distance: distance,
    closest: closest
};