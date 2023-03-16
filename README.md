# Metis Analysis

This GitHub action allows you to analyze your database infrastructure using the MetisData API.

## Inputs

- `metis_api_key` (required): MetisData API key for your project.
- `github_token` (required): GitHub personal access token for the action to be able to commit the analysis results back to the repository.
- `target_url` (optional): Target URL for the MetisData API. Defaults to `https://app.metisdata.io`.
- `db_connection_string` (required): Connection string for your database.

## Usage

To use this action, add the following YAML to your GitHub workflow:

```yaml
- name: Metis Analysis
  uses: <your-username>/<your-repo-name>@<release-tag>
  with:
    metis_api_key: ${{ secrets.METIS_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    db_connection_string: ${{ secrets.DB_CONNECTION_STRING }}
```
