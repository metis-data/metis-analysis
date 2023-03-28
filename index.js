const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const { context } = require('@actions/github');
const octokit = github.getOctokit(core.getInput('github_token'));
const { dbDetailsFactory } = require('@metis-data/db-details');
const { pull_request, issue } = context.payload;
const parse = require('pg-connection-string').parse;
const { LambdaClient, AddLayerVersionPermissionCommand, Lambda } = require('@aws-sdk/client-lambda');
const getDbdetails = async (dbConnection, metisApikey, metisExporterUrl, foreignTableName) => {
  const dbDetails = dbDetailsFactory('postgres');
  const db = dbDetails.getExtendedDbDetailsData(dbConnection, {
    getAllExtraData: true,
    slowQueryLogForeignTable: {
      metisApikey: metisApikey,
      metisExporterUrl: metisExporterUrl,
      foreignTableName: foreignTableName,
    },
  });
  return await db;
};

const { processResults } = require('./reports');

const sendDbdetails = async (dbConnection, apiKey, url, data) => {
  axiosPost(
    url,
    {
      pmcDevice: {
        rdbms: 'postgres',
        db_name: dbConnection.database,
        db_host: dbConnection.host,
        dbPort: /*port || */ '5432',
      },
      data: data,
    },
    { 'x-api-key': apiKey }
  );
};

const sendstatStatements = async (dbConnection, apiKey, url, data) => {
  axiosPost(
    url,
    {
      pmcDevice: {
        rdbms: 'postgres',
        db_name: dbConnection.database,
        db_host: dbConnection.host,
        dbPort: /*port || */ '5432',
      },
      data: data,
    },
    { 'x-api-key': apiKey }
  );
};

const sendAvailableExtensions = async (dbConnection, apiKey, url, data) => {
  axiosPost(
    url,
    {
      pmcDevice: {
        rdbms: 'postgres',
        db_name: dbConnection.database,
        db_host: dbConnection.host,
        dbPort: /*port || */ '5432',
      },
      data: data,
    },
    { 'x-api-key': apiKey }
  );
};

const sendPgConfig = async (dbConnection, apiKey, url, data) => {
  axiosPost(
    url,
    {
      pmcDevice: {
        rdbms: 'postgres',
        db_name: dbConnection.database,
        db_host: dbConnection.host,
        dbPort: /*port || */ '5432',
      },
      data: data,
    },
    { 'x-api-key': apiKey }
  );
};

const createPmcDevice = async (dbConnection, apiKey, url) => {
  axiosPost(
    url,
    {
      rdbms: 'postgres',
      db_name: dbConnection.database,
      db_host: dbConnection.host,
      port: '5432',
    },
    { 'x-api-key': apiKey }
  );
};

const sendDataToLambda = async (url, apiKey, dbConnection, tableSize, indexUsage) => {
  const currentDate = new Date().getTime();
  const tableSizePoints = processResults(dbConnection.database, dbConnection.host, tableSize, currentDate);
  const indexUsagePoints = processResults(dbConnection.database, dbConnection.host, indexUsage, currentDate);
  console.log(indexUsagePoints[0]);
  await axiosPost(url, indexUsagePoints, { 'x-api-key': apiKey });
  await axiosPost(url, tableSizePoints, { 'x-api-key': apiKey });
};

const axiosPost = async (url, body, headers) => {
  try {
    await axios.post(url, body, { headers: headers });
  } catch (error) {
    console.log(error);
  }
};

async function main() {
  try {
    let config = parse(core.getInput('db_connection_string'));
    const metisApikey = core.getInput('metis_api_key');
    const metisExporterUrl = core.getInput('metis_exporter_url');
    const foreignTableName = core.getInput('foreign_table_name');
    const dbConnection = {
      database: config.database,
      user: config.user,
      password: config.password,
      host: config.host,
      /*
          Maybe will cause problem need to check:
          ssl, either a boolean or an object with properties
            rejectUnauthorized
            cert
            key
            ca
      */
      // ssl: config?.ssl || { rejectUnauthorized: false },
    };

    await createPmcDevice(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/pmc-device`);
    const dbDetailsExtraData = await getDbdetails(dbConnection, metisApikey, metisExporterUrl, foreignTableName);
    // console.log(dbDetailsExtraData);

    // dbDetails: this.dbDetails,
    // databaseConfig: this.databaseConfig,
    // databaseAvialableExtensions: this.databaseAvialableExtensions,
    // databaseStatStatements: this.databaseStatStatements
    await sendDataToLambda(metisExporterUrl + '/md-collector/', metisApikey, dbConnection, dbDetailsExtraData?.tableSize, dbDetailsExtraData?.indexUsage);
    await sendDbdetails(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/db-details`, dbDetailsExtraData?.dbDetails);
    await sendstatStatements(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/pmc/statistics/query`, dbDetailsExtraData?.databaseStatStatements);
    await sendAvailableExtensions(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/pmc/customer-db-extension`, dbDetailsExtraData?.databaseAvialableExtensions);
    await sendPgConfig(dbConnection, core.getInput('metis_api_key'), `${core.getInput('target_url')}/api/pmc/customer-db-config`, dbDetailsExtraData?.databaseConfig);
  } catch (error) {
    console.error(error);
    core.setFailed(error);
  }
}

main();
