
import { v4 as uuidv4 } from 'uuid';

const TAGS = new Set(['schema', 'table', 'index']);

export const processRows =  (databaseName, databaseHost, queryResult, timestamp) =>  {
  const metricsData = [];
  queryResult.forEach((row) => {
    const valueNames = Object.keys(row).filter((key) => !TAGS.has(key));
    valueNames.forEach((valueName) => {
      const metric = {};
      metric.id = uuidv4();
      metric.timestamp = timestamp;
      metric.metricName = valueName;
      metric.value = parseFloat(row[valueName]);
  
      TAGS.forEach((tag) => { if (row[tag]) metric[tag] = row[tag]; });
      metric.db = databaseName;
      metric.host = databaseHost;
      metric.version = '0.63'; //hard coded and probably not true
      metricsData.push(metric);
    });
  });
  
  return metricsData;
}

export  const processResults = (databaseName, databaseHost, results, timestamp) => {
  const res = results.map((queryResult) => processRows(databaseName, databaseHost, queryResult, timestamp));

  return res;
}