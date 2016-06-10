<?php
    // Database connection information
    $hostname = 'localhost';
    $username = "root";
    $password = "root";
    $database = "app_usages";
    
    // A field that will use for an URL that create a database tables
    //   <your_api_path>/?<database_url_field>
    $database_url_field = "database";
    // A table collation that will be use upon creation
    $table_collation = "utf8_unicode_ci"; 

    $db = new mysqli($hostname, $username, $password, $database);
    $db->query("SET NAMES utf8");
?>
