<?php
include("config.php");
include("models.php");

$data = array();
$result = null;

function collect_stats($model_name){
    global $db;
    
    $model = get_models($model_name);
    if(!$model){
        $db->close();
        die("Model \"".$model_name."\" is not exists");
    }else if(!array_key_exists("schema", $model)){
        $db->close();
        die("Model \"".$model_name."\" is malform");
    }

    $query = "INSERT INTO ".$model_name;

    $fieldset = array();
    $valueset = array();
    $values = array();
    $bindset = "";
    foreach ($model["schema"] as $field => $field_info) {
        if(array_key_exists("skip", $field_info) && $field_info["skip"]){
            continue;
        }
        $fieldset[] = $field;
        if(array_key_exists("date", $field_info) && $field_info["date"]){
            $valueset[] = "NOW()";
            continue;
        }else if(array_key_exists("time", $field_info) && $field_info["time"]){
            $valueset[] = "NOW()";
            continue;
        }

        $key_name = "";

        $flatten_field = implode("", explode(" ", $field_info["name"]));
        if(isset($_GET[$flatten_field])){
            $key_name = $flatten_field;
        }else if(isset($_GET[strtolower($flatten_field)])){
            $key_name = strtolower($flatten_field);
        }else{
            foreach ($field_info["alias"] as $alias) {
                if(isset($_GET[$alias])){
                    $key_name = $alias;
                    break;
                }else if(isset($_GET[strtolower($alias)])){
                    $key_name = strtolower($alias);
                    break;
                }
            }
        }

        if($key_name == ""){
            $db->close();
            die("Field \"".$field_info["name"]."\" is required");
        }else if(
            array_key_exists("pattern", $field_info) &&
            !preg_match("/".$field_info["pattern"]."/u", $_GET[$key_name])
        ){
            $db->close();
            die("Field \"".$field_info["name"]."\" value is invalid");
        }

        $bindset[] = "s";
        $valueset[] = "?";
        $values[] = &$_GET[$key_name];
    }

    $query .= " (".implode(",", $fieldset).")";
    $query .= " VALUES(".implode(",", $valueset).")";

    $stmt = $db->prepare($query);
    call_user_func_array(
        array($stmt, "bind_param"),
        array_merge(array(implode("", $bindset)), $values)
    );
    if(!$stmt->execute()){
        die("Faild: ".$stmt->error);
    }
    $stmt->close();
    $db->close();
    echo "Finished";
    exit();
}

$model_name = determine_request();
if($model_name){
    collect_stats($model_name);
}

if(isset($_GET["stats"])){
    $stats_info = get_stats($_GET["stats"]);
    if(!$stats_info){
        echo json_encode(array(
            'key' => array(),
            'data' => array(),
            'error_msg'=>'Error while requesting statistics'
        ));
        exit();
    }
    if(!array_key_exists("query", $stats_info) || !array_key_exists("table", $stats_info)){
        echo json_encode(array(
            'key' => array(),
            'data' => array(),
            'error_msg'=>'Error: Malformed statistics info'
        ));
        exit();
    }
    $debug_mode = isset($_GET["debug"]);

    $query = "SELECT ".$stats_info['query']." FROM ".$stats_info['table'];
    if(array_key_exists("join", $stats_info)){
        $join_info = $stats_info['join'];
        if(!array_key_exists("table", $join_info)){
            echo json_encode(array(
                'key' => array(),
                'data' => array(),
                'error_msg'=>'Error: Missing join table'
            ));
            exit();
        }else if(!array_key_exists("on", $join_info)){
            echo json_encode(array(
                'key' => array(),
                'data' => array(),
                'error_msg'=>'Error: Missing join relationship (\'on\' keyword)'
            ));
            exit();
        }
        if(array_key_exists("type", $join_info)){
            $query .= " ".$join_info['type'];
        }
        $query .= " JOIN ".$join_info['table']." ON ".$join_info['on'];
    }
    if(array_key_exists("where", $stats_info) || array_key_exists("debug", $stats_info)){
        $query .= " WHERE ";
        $added = false;
        if(array_key_exists("where", $stats_info)){
            $query .= $stats_info['where'];
            $added = true;
        }
        if(array_key_exists("debug", $stats_info)){
            if($added){
                $query .= " AND ";
            }
            $query .= $stats_info['debug']."='".(($debug_mode)?"true":"false")."'";
        }
    }
    if(array_key_exists("group", $stats_info)){
        $query .= " GROUP BY ".$stats_info['group'];
    }
    if(array_key_exists("order", $stats_info)){
        $query .= " ORDER BY ".$stats_info['order'];
    }

    $result = $db->query($query);
    if(!$result){
        echo json_encode(array(
            'key' => array(),
            'data' => array(),
            'error_msg'=>'Error: '.$db->error
        ));
        exit();
    }
    $data = array();
    $key = array();
    if($stats_info['generate_mode'] == "line"){
        while($row = $result->fetch_assoc()){
            if(!in_array($row['key'], $key)){
                $key[] = $row['key'];
            }
            $key_index = array_search($row['key'], $key);

            $exists = false;
            $type_data = array('type'=>$row['type'], 'values'=>array());
            foreach ($data as $data_key => $value) {
                if($value['type'] == $row['type']){
                    $type_data = $value;
                    $exists = true;
                    break;
                }
            }

            while(count($type_data['values']) < $key_index){
                $type_data['values'][] = array('y'=>0);
            }
            $type_data['values'][$key_index] = array('y'=>floatval($row['value']));

            if($exists){
                $data[$data_key] = $type_data;
            }else{
                $data[] = $type_data;
            }
        }

        foreach ($data as $data_key => $value) {
            while(count($value['values']) < count($key)){
                $value['values'][] = array('y'=>0);
            }
            $data[$data_key] = $value;
        }
    }else if($stats_info['generate_mode'] == "pie"){
        while($row = $result->fetch_assoc()){
            $value = array();
            $data[] = array('type'=>$row['type'],'value'=>$row['value']);
        }
    }
    echo json_encode(array('key' => $key, 'data' => $data));
    $db->close();
    exit();
}

if(isset($_GET["database"])){
    $table_codes = array();
    foreach (get_models() as $model_name => $model) {
        if($db->query("DESCRIBE ".$model_name)){
            continue;
        }

        $table_code = "CREATE TABLE ".$model_name."(";
        $field_codes = array();
        $last_field_code = "";
        foreach ($model["schema"] as $field_name => $field) {
            $max = 30;
            if(array_key_exists("max", $field)){
                $max = $field["max"];
            }

            $field_code = "    ".$field_name;
            if(array_key_exists("key", $field) && $field["key"]){
                $field_code .= "    INTEGER NOT NULL UNIQUE AUTO_INCREMENT";
                $last_field_code = "    PRIMARY KEY(".$field_name.")";
            }else if(array_key_exists("date", $field) && $field["date"]){
                $field_code .= "    DATE NOT NULL";
            }else if(array_key_exists("time", $field) && $field["time"]){
                $field_code .= "    TIME NOT NULL";
            }else{
                $field_code .= "    VARCHAR(".$max.") NOT NULL";
            }
            $field_codes[] = $field_code;
        }
        if(count($field_codes) > 0){
            $field_codes[] = $last_field_code;
            $table_code .= "\n".implode(",\n", $field_codes)."\n";
        }
        $table_code .= ") COLLATE ".$table_collation.";";

        $db->query($table_code);

        $table_codes[] = $table_code;
    }

    echo "<pre>";
    echo htmlentities(implode("\n\n", $table_codes)."\n");
    echo "</pre>";
    exit();
}

if(isset($_POST["request"]) && $_POST["request"] == "query"){
    $dt = $db->query("SELECT NOW() AS DT")->fetch_assoc();

    $model_info = get_model_info_by_name($_POST["type"]);
    $model = $model_info["model"];
    $query = "SELECT * FROM " . $model_info["name"];
    $where_clauses = array();
    $rawdata = array();

    foreach ($_POST as $key => $value) {
        $key = implode(" ", explode("_", $key));
        $field_info = get_field_info_by_name($model, $key);
        $field = $field_info["field"];
        if(strtolower($value) == "any" || !$field_info){
            continue;
        }else if(!preg_match("/".$field["pattern"]."/u", $value)){
            continue;
        }
        $where_clauses[] = $field_info["name"]."='".$value."'";
    }
    if(count($where_clauses) > 0){
        $query .= " WHERE " . implode(" AND ", $where_clauses);
    }
    if(isset($_POST["sortType"])){
        $field_info = get_field_info_by_name($model, $_POST["sortType"]);
        $query .= " ORDER BY ".$field_info["name"];
        if(isset($_POST["sortOrder"]) && strtolower($_POST["sortOrder"]) == "desc"){
            $query .= " DESC";
        }
    }

    $result = $db->query($query);
    $data["size"] = $result->num_rows;
    $data["title"] = $model["name"]." [".$result->num_rows."]";
    $data["subtitle"] = $dt["DT"];
    if($result->num_rows > 0){
        $result->close();
        if(!isset($_POST["limitSize"]) || strtolower($_POST["limitSize"]) != "all"){
            $query .= " LIMIT ".$_POST["limitFrom"].",".$_POST["limitSize"];
        }
        $result = $db->query($query);
        while($row = $result->fetch_assoc()){
            $rawrow = array();
            foreach($row as $key => $value){
                $rawrow[] = $value;
            }
            $rawdata[] = $rawrow;
        }
    }
    $data["data"] = $rawdata;
}

if(isset($_POST["request"]) && $_POST["request"] == "type"){
    $models = array();
    foreach (get_models() as $model_name => $model) {
        $models[] = $model["name"];
    }
    $data = $models;
}

if(isset($_POST["request"]) && $_POST["request"] == "sort"){
    $model_info = get_model_info_by_name($_POST["type"]);
    $model = $model_info["model"];
    foreach ($model["schema"] as $field => $field_info) {
        $data[] = $field_info["name"];
    }
}

if(isset($_POST["request"]) && $_POST["request"] == "filter"){
    $model_info = get_model_info_by_name($_POST["type"]);
    $model = $model_info["model"];
    foreach ($model["schema"] as $field => $field_info) {
        if(array_key_exists("skip", $field_info) && $field_info["skip"]){
            continue;
        }
        $filter = array();
        $filter["name"] = $field_info["name"];
        $filter["values"] = get_possible_values(
            $model_info["name"], $field
        );
        $data[] = $filter;
    }
}

header('Content-Type: application/json');
echo json_encode($data);
?>
