<?php
    $hostname = 'localhost';
    $username = "root";
    $password = "root";
    $database = "app_usages";

    $db = new mysqli($hostname, $username, $password, $database);
    $db->query("SET NAMES utf8");
?>
