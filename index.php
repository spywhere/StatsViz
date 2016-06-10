<?php
include("config.php");

$key_name = isset($_GET["show"]) ? "list_view_title" : "visualizations_title";
?>

<!DOCTYPE html>
<html>
<head>
    <title><?php echo $strings[$key_name]; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.5/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="chart.css">
</head>
<body>
    <div class="container">
    <?php
    if(isset($_GET["show"])){
    ?>
        <h1 id="title"><?php echo $strings["title"]; ?></h1>
        <h4 id="subtitle"><?php echo $strings["subtitle"]; ?></h4>
        <div class="row" id="type" style="display: none;">#Type</div>
        <div class="row" id="sort" style="display: none;">#SortBy</div>
        <div class="row" id="sort_order" style="display: none;">#Asc/Desc</div>
        <div class="row" id="limit" style="display: none;">#Limit</div>
        <div class="row text-center" id="page" style="display: none;">#Page</div>
        <div class="row text-center" id="filter" style="display: none;">#Filter</div>

        <div class="row text-center" id="progress"><h4>Loading...</h4></div>
        <div id="table" style="display: none;">
            <table class="table table-striped">
                <thead>
                    <tr id="table_header"></tr>
                </thead>
                <tbody id="table_body"></tbody>
            </table>
        </div>
    <?php
    }else{
        include("visualization.html");
    }
    ?>
    </div>
    <div class"container" name="footer">
        <div class="row text-center" name="footer">
            <small class="text-muted" name="footer">Copyright &copy; <?php echo date("Y"); ?> Digital Particle. All rights reserved.</small>
        </div>
    </div>
    <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
<?php
if(isset($_GET[$list_view_field])){
?>
    <script src="script.js"></script>
<?php
}else{
?>
    <script src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.6/d3.min.js" charset="utf-8"></script>
    <script src="datascript.js"></script>
<?php
}
?>
    <script src="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.5/js/bootstrap.min.js"></script>
</body>
</html>
