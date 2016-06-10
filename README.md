## StatsViz
A very simple statistic API and visualization web package.

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

Make sure you already setup the database (the table will automatically
generated according to the schema).

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
data structure (returns `NULL` if there is no matched for `stat_type`)...

- `generate_mode` A data generation mode.  
Can be either `stack` (for stacked line or stacked bar charts) or `proportion`
(for pie charts).
- `table` A database table used in a query.
- `query` A table's fields as in SQL's `SELECT`. The field name should match the
visualization require fields
  - For `stack` data generation
    - `key` A title for each group along the X-axis
    - `type` A group name
    - `value` An arbitrary number for the chart
  - For `proportion` data generation
    - `type` A group name
    - `value` An arbitrary number for the chart (% will be automatically
    calculated)
- `join` (optional) An object represents a table joining operation which
consists of the following keys...
  - `type` (optional) A joining type. One of `inner`, `outer`, `left` or
  `right`.
  - `table` A joining table name.
  - `on` A joining relationship.
- `where` (optional) An expression to filter the query as in SQL's `WHERE`.
- `group` (optional) A field name to group the value together as in SQL's
`GROUP BY`.
- `order` (optional) A field name to order the result as in SQL's `ORDER BY`.
- `debug` (optional) A field name that identify if the record is for debug mode
or not.

### - get_models
This function use as a table schema and overall structure of the table in the
database. In addition to that, this function also served as a request filter in
which filter out any invalid or malformed request sent to the API.

This function will recieve a model name (from `determine_request`) and should
returns

- An array of all table schemas with its key as a model name **if a model name
is omitted** 
- A table schema according to the specified model name or `NULL` if no schema is
matched

A table schema consists of the following structure...

- `name` A name in which will show as a schema name in the list view.
- `schema` An object represents a table metadata in which each key is the field
name and its value is a field structure as follows...
  - `name` A name in which the request must send as (all spaces will be
  trimmed).
  - `alias` (optional) An array of names which will use as an alias to name (no
  space will be trimmed).
  - `skip` (optional) A boolean specify if the filter will be hidden or not.
  - `key` (optional) A boolean specify if the field will be use as a primary key.
  - `pattern` (optional) A regular expression to validate the value (this will
  reject the request if the value does not match the expression).
  - `cast` (optional) Cast the value as a signed number (this also enable
  `reverse_order`).
  - `max` (optional) A maximum size of the value (as `VARCHAR`). Default is 30.
  - `reverse_order` (optional) A boolean specify if the filter should be sorted
  in a reverse order.
  - `date` (optional) A boolean specify if the field will be use as a date
  value. Cannot be use with `time`.
  - `time` (optional) A boolean specify if the field will be use as a time
  value. Cannot be use with `date`.

## Visualizations
In order to create a visualization, all models and its structure must be
created first.

To create database's tables according to the models...

`<your_api_path>/?database`

If success, this should display a SQL query that has been use to create tables.

After the tables have been created, you can send the statistics through the API
call and it should store the data into the database if the request is valid.

To create a visualization, just add a `svg` tag to `visualization.html` file
to where you want the visualization to be created.

Next, assign `chart` and either `line-chart` or `pie-chart` class to set the
chart style to its characteristic.

Last, set the `name` attribute to statistic name you want to displayed. This
value should be the one you returned from `get_stats` function in the
`models.php` file.

The rest of the `visualization.html` file is all yours to be customized.

## Web Interface
To see the visualization of your collected statistic data, just navigate to your
web interface path.

To see the raw data from the database, just add `?show` to your web interface
path. This should switch the page mode into the list view, showing all the
records which you can filtered out as you want.
