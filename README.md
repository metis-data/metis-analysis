[![metis](https://static-asserts-public.s3.eu-central-1.amazonaws.com/metis-min-logo.png)](https://www.metisdata.io/)
### Metis Analysis GitHub Action -  PostgreSQL Database Details Collector    

##### This GitHub Action collects and sends various PostgreSQL database details to  Metis. It can collect the following:

 - Schemas structure
 - Available Extensions
 - Query statistics
 - Table statistics
 - Index Usage
 - Slow query log
 - Database configuration

### Inputs
 - db_connection_string: The connection string of the database you want to monitor.

 - metis_api_key: The API key for the Metis service you want to send the database details to.

 - metis_exporter_url: The URL for the Metis exporter.

 - target_url: The URL for your Metis instance.

 - foreign_table_name: The name of the table where the slow query log is saved.   If  not set, the slow query log data will not be collected.

### Outputs
This GitHub Action has no outputs.


### Usage 

```
name: METIS ANALYSIS ACTION EXAMPLE

on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Metis Analysis Data Collector
        uses: metis-data/metis-analysis@v1
        with:
          metis_api_key: ${{ secrets.METIS_API_KEY }} 
          github_token: ${{ secrets.GITHUB_TOKEN }}
          db_connection_string: ${{ secrets.DB_CONNECTION_STRING }}
```