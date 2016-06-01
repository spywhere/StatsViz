## StatsViz
Statistic API and visualization

## Installation
Simply put all files in `api` folder to the location you want to use as an API
call path.

For web interface, just put all files in the root directory to the location you
want.

And adjust the following settings...

- `config.php` file for both web interface and API calls
- `visualization.html` file for custom web interface view
- `api_path` for all `.js` files
- `models.php` in API calls for each of the stats table

## Models
`models.php` file is the core of the StatsViz. This file contains all stats table
structure and also the logic for determine the page on each request.

This file consists of various functions, use for each work when needed.

There are only 3 functions that need to customized for StatsViz to works.

### - determine_request
This function mainly use for determine the incoming `GET` request to match with
its model.

This function should returns a string, specify a model name to be use.
Otherwise, return `NULL`.

### - get_stats
This function use for query and prepare the data for visualizations.

This function will recieve `stat_type` from the `name` attribute (details on
*Visualizations* section) and should returns an array contains the following
data structure...

- `generate_mode` A visualization style for this query.  
Can be either `line` or `pie`.
- `table` A database table used in a query.
- `query` A table's fields as in SQL's `SELECT`. The field name should match the
visualization require fields (`key`, `type`, `value` for `line` and `type`, `value` for `pie`).

### - get_models

## Visualizations