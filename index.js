const core = require('@actions/core');
const axios = require('axios');
const { dbDetailsFactory } = require('@metis-data/db-details');
const parse = require('pg-connection-string').parse;
const { processResults } = require('./reports');

const DIALECT = 'postgres';

const getDbdetails = async (dbConnection) => {
  const dbDetails = dbDetailsFactory('postgres');
  const db = dbDetails.getExtendedDbDetailsData(dbConnection, { getAllExtraData: true });
  const data = await db;

  return await data;
};

/*
data: '{"pmcDevice":{"rdbms":"postgres","db_name":"bee_hero","db_host":"database-2.cofhrj7zmyn4.eu-central-1.rds.amazonaws.com","dbPort":"5432"},"data":[{"name":"public","tables":[{"name":"alembic_version","schemaName":"public","tableId":744857,"columns":[{"name":"version_num","dataType":"character varying","internalName":"varchar","isNull":false,"length":32,"isForeignKey":false,"isPrimaryKey":true,"fullCatalogName":"database.public.alembic_version.version_num","indexes":[{"name":"alembic_version_pkc"}]}],"indexes":[{"name":"alembic_version_pkc","relatedColumns":[{"name":"version_num","dataType":"character varying","internalName":"varchar","isNull":false,"length":32,"isForeignKey":false,"isPrimaryKey":true,"fullCatalogName":"database.public.alembic_version.version_num","indexes":[{"name":"alembic_version_pkc"}]}],"relatedExpressions":[]}],"constraints":[{"name":"alembic_version_pkc","type":"PrimaryKey","schema":"public"}],"triggers":[],"pkData":{"name":"alembic_version_pkc","columns":[{"name":"version_num","dataType":"character varying","internalName":"varchar","isNull":false,"length":32,"isForeignKey":false,"isPrimaryKey":true,"fullCatalogName":"database.public.alembic_version.version_num","indexes":[{"name":"alembic_version_pkc"}]}],"sizeInBytes":0,"numOfColumns":1},"pk":"alembic_version_pkc","fk":[],"table_name":"alembic_version","full_table_name":"public.alembic_version","dead_rows":0,"n_mod_since_analyze":"0","pct_mod_since_analyze":"0","last_analyze_date":null,"last_autoanalyze_date":null,"total_table_size_kb":"8","table_size_kb":"0","indexes_size_kb":"8",
"total_table_size_pretty":"8192 bytes","table_size_pretty":"0 bytes","index_size_pretty":"8192 bytes","rows":0,"pages":0},

*/

const handleAxiosError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  console.log(error.config);
};

function splitArrayIntoChunks(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

const getChunks = (schemaName, tables) => {
  const result = splitArrayIntoChunks(tables, 50);
  return result.map((res) => ({
    name: schemaName,
    tables: res,
  }));
};

const sendDbdetails = async (dbConnection, apiKey, url, data) => {
  // const chunks = data.reduce((acc, cur) => {
  //   acc = acc.concat(getChunks(cur.name, cur.tables));
  //   return acc;
  // }, [])

  // let results = await Promise.all(chunks.map(async (dataToSend) => {
  //   aw®`ait sendDataToMetis(dbConnection, apiKey, url, [dataToSend]);
  // }));
  try {
    await sendDataToMetis(dbConnection, apiKey, url, data);
  } catch (error) {
    handleAxiosError(error);
  }
};

const sendstatStatements = async (dbConnection, apiKey, url, data) => {
  try {
    await sendDataToMetis(dbConnection, apiKey, url, data);
  } catch (error) {
    handleAxiosError(error);
  }
};

const sendAvailableExtensions = async (dbConnection, apiKey, url, data) => {
  try {
    await sendDataToMetis(dbConnection, apiKey, url, data);
  } catch (error) {
    handleAxiosError(error);
  }
};

const sendPgConfig = async (dbConnection, apiKey, url, data) => {
  try {
    await sendDataToMetis(dbConnection, apiKey, url, data);
  } catch (error) {
    handleAxiosError(error);
  }
};

const createPmcDevice = async (dbConnection, apiKey, url) => {
  await axiosPost(
    url,
    {
      rdbms: DIALECT,
      db_name: dbConnection.database,
      db_host: dbConnection.host,
      port: dbConnection.port || '5432',
    },
    { 'x-api-key': apiKey }
  );
};

const sendTableSizeAndIndexUsage = async (dbConnection, apiKey, url, tableSize, indexUsage) => {
  try {
    const options = { 'x-api-key': apiKey };
    const currentDate = new Date().getTime();
    const tableSizePoints = processResults(dbConnection.database, dbConnection.host, tableSize, currentDate);
    const indexUsagePoints = processResults(dbConnection.database, dbConnection.host, indexUsage, currentDate);

    await axiosPost(url, indexUsagePoints, options);
    await axiosPost(url, tableSizePoints, options);
  } catch (error) {
    console.info('*************** TABLE SIZE AND INDEX USAGE *****************');
    console.info(error);
    console.info('*************** TABLE SIZE AND INDEX USAGE *****************');
    //  handleAxiosError(error);
  }
};

const sendDataToMetis = async (dbConnection, apiKey, url, data) => {
  try {
    const body = {
      pmcDevice: {
        rdbms: DIALECT,
        db_name: dbConnection.database,
        db_host: dbConnection.host,
        dbPort: dbConnection.port || '5432',
      },
      data: data,
    };
    const options = { 'x-api-key': apiKey };

    await axiosPost(url, body, options);
  } catch (error) {
    console.log(error);
  }
};

const axiosPost = async (url, body, headers) => {
  try {
    const res = await axios.post(url, body, { headers: headers });
    return res;
  } catch (error) {
    throw error;
  }
};

async function main() {
  try {
    /*
      Parse connection string to object
    */
    let config = parse(core.getInput('db_connection_string'));

    /*
      Set actions vars from action input args
    */
    const metisApikey = core.getInput('metis_api_key');
    const metisExporterUrl = core.getInput('metis_exporter_url');
    const metisUrl = core.getInput('target_url') + '/api';
    const foreignTableName = core.getInput('foreign_table_name');
    const dbConnection = {
      database: config.database,
      user: config.user,
      password: config.password,
      host: config.host,
       ssl: { rejectUnauthorized: false },
    };

    /*
     Create database unique id
    */
    await createPmcDevice(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/pmc-device`);

    /*
      Collect required data from database based on user request.
      That action can collect: 
        a. Schemas structure.
        b. Available Extensions.
        c. Query statistics.
        d. Table statistics.
        e. Index Usage.
        g. Database configuration.
    */
    const dbDetailsExtraData = await getDbdetails(dbConnection, metisApikey, metisExporterUrl, foreignTableName);

    /*
     Send schemas structure.
    */

    await sendDbdetails(dbConnection, metisApikey, `${metisUrl}/db-details`, dbDetailsExtraData?.dbDetails);
    /*
     Send available extensions.
    */

    await sendAvailableExtensions(dbConnection, metisApikey, `${metisUrl}/pmc/customer-db-extension`, dbDetailsExtraData?.databaseAvailableExtensions);
    /*
     Send database configuration.
    */
    await sendPgConfig(dbConnection, metisApikey, `${metisUrl}/pmc/customer-db-config`, dbDetailsExtraData?.databaseConfig);
    /*
     Send Table statistics and index usage.
    */
    await sendTableSizeAndIndexUsage(dbConnection, metisApikey, metisExporterUrl + '/md-collector/', dbDetailsExtraData?.tableSize, dbDetailsExtraData?.indexUsage);
    /*
     Send query statistics.
    */
    await sendstatStatements(dbConnection, metisApikey, `${metisUrl}/pmc/statistics/query`, dbDetailsExtraData?.databaseStatStatements);
  } catch (error) {
    console.log(error);
    core.setFailed(error);
  }
}

main();
