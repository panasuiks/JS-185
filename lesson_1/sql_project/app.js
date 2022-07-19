const Client  = require('pg').Client
async function logQuery(queryText) {
  let client = new Client({ 
    user: 'steve',
    password: 'Atlant1c',
    database: 'films',
 });
  await client.connect();
  
  let data = await client.query(queryText);
  
  console.log(data.rows[data.rows.length - 1].count);
  client.end();
}

logQuery(`SELECT count(id) FROM films 
          WHERE duration < 110
          GROUP BY genre`);

