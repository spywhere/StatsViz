(function(window, undefined){
    "use strict";
    var api_host = "api/";

    var colors = d3.scale.category20();
    var tweenDuration = 500;
    var updateInterval = 30000;

    var data = {};

    function requestData(name, type, callback){
        if(name in data){
            if(
                "generate_mode" in data[name] && 
                data[name].generate_mode === "pie"
            ){
                while(data[name].data.length >= 10){
                    data[name].data.shift();
                }
                while(data[name].data.length < 10){
                    data[name].data.push({
                        "type": "port#" + Math.floor(Math.random()*100),
                        "value":  1 + Math.floor(Math.random()*99)
                    });
                }
            }else if("generate_mode" in data[name]){
                while(data[name].key.length >= 30){
                    data[name].key.shift();
                    var key;
                    for(key in data[name].data){
                        data[name].data[key].values.shift();
                    }
                }
                while(data[name].key.length < 30){
                    data[name].key.push("Day " + (++data[name].last_date));
                    var key;
                    for(key in data[name].data){
                        data[name].data[key].values.push({
                            y: 1 + Math.floor(Math.random() * 49)
                        });
                    }
                }
            }
            callback(data[name]);
        }else{
            var chartData = {
                "stats": name
            };

            if(type !== undefined && type !== null){
                chartData["type"] = type;
            }

            $.ajax({
                "url": api_host,
                "method": "GET",
                "dataType": "json",
                "data": chartData,
                "async": false
            }).done(callback);
        }
    }

    function createBarChart(chart, proportion){
        console.log("bar chart: " + chart.attr("name") + (
            proportion ? " [Proportion]" : ""
        ));

        var jChart = $("[name='"+chart.attr("name")+"']");
        var chartWidthAb = parseInt(jChart.css("width"));
        var chartHeight = parseInt(jChart.css("height"));
        var chartOffset = 15;
        var chartType = proportion ? "proportion" : null;

        chart.append("text")
            .attr("class", "loading-text")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .attr("font-size", "25")
            .text("Loading");

        var scaleLayer = chart.append("g").attr("class", "y-grid");

        function update(data){
            var stack = d3.layout.stack().values(
                function(d){
                    return d.values;
                }
            );
            var layeredData = stack(data.data);

            var yMax = d3.max(layeredData, function(layer){
                return d3.max(layer.values, function(d){return d.y0+d.y;});
            });

            if(yMax < 2){
                yMax = 2;
            }

            var yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([chartHeight, 0]);

            var scaleFormat = d3.format(proportion ? "%" : "s");
            var yGrid = d3.svg.axis()
                .scale(yScale)
                .ticks(8)
                .orient("left")
                .tickSize(-chartWidthAb, -chartWidthAb, 0)
                .tickSubdivide(1)
                .tickPadding(-30)
                .tickFormat(function(d){return scaleFormat(proportion ? d / 100 : d);});

            var xScale = d3.scale.ordinal()
                .domain(d3.range(data.key.length))
                .rangeRoundBands([chartOffset, chartWidthAb])

            chart.selectAll(".loading-text,.error-text")
                .attr("fill-opacity", 1)
                .transition().duration(tweenDuration)
                .attr("fill-opacity", 0)
                .remove();
            if(data.data.length <= 0){
                var errorMsg = "No Data";
                if("error_msg" in data){
                    errorMsg = data.error_msg;
                }
                chart.append("text")
                    .attr("fill-opacity", 0)
                    .transition().duration(tweenDuration)
                    .attr("fill-opacity", 1)
                    .attr("class", "error-text")
                    .attr("text-anchor", "middle")
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("font-size", "25")
                    .text(errorMsg);
                return;
            }

            var typeLayers = chart.selectAll(".layer").data(
                layeredData, function(d){
                    return d.type;
                }
            );

            typeLayers.enter().append("g")
                .attr("class", function(d,i){
                    return "layer " + data.data[i].type;
                })
                .attr("fill", function(d,i){return colors(i);})
                .attr("height", chartHeight);

            var rect = typeLayers.selectAll("rect").data(
                function(d, i){
                    return data.data[i].values;
                }
            );

            rect.transition().duration(tweenDuration)
                .attr("y", function(d){return yScale(d.y0+d.y);})
                .attr("height", function(d){
                    return yScale(d.y0)-yScale(d.y0+d.y);
                });

            rect.enter().append("rect")
                .attr("x", function(d, i){return xScale(i+1);})
                .attr("y", chartHeight)
                .attr("width", xScale.rangeBand())
                .attr("height", 0)
                .transition().duration(tweenDuration)
                .attr("x", function(d, i){return xScale(i);})
                .transition().duration(tweenDuration).delay(
                    function(d, i){
                        return i*50;
                    }
                )
                .attr("y", function(d){return yScale(d.y0+d.y);})
                .attr("height", function(d){
                    return yScale(d.y0)-yScale(d.y0+d.y);
                });

            rect.selectAll("title").remove();
            rect.append("title")
                .text(function(d, i){
                    var titles = [data.key[i]];
                    var key;
                    for(key=data.data.length-1;key>=0;key--){
                        if(data.data[key]["type"] === null){
                            continue;
                        }
                        titles.push(
                            data.data[key]["type"] + ": " + (
                                (data.data[key]["values"][i].y === undefined) ?
                                0 : data.data[key]["values"][i].y
                            )
                        );
                    }
                    return titles.join("\n");
                });

            rect.exit()
                .transition().duration(tweenDuration)
                .attr("x", function(d, i){return chartOffset;})
                .attr("width", 0)
                .attr("y", function(d, i){return yScale(d.y0+d.y, i+1);})
                .attr("height", function(d, i){
                    return yScale(d.y0)-yScale(d.y0+d.y, i);
                })
                .remove();

            yGrid.tickSize(-chartWidthAb, -chartWidthAb, 0);
            scaleLayer.transition().call(yGrid);
        }

        setTimeout(function(){
            requestData(chart.attr("name"), chartType, function(data){
                update(data);
            });
        }, 500);
        setInterval(function(){
            requestData(chart.attr("name"), chartType, function(data){
                update(data);
            });
        }, updateInterval);
    }

    function createLineChart(chart, proportion){
        console.log("line chart: " + chart.attr("name") + (
            proportion ? " [Proportion]" : ""
        ));

        var jChart = $("[name='"+chart.attr("name")+"']");
        var chartWidthAb = parseInt(jChart.css("width"));
        var chartHeight = parseInt(jChart.css("height"));
        var chartOffset = 30;
        var chartType = proportion ? "proportion" : null;

        chart.append("text")
            .attr("class", "loading-text")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .attr("font-size", "25")
            .text("Loading");

        var scaleLayer = chart.append("g").attr("class", "y-grid");

        function update(data){
            var yMax = d3.max(data.data, function(layer){
                return d3.max(layer.values, function(d){return d.y;});
            });

            if(yMax < 2){
                yMax = 2;
            }

            var yScale = d3.scale.linear()
                .domain([0, yMax])
                .range([chartHeight, 0]);

            var scaleFormat = d3.format(proportion ? "%" : "s");
            var yGrid = d3.svg.axis()
                .scale(yScale)
                .ticks(8)
                .orient("left")
                .tickSize(-chartWidthAb, -chartWidthAb, 0)
                .tickSubdivide(1)
                .tickPadding(-30)
                .tickFormat(function(d){return scaleFormat(proportion ? d / 100 : d);});

            var xScale = d3.scale.ordinal()
                .domain(d3.range(data.key.length))
                .rangeRoundBands([chartOffset, chartWidthAb]);

            var lineScale = d3.svg.line()
                .interpolate("basis")
                .x(function(d, i){return xScale(i);})
                .y(function(d, i){return yScale(d.y);});

            chart.selectAll(".loading-text,.error-text")
                .attr("fill-opacity", 1)
                .transition().duration(tweenDuration)
                .attr("fill-opacity", 0)
                .remove();
            if(data.data.length <= 0){
                var errorMsg = "No Data";
                if("error_msg" in data){
                    errorMsg = data.error_msg;
                }
                chart.append("text")
                    .attr("fill-opacity", 0)
                    .transition().duration(tweenDuration)
                    .attr("fill-opacity", 1)
                    .attr("class", "error-text")
                    .attr("text-anchor", "middle")
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("font-size", "25")
                    .text(errorMsg);
                return;
            }

            var typeLayers = chart.selectAll(".layer").data(
                data.data, function(d){
                    return d.type;
                }
            );

            var layer = typeLayers.enter().append("g")
                .attr("class", function(d,i){
                    return "layer " + data.data[i].type;
                })
                .attr("fill", function(d,i){return colors(i);})
                .attr("height", chartHeight);
            var legend = layer.append("g")
                .attr("class", "legend");
            legend.append("rect")
                .attr("x", chartWidthAb - 100)
                .attr("y", function(d, i){return 8+i*15;})
                .attr("width", 100)
                .attr("height", 15)
                .attr("fill", "rgba(0,0,0,0.001)");
            legend.on("mouseover", function(){
                    d3.selectAll(".legend")
                        .transition()
                        .attr("opacity", 0);
                })
                .on("mouseout", function(){
                    d3.selectAll(".legend")
                        .transition()
                        .attr("opacity", 1);
                });
            legend.append("text")
                .attr("text-anchor", "end")
                .attr("x", chartWidthAb - 20)
                .attr("y", function(d, i){return 20+i*15;})
                .text(function(d, i){return data.data[i].type;});
            legend.append("circle")
                .attr("cx", chartWidthAb - 10)
                .attr("cy", function(d, i){return 15+i*15;})
                .attr("r", 5)
                .style("stroke", "white")
                .style("stroke-width", 2);
            legend.attr("opacity", 0)
                .transition()
                .attr("opacity", 1);

            var rect = typeLayers.selectAll("path").data(
                function(d, i){
                    return data.data;
                }
            );

            rect.transition().duration(tweenDuration)
                .attr("d", function(d){return lineScale(d.values);});
            
            rect.enter().append("path")
                .attr("class", "line")
                .attr("d", function(d){return lineScale(d.values);})
                .style("stroke-width", "1px")
                .style("fill", "none")
                .style("stroke", function(d, i){return colors(i)});
            

            rect.exit().transition().duration(tweenDuration)
                .attr("opacity", "0")
                .remove();

            yGrid.tickSize(-chartWidthAb, -chartWidthAb, 0);
            scaleLayer.transition().call(yGrid);
        }

        setTimeout(function(){
            requestData(chart.attr("name"), chartType, function(data){
                update(data);
            });
        }, 500);
        setInterval(function(){
            requestData(chart.attr("name"), chartType, function(data){
                update(data);
            });
        }, updateInterval);
    }

    function createPieChart(chart){
        console.log("pie chart: " + chart.attr("name"));

        var jChart = $("[name='"+chart.attr("name")+"']");
        var chartWidth = 100;
        var chartWidthAb = parseInt(jChart.css("width"));
        var chartHeight = parseInt(jChart.css("height"));
        var chartRadius = Math.ceil(Math.min(chartWidthAb, chartHeight)/3);
        var chartOffset = 10;

        chart.append("text")
            .attr("class", "loading-text")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .attr("font-size", "25")
            .text("Loading");

        var donut = d3.layout.pie().value(function(d){
            return d.value;
        });

        var arcLayer = chart.append("g")
            .attr(
                "transform",
                "translate(" + (chartWidthAb / 2) + "," + (chartHeight / 2) +
                ")"
            );

        var labelLayer = chart.append("g")
            .attr(
                "transform",
                "translate(" + (chartWidthAb / 2) + "," + (chartHeight / 2) +
                ")"
            );

        var arc = d3.svg.arc()
            .startAngle(function(d){ return d.startAngle; })
            .endAngle(function(d){ return d.endAngle; })
            .outerRadius(chartRadius);

        var oldPieData = [];
        var pieData = [];

        function pieTween(d, i) {
            var s0;
            var e0;
            if(oldPieData[i]){
                s0 = oldPieData[i].startAngle;
                e0 = oldPieData[i].endAngle;
            } else if (!(oldPieData[i]) && oldPieData[i-1]) {
                s0 = oldPieData[i-1].endAngle;
                e0 = oldPieData[i-1].endAngle;
            } else if(!(oldPieData[i-1]) && oldPieData.length > 0){
                s0 = oldPieData[oldPieData.length-1].endAngle;
                e0 = oldPieData[oldPieData.length-1].endAngle;
            } else {
                s0 = 0;
                e0 = 0;
            }
            var i = d3.interpolate({
                startAngle: s0,
                endAngle: e0
            }, {
                startAngle: d.startAngle,
                endAngle: d.endAngle
            });
            return function(t) {
                var b = i(t);
                return arc(b);
            };
        }

        function removePieTween(d, i) {
            var s0 = 2 * Math.PI;
            var e0 = 2 * Math.PI;
            var i = d3.interpolate({
                startAngle: d.startAngle,
                endAngle: d.endAngle
            }, {
                startAngle: s0,
                endAngle: e0
            });
            return function(t) {
                var b = i(t);
                return arc(b);
            };
        }

        function textTween(d, i) {
            var a;
            if(oldPieData[i]){
                a = (
                    oldPieData[i].startAngle +
                    oldPieData[i].endAngle - Math.PI
                ) / 2;
            } else if (!(oldPieData[i]) && oldPieData[i-1]) {
                a = (
                    oldPieData[i-1].startAngle +
                    oldPieData[i-1].endAngle - Math.PI
                ) / 2;
            } else if(!(oldPieData[i-1]) && oldPieData.length > 0) {
                a = (
                    oldPieData[oldPieData.length-1].startAngle +
                    oldPieData[oldPieData.length-1].endAngle - Math.PI
                ) / 2;
            } else {
                a = 0;
            }
            var b = (d.startAngle + d.endAngle - Math.PI)/2;

            var fn = d3.interpolateNumber(a, b);
            return function(t) {
                var val = fn(t);
                return (
                    "translate(" + Math.cos(val) * (chartRadius+chartOffset) +
                    "," + Math.sin(val) * (chartRadius+chartOffset) + ")"
                );
            };
        }

        function update(data){
            oldPieData = pieData;
            pieData = donut(data.data);

            var rScale = d3.scale.linear()
                .domain([0, d3.sum(data.data, function(d){return d.value;})])
                .range([0, 100]);


            chart.selectAll(".loading-text,.error-text")
                .attr("fill-opacity", 1)
                .transition().duration(tweenDuration)
                .attr("fill-opacity", 0)
                .remove();
            if(data.data.length <= 0){
                var errorMsg = "No Data";
                if("error_msg" in data){
                    errorMsg = data.error_msg;
                }
                chart.append("text")
                    .attr("fill-opacity", 0)
                    .transition().duration(tweenDuration)
                    .attr("fill-opacity", 1)
                    .attr("class", "error-text")
                    .attr("text-anchor", "middle")
                    .attr("x", "50%")
                    .attr("y", "50%")
                    .attr("font-size", "25")
                    .text(errorMsg);
                return;
            }

            var paths = arcLayer.selectAll("path").data(pieData);
            paths.enter().append("path")
                .attr("stroke", "white")
                .attr("stroke-width", 0.5)
                .attr("fill", function(d,i){return colors(i);})
                .append("title")
                .text(function(d){
                    return (
                        d.data.type + ": " + rScale(d.value).toFixed(1) + "%"
                    );
                });
            paths.transition().duration(tweenDuration)
                .attrTween("d", pieTween)
                .select("title")
                .text(function(d){
                    return (
                        d.data.type + ": " + rScale(d.value).toFixed(1) + "%"
                    );
                });;
            paths.exit().transition().duration(tweenDuration)
                .attrTween("d", removePieTween)
                .remove();

            var ticks = labelLayer.selectAll("line").data(pieData);
            ticks.enter().append("line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", -chartRadius - 3)
                .attr("y2", -chartRadius - 8)
                .attr("stroke", "gray")
                .attr("transform", function(d){
                    return (
                        "rotate(" + (d.startAngle + d.endAngle) / 2 *
                        (180 / Math.PI) + ")"
                    );
                })
                .attr("stroke-opacity", 0);
            ticks.transition().duration(tweenDuration)
                .attr("stroke-opacity", 1)
                .attr("transform", function(d){
                    return (
                        "rotate(" + (d.startAngle + d.endAngle) / 2 *
                        (180 / Math.PI) + ")"
                    );
                });
            ticks.exit().remove();

            var labels = labelLayer.selectAll("text.value").data(pieData)
                .attr("dy", function(d){
                    if(
                        (d.startAngle + d.endAngle) / 2 > Math.PI / 2 &&
                        (d.startAngle + d.endAngle) / 2 < Math.PI * 1.5 
                    ){
                        return 5;
                    }else{
                        return -7;
                    }
                })
                .attr("text-anchor", function(d){
                    if((d.startAngle+d.endAngle)/2 < Math.PI){
                        return "beginning";
                    }else{
                        return "end";
                    }
                })
                .text(function(d){
                    return d.data.type;
                });

            labels.enter().append("text")
                .attr("class", "value")
                .attr("font-size", "10px")
                .attr("transform", function(d){
                    return (
                        "translate(" +
                        Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) *
                        (chartRadius+chartOffset) + "," +
                        Math.sin((d.startAngle+d.endAngle - Math.PI)/2) *
                        (chartRadius+chartOffset) + ")"
                    );
                })
                .attr("dy", function(d){
                    if(
                        (d.startAngle + d.endAngle) / 2 > Math.PI / 2 &&
                        (d.startAngle + d.endAngle) /  2 < Math.PI * 1.5
                    ){
                        return 5;
                    }else{
                        return -7;
                    }
                })
                .attr("text-anchor", function(d){
                    if((d.startAngle + d.endAngle) / 2 < Math.PI){
                        return "beginning";
                    }else{
                        return "end";
                    }
                })
                .text(function(d){
                    return d.data.type;
                });

            labels.transition().duration(tweenDuration)
                .attrTween("transform", textTween);

            labels.exit().remove();
        }

        setTimeout(function(){
            requestData(chart.attr("name"), null, function(data){
                update(data);
            });
        }, 500);
        setInterval(function(){
            requestData(chart.attr("name"), null, function(data){
                update(data);
            });
        }, updateInterval);
    }

    function init(){
        var lineCharts = d3.selectAll(".chart");

        lineCharts.each((function(){
            var chart = d3.select(this);
            if(chart.classed("bar-chart")){
                createBarChart(chart, chart.classed("proportion-data"));
            }else if(chart.classed("line-chart")){
                createLineChart(chart, chart.classed("proportion-data"));
            }else if(chart.classed("pie-chart")){
                createPieChart(chart);
            }
        }));
    }


    init();

})(window);
