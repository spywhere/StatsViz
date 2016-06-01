(function(window, undefined){
    "use strict";
    var api_host = "/api";
    
    var currentFilter = {};
    var sortType = undefined;
    var sortOrder = undefined;
    var limitFrom = 0;
    var queryLimit = undefined;
    var working = false;
    var row_size = 0;

    function createPage(currentType, size, currentPage){
        var firsttime = currentPage === undefined;
        if(firsttime){
            currentPage = 1;
            limitFrom = 0;
        }else{
            limitFrom = (currentPage-1)*queryLimit;
        }
        var code = "";
        var page = 1;

        var totalPages = Math.ceil(size / queryLimit);
        var startPage = 1;
        var maxShown = 15;

        if(currentPage < maxShown){
            startPage = 1;
        }else if(currentPage >= totalPages - Math.floor(maxShown / 2)){
            startPage = totalPages - maxShown + 1;
        }else if(currentPage >= maxShown){
            startPage = currentPage - Math.floor(maxShown / 2);
        }

        if(currentPage >= maxShown){
            code += "<button class=\"btn btn-info btn-xs\" onClick=\"createPage('"+currentType+"', "+size+", 1);\">1</button>";
            code += "<button class=\"btn btn-info btn-xs\">...</button>";
        }
        for(page=startPage;page<startPage+maxShown;page++){
            if(page > totalPages){
                break;
            }
            if(page == currentPage){
                code += "<button class=\"btn btn-primary btn-xs\">"+page+"</button>";
            }else{
                code += "<button class=\"btn btn-info btn-xs\" onClick=\"createPage('"+currentType+"', "+size+", "+page+");\">"+page+"</button>";
            }
        }
        if(currentPage < totalPages - Math.floor(maxShown / 2)){
            code += "<button class=\"btn btn-info btn-xs\">...</button>";
            code += "<button class=\"btn btn-info btn-xs\" onClick=\"createPage('"+currentType+"', "+size+", "+totalPages+");\">"+totalPages+"</button>";
        }

        if(code != ""){
            code = "Page:<br /><div class=\"btn-group\">" + code + "</div>";
        }

        if(firsttime){
            $("#page").slideUp(function(){
                $("#page").html(code);
                $("#page").slideDown();
            });
        }else{
            $("#page").html(code);
            queryData(currentType, currentPage);
        }
        return true;
    }

    function queryDataLimit(){
        working = false;
    }

    function queryData(currentType, currentPage){
        if(working){
            return;
        }
        working = true;
        setTimeout(queryDataLimit, 250);
        currentFilter["request"] = "query";
        currentFilter["type"] = currentType;
        currentFilter["sortType"] = sortType;
        currentFilter["sortOrder"] = sortOrder;
        currentFilter["limitSize"] = queryLimit;
        currentFilter["limitFrom"] = limitFrom;
        var req = $.ajax({
            url: api_host,
            type: "post",
            data: currentFilter,
            dataType: "json"
        });
        req.done(function(data){
            $("#progress").slideDown();
            $("#table").slideUp(function(){
                // alert(JSON.stringify(data["data"]));
                $("#table_body").empty();
                $("#title").html(data["title"]);
                working = true;
                createPage(currentType, parseInt(data["size"]), currentPage);
                working = false;
                $("#subtitle").html(data["subtitle"]);
                if(data["data"].length>0){
                    for(var i in data["data"]){
                        var code = "<tr>";
                        var row = data["data"][i];
                        for(var j in row){
                            var value = row[j];
                            code += "<td>"+value+"</td>"
                        }
                        code += "</tr>";
                        $("#table_body").append(code);
                    }
                }else{
                    $("#table_body").append("<tr><td align=\"center\" colspan=\""+row_size+"\">No Data</td></tr>");
                }
                $("#progress").slideUp();
                $("#table").slideDown();
            });
        });
    }

    function flatenFilterName(filterName){
        var filterNameComponent = filterName.split(" ");
        return filterNameComponent.join("_");
    }

    function requestFilter(currentType, currentFilterName, currentFilterValue){
        var firsttime = currentFilterName == undefined;
        var req = $.ajax({
            url: api_host,
            type: "post",
            data: {"request": "filter", "type": currentType},
            dataType: "json"
        });
        req.done(function(data){
            if(!firsttime){
                currentFilter[flatenFilterName(currentFilterName)] = currentFilterValue
            }
            var code = "Filter:<br />";
            var totalSize = Object.keys(data).length;
            var currentSize = 0;
            for(var i in data){
                var filter = data[i];
                var filterName = filter["name"];
                if(currentSize++==Math.floor(totalSize/2)){
                    code += "<br />";
                }
                code += "<span class=\"label label-primary\">"+filterName+"</span>";
                code += "<select onChange=\"requestFilter('"+currentType+"', '"+filterName+"', this.value);\">"
                for(var j in filter["values"]){
                    var filterValue = filter["values"][j];
                    if(!(flatenFilterName(filterName) in currentFilter) || (flatenFilterName(filterName) in currentFilter && currentFilter[flatenFilterName(filterName)] == filterValue)){
                        currentFilter[flatenFilterName(filterName)] = filterValue;
                        code += "<option value=\""+filterValue+"\" selected=\"selected\">"+filterValue+"</button>";
                    }else{
                        code += "<option value=\""+filterValue+"\">"+filterValue+"</button>";
                    }
                }
                code += "</select>";
            }
            if(firsttime){
                $("#filter").slideUp(function(){
                    $("#filter").html(code);
                    $("#filter").slideDown();
                });
            }else{
                $("#filter").html(code);
            }
            queryData(currentType);
        });
    }

    function requestQueryLimit(currentType, currentLimit){
        var firsttime = currentLimit === undefined;
        var code = "Limit: <div class=\"btn-group\">";
        var data = ["50", "100", "500", "1000", "5000", "10000", "All"];
        queryLimit = currentLimit;
        for(var i in data){
            if(queryLimit===undefined || queryLimit==data[i]){
                queryLimit = data[i];
                code += "<button class=\"btn btn-primary btn-xs\">"+data[i]+"</button>";
            }else{
                code += "<button class=\"btn btn-info btn-xs\" onClick=\"requestQueryLimit('"+currentType+"', '"+data[i]+"');\">"+data[i]+"</button>";
            }
        }
        code += "</div>";
        $("#limit").html(code);
        if(firsttime){
            $("#limit").slideDown();
        }else{
            queryData(currentType);
        }
    }

    function requestSortOrder(currentType, currentSortOrder){
        var firsttime = currentSortOrder === undefined;
        var code = "Sort Order: <div class=\"btn-group\">";
        var data = ["Asc", "Desc"];
        if(firsttime){
            sortOrder = "Desc";
        }else{
            sortOrder = currentSortOrder;
        }
        for(var i in data){
            if(sortOrder===undefined || sortOrder==data[i]){
                sortOrder = data[i];
                code += "<button class=\"btn btn-primary btn-xs\">"+data[i]+"</button>";
            }else{
                code += "<button class=\"btn btn-info btn-xs\" onClick=\"requestSortOrder('"+currentType+"', '"+data[i]+"');\">"+data[i]+"</button>";
            }
        }
        code += "</div>";
        $("#sort_order").html(code);
        if(firsttime){
            $("#sort_order").slideDown();
        }else{
            queryData(currentType);
        }
    }

    function requestSort(currentType, currentSortType){
        var firsttime = currentSortType === undefined;
        var req = $.ajax({
            url: api_host,
            type: "post",
            data: {"request": "sort", "type": currentType},
            dataType: "json"
        });
        req.done(function(data){
            sortType = currentSortType;
            var code = "Sort By: <div class=\"btn-group\">";
            var headercode = ""
            row_size = 0;
            for(var i in data){
                headercode += "<th>"+data[i]+"</th>"
                if(sortType===undefined || sortType==data[i]){
                    sortType = data[i];
                    code += "<button class=\"btn btn-primary btn-xs\">"+data[i]+"</button>";
                }else{
                    code += "<button class=\"btn btn-info btn-xs\" onClick=\"requestSort('"+currentType+"', '"+data[i]+"');\">"+data[i]+"</button>";
                }
                row_size++;
            }
            code += "</div>";
            if(firsttime){
                $("#sort").slideUp(function(){
                    $("#table_header").html(headercode);
                    $("#sort").html(code);
                    $("#sort").slideDown();
                });
            }else{
                $("#table_header").html(headercode);
                $("#sort").html(code);
                queryData(currentType);
            }
        });
    }

    function requestType(currentType){
        var firsttime = currentType === undefined;
        var req = $.ajax({
            url: api_host,
            type: "post",
            data: {"request": "type"},
            dataType: "json"
        });
        req.done(function(data){
            var code = "Type: <div class=\"btn-group\">";
            for(var i in data){
                if(currentType===undefined || currentType==data[i]){
                    currentType = data[i];
                    code += "<button class=\"btn btn-primary btn-xs\">"+data[i]+"</button>";
                }else{
                    code += "<button class=\"btn btn-info btn-xs\" onClick=\"requestType('"+data[i]+"');\">"+data[i]+"</button>";
                }
            }
            code += "</div>";
            $("#type").html(code);
            if(firsttime){
                $("#type").slideDown();
            }
            requestSort(currentType);
            requestSortOrder(currentType);
            requestQueryLimit(currentType);
            requestFilter(currentType);
        });
    }

    function init(){
        requestType();
    }


    init();

    window.requestType = requestType;
    window.requestSort = requestSort;
    window.requestSortOrder = requestSortOrder;
    window.requestQueryLimit = requestQueryLimit;
    window.requestFilter = requestFilter;
    window.createPage = createPage;

})(window);
