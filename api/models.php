<?php

function determine_request(){
    // If the request contains "version", use "stats" model.
    if(isset($_GET["Product"])){
        return "stats";
    }
    return NULL;
}

function get_stats($stat_type){
    if($stat_type == "total-sales"){
        return array(
            'generate_mode' => 'stack',
            'table' => 'stats',
            'query' => 'DATE_FORMAT(SendDate,\'%e %M %Y\') as `key`, Product as `type`, COUNT(ProductID) as `value`',
            'where' => 'SendDate > DATE_SUB(NOW(), INTERVAL 1 MONTH)',
            'group' => 'Product, SendDate',
            'order' => 'SendDate',
            'debug' => 'IsDebug'
        );
    }else if($stat_type == "buyer-geography"){
        return array(
            'generate_mode' => 'proportion',
            'table' => 'stats',
            'query' => 'Geography as `type`, COUNT(ProductID) as `value`',
            'group' => 'Geography',
            'order' => 'Geography',
            'debug' => 'IsDebug'
        );
    }else{
        return null;
    }
}

function get_models($model_name){
    $models = array(
        'stats' => array(
            'name' => 'Product Statistics',
            'schema' => array(
                'UID' => array(
                    'name' => 'UID',
                    'skip' => true,
                    'key' => true
                ),
                'SchemaVersion' => array(
                    'name' => 'Schema Version',
                    'pattern' => '\\d+\\.\\d+',
                    'cast' => true,
                    'max' => 10
                ),
                'Product' => array(
                    'name' => 'Product',
                    'pattern' => '\\w+'
                ),
                'ProductID' => array(
                    'name' => 'ProductID',
                    'pattern' => '\\d{1,5}',
                    'reverse_order' => true
                ),
                'Geography' => array(
                    'name' => 'Geography',
                    'pattern' => 'asia|america|europe',
                    'max' => 10
                ),
                'IsDebug' => array(
                    'name' => 'Debug Mode',
                    'pattern' => 'true|false',
                    'reverse_order' => true,
                    'max' => 5
                ),
                'SendDate' => array(
                    'name' => 'Send Date',
                    'date' => true,
                    'reverse_order' => true
                ),
                'SendTime' => array(
                    'name' => 'Send Time',
                    'time' => true
                )
            )
        ),
    );
    if(isset($model_name)){
        if(array_key_exists($model_name, $models)){
            return $models[$model_name];
        }else{
            return null;
        }
    }
    return $models;
}

/////////////////////////////////
// DO NOT EDIT THE CODE BELOWS //
/////////////////////////////////

function get_model_info_by_name($name){
    foreach (get_models() as $model_name => $model) {
        if($model["name"] == $name){
            return array("name" => $model_name, "model" => $model);
        }
    }
    return null;
}

function get_field_info_by_name($model, $name){
    foreach ($model["schema"] as $field_name => $field) {
        if($field["name"] == $name){
            return array("name" => $field_name, "field" => $field);
        }
    }
    return null;
}

function get_possible_values($model_name, $field_name){
    include("config.php");
    $model = get_models($model_name);
    $field = $model["schema"][$field_name];
    $query = "SELECT ".$field_name." FROM ".$model_name;
    $query .= " GROUP BY ".$field_name;
    $query .= " ORDER BY ";
    if(array_key_exists("cast", $field) && $field["cast"]){
        $query .= "CAST(".$field_name." AS SIGNED)";
        $field["reverse_order"] = true;
    }else{
        $query .= $field_name;
    }
    if(array_key_exists("reverse_order", $field) && $field["reverse_order"]){
        $query .= " DESC";
    }

    $values = array();
    $values[] = "Any";

    $result = $db->query($query);

    while($row = $result->fetch_assoc()){
        $values[] = $row[$field_name];
    }

    return $values;
}
