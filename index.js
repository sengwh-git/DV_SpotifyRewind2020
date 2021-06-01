$(document).ready(function () {
    var chartConfig = {
    target : 'chart',
    data_url : 'final_data_spotify.csv',
    width: 900,
    height: 450,
    val: 90
    };

    var opts = {
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#1ab26b', // #rgb or #rrggbb or array of colors
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
    };

    var target = document.getElementById(chartConfig.target);

    // callback function wrapped for loader in 'init' function
   var spinner = new Spinner(opts).spin(target);


    d3.csv(chartConfig.data_url, function (error, data) {
        if (error) throw error;
        

        var iframe = document.querySelector('iframe');

        iframe.src = "https://open.spotify.com/embed/track/3OC84eKMxRJ4x0Hcwl9i4i";
        iframe.width = '770';
        iframe.height = '90';
        // iframe.width = '400';
        // iframe.height = '20';
        iframe.allowtransparency = "true";

        spinner.stop();

        var selected_country = "";

        var global_region = "global";
        var streams_vs_uniqueid = streams_unique_id(data);
        var top_artists = top_artist(data);
        var track_bars = track_bar(data);
        var time_series = time_series_plot(data);
        var map_plotting = map_plot(data);

        var artist_selected = "";
        var artist_clicked = false;
        var selected_country_for_tracks = "Global";

        // format the numbers
        var format = d3.format(",");

        function update_othercharts(region) {
            global_region = region;
            var temp = data.filter(function (e) {
                return e.REGION == region;
            });
            
            streams_vs_uniqueid.updateScatterplot(temp);
            top_artists.updateBarchart(temp);
            track_bars.updateBarcharts(temp);
            time_series.updateTimeseries(temp);

            document.getElementById("scatterid").textContent="Artist's Number of Unique Songs and Total Streams" + " in " + region;
            document.getElementById("artistid").textContent="Top 15 Artists" + " in " + region;
            document.getElementById("topsongid").textContent="Top 15 Songs" + " in " + region;
            document.getElementById("timeseriesid").textContent="Total Streams" + " in " + region;
            
        }

        function select_artist(){
            if(!!artist_selected){
            var temp = data.filter(function (e) {
                return e.ARTIST == artist_selected;
            });
            temp = temp.filter(function (e) {
                return e.REGION == selected_country_for_tracks;
            });
            track_bars.updateBarcharts(temp);
            time_series.updateTimeseries(temp);
            }
            else{
            var temp = data.filter(function (e) {
                return e.REGION == selected_country_for_tracks;
            });
            track_bars.updateBarcharts(temp);
            time_series.updateTimeseries(temp);}
        }
        
        function map_plot(data) {


            var width = $("#map").width(),
                height = $("#map").height() - 5;
            
            
            // The svg
            var svg = d3.select("#map").append("svg")
                .attr("width", width)
                .attr("height", height)
		        .call(d3.zoom().scaleExtent([1,100]).on("zoom", function () {
				svg.attr("transform", d3.event.transform)
		        }))
		        .append("g");

                svg.append("rect")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("fill", "#3d3d3d");

            // var svg = d3.select("#map")
            //     .append("svg")
            //     .attr("width", width)
            //     .attr("height", height);
            
            // var zoom = d3.zoom()
			// .scaleExtent([1,100])
            //     .on("zoom", zoomed);
            
            // var choropleth_legend = d3.select("#choropleth_legend")
			// .append("svg")
			// .attr("class", "choropleth_legend")
			// .attr("width", 150)
            //     .attr("height", cp_height);
            
            // svg.call(zoom);
            var tooltip = d3.select("body").append("div").attr("class", "toolTip");
        
            // Map and projection
            var path = d3.geoPath();
            var projection = d3.geoMercator()
                .scale(80)
                .center([0, 50])
                .translate([width / 2, height / 2]);
        
            // Data and color scale
            var data = d3.map();
            var colorScale = d3.scaleThreshold()
                .domain([1839070, 39322555, 265550828, 372868494, 2783308132])
                .range(['#8f8f8f', '#e7f8dc', '#a2d99a', '#2fa355', '#016d2c','#023818']);


            // Load external data and boot
            d3.queue()
                .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
                .defer(d3.csv, "region_streams.csv", function (d) { data.set(d.ID, +d.STREAMS, d.REGION); })
        
                .await(ready);

            var isClicked = false;

            function ready(error, topo) {
        
                let mouseOver = function (d) {
                    if (!isClicked) {
                        d3.selectAll(".Country")
                            .transition()
                            .duration(200)
                            .style("opacity", .5)
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .style("opacity", 1)
                            .style("stroke", "black")
                    }

                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .style("font-size", "10px")
                        // .html((d.key) + "<br>" + (d.value) + " Streams");
                        .html(`<b>${d.properties.name}</b><br>is having<br>${format(data.get(d.id) || 0)} streams in total`)

                }
        
                let mouseLeave = function (d) {
                    tooltip.style("display", "none")
                    if (!isClicked) {
                        d3.selectAll(".Country")
                        .transition()
                        .duration(500)
                        .style("opacity", .5)
                    }
                    // d3.select(this)
                    // .transition()
                    // .duration(200)
                    // .style("stroke", "black")
                }
        
                // Draw the map
                svg.append("g")
                    .selectAll("path")
                    .data(topo.features)
                    .enter()
                    .append("path")
                    // draw each country
                    .attr("d", d3.geoPath()
                        .projection(projection)
                    )
                    // set the color of each country
                    .attr("fill", function (d) {
                        d.total = data.get(d.id) || 0;
                        return colorScale(d.total);
                    })
                    .style("stroke", "black")
                    .attr("class", function (d) { return "Country" })
                    .style("opacity", .5)
                    .on("mouseover", mouseOver)
                    .on("mouseleave", mouseLeave)
                    .on("click", function (d) {
                        //remove all color
                        d3.selectAll(".Country")
                        .transition()
                        .duration(200)
                        .style("opacity", 0.5)
                        console.log(d.properties.name)
                        if (d.properties.name != selected_country) {
                            isClicked = true;
                            
                            //select only the region and input the color
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .style("opacity", 1)
                            
                            update_othercharts(d.properties.name);
                            selected_country = d.properties.name;
                            selected_country_for_tracks = d.properties.name;
                        } else {
                            isClicked = false;
                            update_othercharts('Global');
                            selected_country = '';
                            selected_country_for_tracks = 'Global';
                        }
                        
                    })
            }
        }

        function streams_unique_id(data) {
            var margin = { top: 20, right: 30, bottom: 50, left: 90 };
                

            // append the svg object to the body of the page
            var svg = d3.select("#scatterplot")
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
            
            
            var width = $("#scatterplot").width() - margin.left - margin.right,
                height = $("#scatterplot").height() - margin.top - margin.bottom;
            
            var nested_data = d3.nest()
                .key(function (d) { return d.ARTIST; })
                .key(function (d) { return d.SPOTIFY_ID; })
                .rollup(function (leaves) { return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }), "track_name": leaves.TRACK_NAME } })
                .entries(data);
            // console.log(data);

            var nested_data_streams = d3.nest()
                .key(function (d) { return d.ARTIST; })
                .rollup(function (leaves) { return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) } })
                .entries(data);

            var tooltip_data = d3.nest()
                .key(function (d) { return d.ARTIST; })
                .key(function (d) { return d.TRACK_NAME; })
                .rollup(function (leaves) { return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) })
                .entries(data);
            // console.log(nested_data_streams);
            // console.log(nested_data_streams.map(d => d.key));
            // console.log(tooltip_data);
            // var filtered = tooltip_data.filter(function (d) {
            //     return d.key == "Tones And I";
            // });

            // console.log(filtered);
            // console.log(d3.max(nested_data.map(d => d.values.length)));
            // console.log(nested_data.map(d => d.values.length))
            // console.log(nested_data_streams.map(d => d.value.streams));

            var artists = nested_data_streams.map(d => d.key);
            var arrayX = nested_data.map(d => d.values.length);
            var arrayY = nested_data_streams.map(d => d.value.streams);
            var new_data = { "unique_id_counts": nested_data.map(d => d.values.length), "total_streams": nested_data_streams.map(d => d.value.streams) }
            var newArray = arrayX.map(function (e, i) { return { "unique_id_counts": e, "total_streams": arrayY[i], "artist": artists[i] } });
            // console.log(newArray);

            var tooltip = d3.select("body").append("div").attr("class", "scatter_toolTip");
            // Add X axis
            var x = d3.scaleLinear()
                .domain([0, d3.max(nested_data.map(d => d.values.length)) + 2])
                .range([0, width]);
            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));
            // Add X axis Label
            svg.append("text")
                .attr("class", "axis axis--x")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.top + 20) + ")")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .text("Number of Unique Songs");

            // Add Y axis
            var y = d3.scaleLinear()
                .domain([0, d3.max(nested_data_streams.map(d => d.value.streams)) / 1000000])
                .range([height, 0]);

            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y));

            // add Y axis Label
            svg.append("text")
                .attr("class", "axis axis--y")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .text("Total Number of Streams (in Millions)");

            // Add dots

            svg.append('g')
                .selectAll("dot")
                .data(newArray)
                .enter()
                .append("circle")
                .attr("r", 3.5)
                .style("fill", "#1ab26b")
                .style("stroke", "Black")
                .on("mouseover", function (d) {
                    tooltip.html("Artist: " + d.artist
                        + "<br>Total Songs: " + d.unique_id_counts + "<br>Total Streams: " + format(d.total_streams) + "<br><br><div id='my_tooltip'></div>")
                        .style("left", d3.event.pageX - 100 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")


                    // filter the Artist
                    var filtered = tooltip_data.filter(function (e) {
                        return e.key == d.artist;
                    });
                    filtered = filtered[0].values.slice(0, 5).sort((a, b) => d3.descending(a.value, b.value));
                    // console.log(filtered)


                    var margin = { top: 20, right: 150, bottom: 60, left: 270 },
                        width = 650 - margin.left - margin.right,
                        height = 200 - margin.top - margin.bottom;

                    // append the svg object to the body of the page
                    var svg = d3.select("#my_tooltip")
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")")
                        .style("font-size", 10);

                    var x = d3.scaleLinear()
                        .domain([0, (d3.max(filtered.map(d => d.value / 1000000)))])
                        .range([0, width]);

                    // console.log(d3.max(filtered.map(d => d.value)))

                    svg.append("g")
                        .attr("class", "axis axis--line-x-tooltip")
                        .attr("transform", "translate(0," + height + ")")
                        .call(d3.axisBottom(x))
                        .selectAll("text")
                        .attr("transform", "translate(-10,0)rotate(-45)")
                        .style("text-anchor", "end");

                    // text label for the x axis
                    svg.append("text")
                        .attr("class", "axis axis--x")
                        .attr("transform",
                            "translate(" + (width / 2) + " ," +
                            (height + margin.top + 30) + ")")
                        .style("text-anchor", "middle")
                        .style("font-weight", 700)
                        .text("Streams (in Millions)");

                    // Y axis
                    var y = d3.scaleBand()
                        .range([0, height])
                        //.domain(data.map(function(d) { return d.ARTIST; }))
                        .domain(filtered.map(function (d) { return d.key; }))
                        .padding(.1);
                    svg.append("g")
                        .attr("class", "axis axis--line-y-tooltip")
                        .call(d3.axisLeft(y))

                    // text label for the y axis
                    // svg.append("text")
                    //     .attr("transform", "rotate(0)")
                    //     .attr("y", 7-margin.left)
                    //     .attr("x", 0 - (height / 2))
                    //     .attr("dy", "1em")
                    //     .style("text-anchor", "middle")
                    //     .text("Track Name");

                    svg.append("text")
                        .attr("class", "axis axis--y")
                        .attr("transform",
                            "translate(" + (-75) + " ," +
                            (-10) + ")")
                        .style("text-anchor", "left")
                        .style("font-weight", 700)
                        .text("Track Name");



                    //Bars
                    svg.selectAll("myRect")
                        .data(filtered)
                        .enter()
                        .append("rect")
                        .attr("x", x(0))
                        // .attr("y", function(d) { return y(d.ARTIST); })
                        // .attr("width", function(d) { return x(d.STREAMS); })
                        .attr("y", function (d) { return y(d.key); })
                        // .transition()
                        // .duration(500)
                        .attr("width", function (d) { return x(d.value / 1000000); })
                        .attr("height", y.bandwidth())
                        .attr("fill", "#1ab26b");

                    svg.selectAll(".label")//select all DOMs with class label.
                        .data(filtered)
                        .enter()
                        .append("text")
                        .attr("class", "label")
                        .attr("y", function (d) {
                            // console.log(y(d.key));
                            return y(d.key) + y.bandwidth() / 1.5; //y location of the label
                        })
                        .text(function (d, i) {
                            return Math.round(d.value / 1000000 * 100) / 100

                        })
                        // .transition()
                        // // .duration(100)
                        .attr("x", function (d) {
                            return x(d.value / 1000000) + 2;//x location of the label
                        })
                    // .delay(function (d, i) { console.log(i); return (i * 100) })



                }
                )
                .on("mouseout", function (d) { tooltip.style("display", "none"); })
                // .on('click', function (d) {
                //     if (clickFlag) {
                //         tooltip.hide(d);
                //     } else {
                //         tooltip.show(d);
                //     }
                //     return clickFlag = !clickFlag;

                // })
                .attr("cy", function (d) { return y(d.total_streams / 1000000); })
                .transition()
                .duration(800)
                .attr("cx", function (d) {
                    // console.log(d.unique_id_counts)
                    return x(d.unique_id_counts);
                })
                .delay(function (d, i) {
                    // console.log(i); 
                    return (i * 1 / 5)
                })
            
            update_scatterplot(data);

            function update_scatterplot(data) {
                var data = data;
                var margin = { top: 20, right: 30, bottom: 50, left: 90 };
                
                //remove existing graphs to replace with newly updated graphs
                d3.select('#scatterplot').select("svg").remove();
                d3.select("#scatter_toolTip").remove();
                // append the svg object to the body of the page
                var svg = d3.select("#scatterplot")
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");
                
                
                var width = $("#scatterplot").width() - margin.left - margin.right,
                    height = $("#scatterplot").height() - margin.top - margin.bottom;
                
                var nested_data = d3.nest()
                    .key(function (d) { return d.ARTIST; })
                    .key(function (d) { return d.SPOTIFY_ID; })
                    .rollup(function (leaves) { return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }), "track_name": leaves.TRACK_NAME } })
                    .entries(data);
                // console.log(data);

                var nested_data_streams = d3.nest()
                    .key(function (d) { return d.ARTIST; })
                    .rollup(function (leaves) { return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) } })
                    .entries(data);

                var tooltip_data = d3.nest()
                    .key(function (d) { return d.ARTIST; })
                    .key(function (d) { return d.TRACK_NAME; })
                    .rollup(function (leaves) { return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) })
                    .entries(data);
                // console.log(nested_data_streams);
                // console.log(nested_data_streams.map(d => d.key));
                // console.log(tooltip_data);
                // var filtered = tooltip_data.filter(function (d) {
                //     return d.key == "Tones And I";
                // });

                // console.log(filtered);
                // console.log(d3.max(nested_data.map(d => d.values.length)));
                // console.log(nested_data.map(d => d.values.length))
                // console.log(nested_data_streams.map(d => d.value.streams));

                var artists = nested_data_streams.map(d => d.key);
                var arrayX = nested_data.map(d => d.values.length);
                var arrayY = nested_data_streams.map(d => d.value.streams);
                var new_data = { "unique_id_counts": nested_data.map(d => d.values.length), "total_streams": nested_data_streams.map(d => d.value.streams) }
                var newArray = arrayX.map(function (e, i) { return { "unique_id_counts": e, "total_streams": arrayY[i], "artist": artists[i] } });
                // console.log(newArray);
                d3.select('#toolTip').remove();
                var tooltip = d3.select("body").append("div").attr("class", "scatter_toolTip");
                // Add X axis
                var x = d3.scaleLinear()
                    .domain([0, d3.max(nested_data.map(d => d.values.length)) + 2])
                    .range([0, width]);
                svg.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x));
                // Add X axis Label
                svg.append("text")
                    .attr("class", "axis axis--x")
                    .attr("transform",
                        "translate(" + (width / 2) + " ," +
                        (height + margin.top + 20) + ")")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .text("Number of Unique Songs");

                // Add Y axis
                var y = d3.scaleLinear()
                    .domain([0, d3.max(nested_data_streams.map(d => d.value.streams)) / 1000000])
                    .range([height, 0]);

                svg.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y));

                // add Y axis Label
                svg.append("text")
                    .attr("class", "axis axis--y")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0 - margin.left)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .text("Total Number of Streams (in Millions)");

                // Add dots

                svg.append('g')
                    .selectAll("dot")
                    .data(newArray)
                    .enter()
                    .append("circle")
                    .attr("r", 3.5)
                    .style("fill", "#1ab26b")
                    .style("stroke", "Black")
                    .on("mouseover", function (d) {
                        tooltip.html("Artist: " + d.artist
                            + "<br>Total Songs: " + d.unique_id_counts + "<br>Total Streams: " + format(d.total_streams) + "<br><br><div id='scatter_toolTip'></div>")
                            .style("left", d3.event.pageX - 100 + "px")
                            .style("top", d3.event.pageY - 70 + "px")
                            .style("display", "inline-block")


                        // filter the Artist
                        var filtered = tooltip_data.filter(function (e) {
                            return e.key == d.artist;
                        });
                        filtered = filtered[0].values.slice(0, 5).sort((a, b) => d3.descending(a.value, b.value));
                        // console.log(filtered)


                        var margin = { top: 20, right: 150, bottom: 60, left: 270 },
                            width = 650 - margin.left - margin.right,
                            height = 200 - margin.top - margin.bottom;

                        // append the svg object to the body of the page
                        var svg = d3.select("#scatter_toolTip")
                            .append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform",
                                "translate(" + margin.left + "," + margin.top + ")")
                            .style("font-size", 10);

                        var x = d3.scaleLinear()
                            .domain([0, (d3.max(filtered.map(d => d.value / 1000000)))])
                            .range([0, width]);

                        // console.log(d3.max(filtered.map(d => d.value)))

                        svg.append("g")
                            .attr("class", "axis axis--line-x-tooltip")
                            .attr("transform", "translate(0," + height + ")")
                            .call(d3.axisBottom(x))
                            .selectAll("text")
                            .attr("transform", "translate(-10,0)rotate(-45)")
                            .style("text-anchor", "end");

                        // text label for the x axis
                        svg.append("text")
                            .attr("class", "axis axis--x")
                            .attr("transform",
                                "translate(" + (width / 2) + " ," +
                                (height + margin.top + 30) + ")")
                            .style("text-anchor", "middle")
                            .style("font-weight", 700)
                            .text("Streams (in Millions)");

                        // Y axis
                        var y = d3.scaleBand()
                            .range([0, height])
                            //.domain(data.map(function(d) { return d.ARTIST; }))
                            .domain(filtered.map(function (d) { return d.key; }))
                            .padding(.1);
                        svg.append("g")
                            .attr("class", "axis axis--line-y-tooltip")
                            .call(d3.axisLeft(y))

                        // text label for the y axis
                        // svg.append("text")
                        //     .attr("transform", "rotate(0)")
                        //     .attr("y", 7-margin.left)
                        //     .attr("x", 0 - (height / 2))
                        //     .attr("dy", "1em")
                        //     .style("text-anchor", "middle")
                        //     .text("Track Name");

                        svg.append("text")
                            .attr("class", "axis axis--y")
                            .attr("transform",
                                "translate(" + (-75) + " ," +
                                (-10) + ")")
                            .style("text-anchor", "left")
                            .style("font-weight", 700)
                            .text("Track Name");



                        //Bars
                        svg.selectAll("myRect")
                            .data(filtered)
                            .enter()
                            .append("rect")
                            .attr("x", x(0))
                            // .attr("y", function(d) { return y(d.ARTIST); })
                            // .attr("width", function(d) { return x(d.STREAMS); })
                            .attr("y", function (d) { return y(d.key); })
                            // .transition()
                            // .duration(500)
                            .attr("width", function (d) { return x(d.value / 1000000); })
                            .attr("height", y.bandwidth())
                            .attr("fill", "#1ab26b");

                        svg.selectAll(".label")//select all DOMs with class label.
                            .data(filtered)
                            .enter()
                            .append("text")
                            .attr("class", "label")
                            .attr("y", function (d) {
                                // console.log(y(d.key));
                                return y(d.key) + y.bandwidth() / 1.5; //y location of the label
                            })
                            .text(function (d, i) {
                                return Math.round(d.value / 1000000 * 100) / 100

                            })
                            // .transition()
                            // // .duration(100)
                            .attr("x", function (d) {
                                return x(d.value / 1000000) + 2;//x location of the label
                            })
                        // .delay(function (d, i) { console.log(i); return (i * 100) })



                    }
                    )
                    .on("mouseout", function (d) { tooltip.style("display", "none"); })
                    // .on('click', function (d) {
                    //     if (clickFlag) {
                    //         tooltip.hide(d);
                    //     } else {
                    //         tooltip.show(d);
                    //     }
                    //     return clickFlag = !clickFlag;

                    // })
                    .attr("cy", function (d) { return y(d.total_streams / 1000000); })
                    .transition()
                    .duration(500)
                    .attr("cx", function (d) {
                        // console.log(d.unique_id_counts)
                        return x(d.unique_id_counts);
                    })
                    .delay(function (d, i) {
                        // console.log(i); 
                        return (i * 1 / 5)
                    })
            }
            
            this.updateScatterplot = function (raw_data) {
                update_scatterplot(raw_data);
            }
            return this;


        }

        function top_artist(data) {
            // set the dimensions and margins of the graph
            var margin = { top: 20, right: 50, bottom: 60, left: 130 };
    
            // append the svg object to the body of the page
            var svg = d3.select("#barchart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
    
            var width = $("#barchart").width() - margin.left - margin.right,
                height = $("#barchart").height() - margin.top - margin.bottom;

            var tooltip = d3.select("body").append("div").attr("class", "toolTip");

            var filtered = data.filter(function (e) {
                return e.REGION == "Global";
            });

            var nested_data_streams = d3.nest()
                .key(function (d) { return d.ARTIST; })
                .rollup(function (leaves) { return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) })
                .entries(filtered);

            var nested_top = nested_data_streams.slice().sort((a, b) => d3.descending(a.value, b.value));
            nested_top = nested_top.slice(0, 15);
            console.log(nested_data_streams);
            console.log(nested_top);
    
            // Add X axis
            var x = d3.scaleLinear()
                .domain([0, (d3.max(nested_top.map(d => d.value))) / 1000000])
                .range([0, width]);
            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            // text label for the x axis
            svg.append("text")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.top + 30) + ")")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .style('font-family', '"Montserrat", sans-serif')
                .text("Streams (Millions)");

            // Y axis
            var y = d3.scaleBand()
                .range([0, height])
                //.domain(data.map(function(d) { return d.ARTIST; }))
                .domain(nested_top.map(function (d) { return d.key; }))
                .padding(.1);
            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y))

            // text label for the y axis
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -5 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .style('font-family', '"Montserrat", sans-serif')
                .text("Artist");

            //Bars
            var current_key = "";
            var previous_key = "";
            var click = 0;
            svg.selectAll("myRect")
            .data(nested_top)
            .enter()
            .append("rect")
            // .attr("x", x(0) )
            .attr("y", function(d) { return y(d.key); })
            // .attr("width", function(d) { return x(d.value/1000000); })
            .attr("height", y.bandwidth() )
            .attr("fill", "#1ab26b")
            .on("click", function (d) {
                previous_key = d.key;
                if (previous_key == current_key){
                    document.getElementById("topsongid").textContent="Top 15 Songs" + " in " + selected_country_for_tracks;
                    document.getElementById("timeseriesid").textContent="Total Streams in 2020" + " in " + selected_country_for_tracks;
                    current_key = "";
                    artist_selected = "";
                    select_artist();
                } else{
                    document.getElementById("topsongid").textContent="Top Songs by " + d.key + " in " + selected_country_for_tracks;
                    document.getElementById("timeseriesid").textContent="Total Streams of " + d.key + " in 2020" + " in " + selected_country_for_tracks;
                    artist_selected = d.key;
                    artist_clicked = !artist_clicked;
                    current_key = d.key;
                    select_artist();
                }
            })
            .on("mouseover", function() {
                d3.select(this)
                  .attr("fill", "orange");
              })
            .on("mousemove", function(d){
                tooltip
                    .style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY - 70 + "px")
                    .style("display", "inline-block")
                    .style("font-size", "10px")
                    // .html((d.key) + "<br>" + (d.value) + " Streams");
                    .html(`<b>${d.key}</b><br>is having<br>${format(d.value)} streams in total`)
            })
            .on("mouseout", function(d){ 
                tooltip.style("display", "none")
                d3.select(this)
                  .attr("fill", "#1ab26b");
              })
            .attr("x", x(0) )
            .transition()
            .duration(800)
            .attr("width", function(d) { return x(d.value/1000000); })
            .delay(function(d,i){console.log(i) ; return(i*100)})
    
            // svg.selectAll(".label")//select all DOMs with class label.
            //     .data(nested_top)
            //     .enter()
            //     .append("text")
            //     .attr("class", "label")
            //     .style('font-family', '"Montserrat", sans-serif')
            //     .style("font-size", "12px")
            //     .style("font-weight", 700)
            //     .attr("y", function (d) {
            //         console.log(y(d.key));
            //         return y(d.key) + y.bandwidth() / 1.5; //y location of the label
            //     })
            //     .text(function (d, i) {
            //         return Math.round(d.value / 1000000 * 100) / 100;
            //     })
            //     .transition()
            //     .duration(800)
            //     .attr("x", function (d) {
            //         return x(d.value / 1000000) - 46;//x location of the label
            //     })
            //     .delay(function (d, i) { console.log(i); return (i * 100) })

            svg.selectAll(".label")//select all DOMs with class label.
                .data(nested_top)
                .enter()
                .append("text")
                .attr("class", "label")
                .style('font-family', '"Montserrat", sans-serif')
                .style("font-size", "12px")
                .style("font-weight", 700)
                .attr("y", function (d) {
                    // console.log(y(d.key));
                    return y(d.key) + y.bandwidth() / 1.5; //y location of the label
                })
                .text(function (d, i) {
                    return Math.round(d.value / 1000000 * 100) / 100

                })
                .transition()
                .duration(800)
                .attr("x", function (d) {
                    return x(d.value / 1000000) + 2;//x location of the label
                })
                .delay(function (d, i) { console.log(i); return (i * 100) })
        
            update_bar_chart(data);

            function update_bar_chart(data) {
                var margin = { top: 20, right: 50, bottom: 60, left: 130 };
                d3.select('#barchart').select("svg").remove();
                d3.select("#toolTip").remove();
    
                // append the svg object to the body of the page
                var svg = d3.select("#barchart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");
        
                var width = $("#barchart").width() - margin.left - margin.right,
                    height = $("#barchart").height() - margin.top - margin.bottom;

                var tooltip = d3.select("body").append("div").attr("class", "toolTip");

                var filtered = data;

                var nested_data_streams = d3.nest()
                    .key(function (d) { return d.ARTIST; })
                    .rollup(function (leaves) { return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }) })
                    .entries(filtered);

                var nested_top = nested_data_streams.slice().sort((a, b) => d3.descending(a.value, b.value));
                nested_top = nested_top.slice(0, 15);
                console.log(nested_data_streams);
                console.log(nested_top);
        
                // Add X axis
                var x = d3.scaleLinear()
                    .domain([0, (d3.max(nested_top.map(d => d.value))) / 1000000])
                    .range([0, width]);
                svg.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");

                // text label for the x axis
                svg.append("text")
                    .attr("transform",
                        "translate(" + (width / 2) + " ," +
                        (height + margin.top + 30) + ")")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .style('font-family', '"Montserrat", sans-serif')
                    .text("Streams (Millions)");
    
                // Y axis
                var y = d3.scaleBand()
                    .range([0, height])
                    //.domain(data.map(function(d) { return d.ARTIST; }))
                    .domain(nested_top.map(function (d) { return d.key; }))
                    .padding(.1);
                svg.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y))

                // text label for the y axis
                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -5 - margin.left)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .style('font-family', '"Montserrat", sans-serif')
                    .text("Artist");
    
                //Bars
                var current_key = "";
                var previous_key = "";
                var click = 0;
                svg.selectAll("myRect")
                .data(nested_top)
                .enter()
                .append("rect")
                // .attr("x", x(0) )
                .attr("y", function(d) { return y(d.key); })
                // .attr("width", function(d) { return x(d.value/1000000); })
                .attr("height", y.bandwidth() )
                .attr("fill", "#1ab26b")
                .on("click", function (d) {
                    previous_key = d.key;
                    if (previous_key == current_key){
                        document.getElementById("topsongid").textContent="Top 15 Songs" + " in " + selected_country_for_tracks;
                        document.getElementById("timeseriesid").textContent="Total Streams in 2020" + " in " + selected_country_for_tracks;
                        current_key = "";
                        artist_selected = "";
                        select_artist();
                    } else{
                        document.getElementById("topsongid").textContent="Top Songs by " + d.key + " in " + selected_country_for_tracks;
                        document.getElementById("timeseriesid").textContent="Total Streams of " + d.key + " in 2020" + " in " + selected_country_for_tracks;
                        artist_selected = d.key;
                        artist_clicked = !artist_clicked;
                        current_key = d.key;
                        select_artist();
                    }
                })
                .on("mouseover", function() {
                    d3.select(this)
                    .attr("fill", "orange");
                })
                .on("mousemove", function(d){
                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .style("font-size", "10px")
                        // .html((d.key) + "<br>" + (d.value) + " Streams");
                        .html(`<b>${d.key}</b><br>is having<br>${format(d.value)} streams in total`)
                })
                .on("mouseout", function(d){ 
                    tooltip.style("display", "none")
                    d3.select(this)
                    .attr("fill", "#1ab26b");
                })
                .attr("x", x(0) )
                .transition()
                .duration(800)
                .attr("width", function(d) { return x(d.value/1000000); })
                .delay(function(d,i){console.log(i) ; return(i*100)})
        
                // svg.selectAll(".label")//select all DOMs with class label.
                //     .data(nested_top)
                //     .enter()
                //     .append("text")
                //     .attr("class", "label")
                //     .style('font-family', '"Montserrat", sans-serif')
                //     .style("font-size", "12px")
                //     .style("font-weight", 700)
                //     .attr("y", function (d) {
                //         console.log(y(d.key));
                //         return y(d.key) + y.bandwidth() / 1.5; //y location of the label
                //     })
                //     .text(function (d, i) {
                //         return Math.round(d.value / 1000000 * 100) / 100;
                //     })
                //     .transition()
                //     .duration(800)
                //     .attr("x", function (d) {
                //         return x(d.value / 1000000) - 46;//x location of the label
                //     })
                //     .delay(function (d, i) { console.log(i); return (i * 100) })

                svg.selectAll(".label")//select all DOMs with class label.
                    .data(nested_top)
                    .enter()
                    .append("text")
                    .attr("class", "label")
                    .style('font-family', '"Montserrat", sans-serif')
                    .style("font-size", "12px")
                    .style("font-weight", 700)
                    .attr("y", function (d) {
                        // console.log(y(d.key));
                        return y(d.key) + y.bandwidth() / 1.5; //y location of the label
                    })
                    .text(function (d, i) {
                        return Math.round(d.value / 1000000 * 100) / 100
    
                    })
                    .transition()
                    .duration(800)
                    .attr("x", function (d) {
                        return x(d.value / 1000000) + 2;//x location of the label
                    })
                    .delay(function (d, i) { console.log(i); return (i * 100) })
            
            }
            this.updateBarchart = function (raw_data) {
                update_bar_chart(raw_data);
            }
            return this;


        }

        function track_bar(data) {

            // set the dimensions and margins of the graph
            var margin = { top: 20, right: 100, bottom: 60, left: 250 };
        
            // append the svg object to the body of the page
            var svg = d3.select("#trackview")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        
            var width = $("#trackview").width() - margin.left - margin.right,
                height = $("#trackview").height() - margin.top - margin.bottom;

            var tooltip = d3.select("body").append("div").attr("class", "toolTip");
            var format = d3.format(",");
        
            var nested_data_streams = d3.nest()
                .key(function (d) { return d.SPOTIFY_ID; })
                .rollup(function (leaves) {
                    // console.log(leaves) 
                    return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }), "track_name": leaves.map(d => d.TRACK_NAME)[0], "artist": leaves.map(d => d.ARTIST)[0] }
                })
                .entries(data);

            var nested_top = nested_data_streams.slice().sort((a, b) => d3.descending(a.value.streams, b.value.streams));
            nested_top = nested_top.slice(0, 15);
            console.log(nested_data_streams);
            console.log(nested_top);

            // Add X axis
            var x = d3.scaleLinear()
                .domain([0, (d3.max(nested_top.map(d => d.value.streams))) / 1000000])
                .range([0, width]);
            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            // text label for the x axis
            svg.append("text")
                .attr("transform",
                    "translate(" + (width / 2) + " ," +
                    (height + margin.top + 30) + ")")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .style('font-family', '"Montserrat", sans-serif')
                .text("Streams (Millions)");
    
            // Y axis
            var y = d3.scaleBand()
                .range([0, height])
                //.domain(data.map(function(d) { return d.ARTIST; }))
                .domain(nested_top.map(function (d) { return d.value.track_name; }))
                .padding(.1);
            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y))

            // text label for the y axis
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -5 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-weight", 700)
                .style('font-family', '"Montserrat", sans-serif')
                .text("Track Name");
    
            //Bars
            var isClicked = false;
            svg.selectAll("myRect")
                .data(nested_top)
                .enter()
                .append("rect")
                // .attr("x", x(0))
                .attr("y", function (d) { return y(d.value.track_name); })
                // .attr("width", function (d) { return x(d.value.streams / 1000000); })
                .attr("height", y.bandwidth())
                .attr("fill", "#1ab26b")
                .on("click", function (d) {
                    // isClicked = !isClicked;
                    // var nextColor = this.style.fill == "orange" ? "#145c2c" : "orange";
                    // d3.select(this).style("fill", nextColor)
                    iframe.src = "https://open.spotify.com/embed/track/" + d.key;
                    iframe.width = '770';
                    iframe.height = '90';
                    iframe.allowtransparency = "true";
                })
                .on("mousemove", function (d) {
                    tooltip
                        .style("left", d3.event.pageX - 50 + "px")
                        .style("top", d3.event.pageY - 70 + "px")
                        .style("display", "inline-block")
                        .style("font-size", "10px")
                        .html(`Track Name: <b>${d.value.track_name}</b><br>Artist: <b>${d.value.artist}</b><br>${format(d.value.streams)} streams in total`);
                })
                .on("mouseover", function () {
                    if (d3.select(this).attr('fill') == "#1ab26b") {
                        d3.select(this)
                            .attr("fill", "orange");
                    }
                })
                .on("mouseout", function (d) {
                    tooltip.style("display", "none")
                    d3.select(this)
                        .attr("fill", "#1ab26b");
                })
                .attr("x", x(0))
                .transition()
                .duration(800)
                .attr("width", function (d) { return x(d.value.streams / 1000000); })
                .delay(function (d, i) { console.log(i); return (i * 100) })

            svg.selectAll(".label")//select all DOMs with class label.
                .data(nested_top)
                .enter()
                .append("text")
                .attr("class", "label")
                .style('font-family', '"Montserrat", sans-serif')
                .style("font-size", "12px")
                .style("font-weight", 700)
                .attr("y", function (d) {
                    console.log(y(d.value.streams));
                    return y(d.value.track_name) + y.bandwidth() / 1.5; //y location of the label
                })
                .text(function (d, i) {
                    return Math.round(d.value.streams / 1000000 * 100) / 100;
                })
                .transition()
                .duration(800)
                .attr("x", function (d) {
                    return x(d.value.streams / 1000000) + 2;//x location of the label
                })
                .delay(function (d, i) { console.log(i); return (i * 100) })

            update_bar_charts(data);
            function update_bar_charts(data) {
                // set the dimensions and margins of the graph
                var margin = { top: 20, right: 100, bottom: 60, left: 250 };
                d3.select('#trackview').select("svg").remove();
                d3.select("#toolTip").remove();
            
                // append the svg object to the body of the page
                var svg = d3.select("#trackview")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");
            
                var width = $("#trackview").width() - margin.left - margin.right,
                    height = $("#trackview").height() - margin.top - margin.bottom;

                var tooltip = d3.select("body").append("div").attr("class", "toolTip");
                var format = d3.format(",");
            
                var nested_data_streams = d3.nest()
                    .key(function (d) { return d.SPOTIFY_ID; })
                    .rollup(function (leaves) {
                        // console.log(leaves) 
                        return { "streams": d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); }), "track_name": leaves.map(d => d.TRACK_NAME)[0], "artist": leaves.map(d => d.ARTIST)[0] }
                    })
                    .entries(data);

                var nested_top = nested_data_streams.slice().sort((a, b) => d3.descending(a.value.streams, b.value.streams));
                nested_top = nested_top.slice(0, 15);
                console.log(nested_data_streams);
                console.log(nested_top);

                // Add X axis
                var x = d3.scaleLinear()
                    .domain([0, (d3.max(nested_top.map(d => d.value.streams))) / 1000000])
                    .range([0, width]);
                svg.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");

                // text label for the x axis
                svg.append("text")
                    .attr("transform",
                        "translate(" + (width / 2) + " ," +
                        (height + margin.top + 30) + ")")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .style('font-family', '"Montserrat", sans-serif')
                    .text("Streams (Millions)");
        
                // Y axis
                var y = d3.scaleBand()
                    .range([0, height])
                    //.domain(data.map(function(d) { return d.ARTIST; }))
                    .domain(nested_top.map(function (d) { return d.value.track_name; }))
                    .padding(.1);
                svg.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y))

                // text label for the y axis
                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -5 - margin.left)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em")
                    .style("text-anchor", "middle")
                    .style("font-weight", 700)
                    .style('font-family', '"Montserrat", sans-serif')
                    .text("Track Name");
        
                //Bars
                var isClicked = false;
                svg.selectAll("myRect")
                    .data(nested_top)
                    .enter()
                    .append("rect")
                    // .attr("x", x(0))
                    .attr("y", function (d) { return y(d.value.track_name); })
                    // .attr("width", function (d) { return x(d.value.streams / 1000000); })
                    .attr("height", y.bandwidth())
                    .attr("fill", "#1ab26b")
                    .on("click", function (d) {
                        // isClicked = !isClicked;
                        // var nextColor = this.style.fill == "orange" ? "#145c2c" : "orange";
                        // d3.select(this).style("fill", nextColor)
                        iframe.src = "https://open.spotify.com/embed/track/" + d.key;
                        iframe.width = '770';
                        iframe.height = '90';
                        iframe.allowtransparency = "true";
                    })
                    .on("mousemove", function (d) {
                        tooltip
                            .style("left", d3.event.pageX - 50 + "px")
                            .style("top", d3.event.pageY - 70 + "px")
                            .style("display", "inline-block")
                            .style("font-size", "10px")
                            .html(`Track Name: <b>${d.value.track_name}</b><br>Artist: <b>${d.value.artist}</b><br>${format(d.value.streams)} streams in total`);
                    })
                    .on("mouseover", function () {
                        if (d3.select(this).attr('fill') == "#1ab26b") {
                            d3.select(this)
                                .attr("fill", "orange");
                        }
                    })
                    .on("mouseout", function (d) {
                        tooltip.style("display", "none")
                        d3.select(this)
                            .attr("fill", "#1ab26b");
                    })
                    .attr("x", x(0))
                    .transition()
                    .duration(800)
                    .attr("width", function (d) { return x(d.value.streams / 1000000); })
                    .delay(function (d, i) { console.log(i); return (i * 100) })

                svg.selectAll(".label")//select all DOMs with class label.
                    .data(nested_top)
                    .enter()
                    .append("text")
                    .attr("class", "label")
                    .style('font-family', '"Montserrat", sans-serif')
                    .style("font-size", "12px")
                    .style("font-weight", 700)
                    .attr("y", function (d) {
                        console.log(y(d.value.streams));
                        return y(d.value.track_name) + y.bandwidth() / 1.5; //y location of the label
                    })
                    .text(function (d, i) {
                        return Math.round(d.value.streams / 1000000 * 100) / 100;
                    })
                    .transition()
                    .duration(800)
                    .attr("x", function (d) {
                        return x(d.value.streams / 1000000) + 2;//x location of the label
                    })
                    .delay(function (d, i) { console.log(i); return (i * 100) })
            
                function wrap(text, width) {
                    text.each(function () {
                        var text = d3.select(this),
                            words = text.text().split(/\s+/).reverse(),
                            word,
                            line = [],
                            lineNumber = 0,
                            lineHeight = 1.1, // ems
                            y = text.attr("y"),
                            dy = parseFloat(text.attr("dy")),
                            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                        while (word = words.pop()) {
                            line.push(word);
                            tspan.text(line.join(" "));
                            if (tspan.node().getComputedTextLength() > width) {
                                line.pop();
                                tspan.text(line.join(" "));
                                line = [word];
                                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                            }
                        }
                    });
                }
            }
            this.updateBarcharts = function (raw_data) {
                update_bar_charts(raw_data);
            }
            return this;
        }

        function time_series_plot(data) {
            var margin = { top: 20, right: 125, bottom: 60, left: 40 }
        
            var width = $("#timeseries").width() - margin.left - margin.right,
                height = $("#timeseries").height() - margin.top - margin.bottom;
        
            var svg = d3.select("#timeseries")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom),
                
                parseTime = d3.timeParse("%Y");
            bisectDate = d3.bisector(function (d) { return d.key; }).left;

            var x = d3.scaleTime().range([0, width]);
            var y = d3.scaleLinear().range([height, 0]);

            var line = d3.line()
                .x(function (d) { return x(d.key); })
                .y(function (d) { return y(d.value); });

            var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var format = d3.format(",");
        
            var filtered = data.filter(function (e) {
                return e.REGION == "Global";
            });

            var nested_data_streams = d3.nest()
                .key(function (d) {
                    return d.DATE;
                })
                .rollup(function (leaves) {
                    return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); });
                })
                .entries(filtered);

            var parseDate = d3.timeParse("%Y-%m-%d");
            var formatDate = d3.timeFormat("%d-%b");

            nested_data_streams.forEach(function (d) {
                d.key = parseDate(d.key)
                d.value = d.value / 1000000
                    ;
            });

            x.domain(d3.extent(nested_data_streams, function (d) { return d.key; }));
            // y.domain([d3.min(nested_data_streams, function(d) { return d.value; }), d3.max(nested_data_streams, function(d) { return d.value; })]);
            y.domain([0, d3.max(nested_data_streams, function (d) { return d.value; })]);

            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            g.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y).ticks(15).tickFormat(function (d) { return parseInt(d); }))
                .append("text")
                .attr("class", "axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .attr("fill", "#5D6971")
                .style("font-weight", 700)
                .text("Total Streams (Million)");

            g.append("path")
                .datum(nested_data_streams)
                .attr("class", "line")
                .attr("d", line);
        
            var focus = g.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("line")
                .attr("class", "x-hover-line hover-line")
                .attr("y1", 0)
                .attr("y2", height);

            focus.append("line")
                .attr("class", "y-hover-line hover-line")
                .attr("x1", width)
                .attr("x2", width);

            focus.append("circle")
                .attr("r", 7.5);

            focus.append("text")
                .style("font-size", "12px")
                .attr("font-family", "Montserrat")
                .style("font-weight", 700)
                // .style("border", "2px solid black")
                // .style("border-radius", "5px")
                // .style("background-color", "white")
                .attr("x", 15)
                .attr("dy", ".31em");

            svg.append("rect")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .on("mouseover", function () { focus.style("display", null); })
                .on("mouseout", function () { focus.style("display", "none"); })
                .on("mousemove", mousemove);
        
            function mousemove() {
                var x0 = x.invert(d3.mouse(this)[0]),
                    i = bisectDate(nested_data_streams, x0, 1),
                    d0 = nested_data_streams[i - 1],
                    d1 = nested_data_streams[i],
                    d = x0 - d0.key > d1.key - x0 ? d1 : d0;
                focus.attr("transform", "translate(" + x(d.key) + "," + y(d.value) + ")");
                focus.select("text").text(function () { return formatDate(d.key) + ": " + format(Math.round(d.value * 1000000)); });
                focus.select(".x-hover-line").attr("y2", height - y(d.value));
                focus.select(".y-hover-line").attr("x2", width + width);
            }

            /* Add 'curtain' rectangle to hide entire graph */
            var curtain = svg.append('rect')
                .attr('x', -1 * width - 100)
                .attr('y', -1 * height-20)
                .attr('height', height)
                .attr('width', width + 55)
                .attr('class', 'curtain')
                .attr('transform', 'rotate(180)')
                .style('fill', '#F1F3F3');

            /* Create a shared transition for anything we're animating */
            var t = svg.transition()
                .delay(750)
                .duration(4000)
                .ease(d3.easeLinear)
                .on('end', function () {
                    d3.select('line.guide')
                        .transition()
                        .style('opacity', 0)
                        .remove()
                });
        
            t.select('rect.curtain')
                .attr('width', 0);
            
            update_time_series(data);
            function update_time_series(data) {
                var margin = { top: 20, right: 125, bottom: 60, left: 40 };
                d3.select('#timeseries').select("svg").remove();
                d3.select("#toolTip").remove();
        
                var width = $("#timeseries").width() - margin.left - margin.right,
                    height = $("#timeseries").height() - margin.top - margin.bottom;
            
                var svg = d3.select("#timeseries")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom),
                    
                    parseTime = d3.timeParse("%Y");
                bisectDate = d3.bisector(function (d) { return d.key; }).left;

                var x = d3.scaleTime().range([0, width]);
                var y = d3.scaleLinear().range([height, 0]);

                var line = d3.line()
                    .x(function (d) { return x(d.key); })
                    .y(function (d) { return y(d.value); });

                var g = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var format = d3.format(",");
            
                var filtered = data;

                var nested_data_streams = d3.nest()
                    .key(function (d) {
                        return d.DATE;
                    })
                    .rollup(function (leaves) {
                        return d3.sum(leaves, function (d) { return parseFloat(d.STREAMS); });
                    })
                    .entries(filtered);

                var parseDate = d3.timeParse("%Y-%m-%d");
                var formatDate = d3.timeFormat("%d-%b");

                nested_data_streams.forEach(function (d) {
                    d.key = parseDate(d.key)
                    d.value = d.value / 1000000
                        ;
                });

                x.domain(d3.extent(nested_data_streams, function (d) { return d.key; }));
                // y.domain([d3.min(nested_data_streams, function(d) { return d.value; }), d3.max(nested_data_streams, function(d) { return d.value; })]);
                y.domain([0, d3.max(nested_data_streams, function (d) { return d.value; })]);

                g.append("g")
                    .attr("class", "axis axis--x")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");

                g.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3.axisLeft(y).ticks(15).tickFormat(function (d) { return parseInt(d); }))
                    .append("text")
                    .attr("class", "axis-title")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .attr("fill", "#5D6971")
                    .style("font-weight", 700)
                    .text("Total Streams (Million)");

                g.append("path")
                    .datum(nested_data_streams)
                    .attr("class", "line")
                    .attr("d", line);
            
                var focus = g.append("g")
                    .attr("class", "focus")
                    .style("display", "none");

                focus.append("line")
                    .attr("class", "x-hover-line hover-line")
                    .attr("y1", 0)
                    .attr("y2", height);

                focus.append("line")
                    .attr("class", "y-hover-line hover-line")
                    .attr("x1", width)
                    .attr("x2", width);

                focus.append("circle")
                    .attr("r", 7.5);

                focus.append("text")
                    .style("font-size", "12px")
                    .attr("font-family", "Montserrat")
                    .style("font-weight", 700)
                    .attr("x", 15)
                    .attr("dy", ".31em");

                svg.append("rect")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("class", "overlay")
                    .attr("width", width)
                    .attr("height", height)
                    .on("mouseover", function () { focus.style("display", null); })
                    .on("mouseout", function () { focus.style("display", "none"); })
                    .on("mousemove", mousemove);
            
                function mousemove() {
                    var x0 = x.invert(d3.mouse(this)[0]),
                        i = bisectDate(nested_data_streams, x0, 1),
                        d0 = nested_data_streams[i - 1],
                        d1 = nested_data_streams[i],
                        d = x0 - d0.key > d1.key - x0 ? d1 : d0;
                    focus.attr("transform", "translate(" + x(d.key) + "," + y(d.value) + ")");
                    focus.select("text").text(function () { return formatDate(d.key) + ": " + format(Math.round(d.value * 1000000)); });
                    focus.select(".x-hover-line").attr("y2", height - y(d.value));
                    focus.select(".y-hover-line").attr("x2", width + width);
                }

                /* Add 'curtain' rectangle to hide entire graph */
                var curtain = svg.append('rect')
                    .attr('x', -1 * width - 100)
                    .attr('y', -1 * height - 20)
                    .attr('height', height)
                    .attr('width', width + 55)
                    .attr('class', 'curtain')
                    .attr('transform', 'rotate(180)')
                    .style('fill', '#F1F3F3');

                /* Create a shared transition for anything we're animating */
                var t = svg.transition()
                    .delay(750)
                    .duration(4000)
                    .ease(d3.easeLinear)
                    .on('end', function () {
                        d3.select('line.guide')
                            .transition()
                            .style('opacity', 0)
                            .remove()
                    });
            
                t.select('rect.curtain')
                    .attr('width', 0);
            }
            this.updateTimeseries = function (raw_data) {
                update_time_series(raw_data);
            }
            return this;
        }

    });







})