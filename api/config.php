<?php
    $hostname = 'localhost';
    $username = "root";
    $password = "root";
    $database = "app_usages";
    
    $table_collation = "utf8_unicode_ci"; 

    $db = new mysqli($hostname, $username, $password, $database);
    $db->query("SET NAMES utf8");
?>
