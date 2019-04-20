
// btc_usd_03_26_2019_1
// mini_btc_usd
// raw_events_2_exchanges_Apr_3rd_2019

d3.csv("../data/raw_events_2_exchanges_Apr_3rd_2019.csv").then(function(data) {
    var indexTS = 0;
    var bin_delta = 1; //$1.00, in cents

    function organizeData(passedData, indexTS, bin_delta) {
        var currentTS = passedData[indexTS].created_at;
        var current_ts_data = JSON.parse(passedData[indexTS].data);
        var currentExchange = passedData[indexTS].exchange;
        var raw_data = [];

        current_ts_data["bids"].forEach(function (bid) {
            temp_bid = {
                "is_bid": "bid",
                "price": parseFloat(bid[0]),
                "size": parseFloat(bid[1]),
                "ts": currentTS
            };
            raw_data.push(temp_bid);
        });

        current_ts_data["asks"].forEach(function (ask) {
            temp_ask = {
                "is_bid": "ask",
                "price": parseFloat(ask[0]),
                "size": parseFloat(ask[1]),
                "ts": currentTS
            };
            raw_data.push(temp_ask);
        });
        console.log("Raw data: ",raw_data);

        // Determine best bid/ask to center around
        var best_bid = 0;
        var best_ask = 100000; //placehold value, should always be less
        var best_bid_index = 0;
        var best_ask_index = 0;
        //var filter_max = 4500;
        //var filter_min = 3500;
        var book_min = 100000;
        var book_max = 0;
        
        // Loop through and cumulate all bids - need to order before this loop if not already done in csv
        raw_data.reduce(function(previousValue, currentValue, currentIndex, array) {
            if (raw_data[currentIndex].is_bid == "bid"){
                // convert prices to numbers from strings
                raw_data[currentIndex].price = parseFloat(raw_data[currentIndex].price);
                // Check for best bid price
                if (raw_data[currentIndex].price > best_bid){
                    best_bid = raw_data[currentIndex].price;
                    best_bid_index = currentIndex;
                };
                // Check for min value
                if (raw_data[currentIndex].price < book_min){
                    book_min = raw_data[currentIndex].price;
                };
                // perform cumulative calc
                raw_data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
                return raw_data[currentIndex].cum_vol;
            } else {
                return previousValue;
            };
        }, 0);

        // Loop through and cumulate all asks - need to order before this loop if not already done in csv
        raw_data.reduce(function(previousValue, currentValue, currentIndex, array) {
            if (raw_data[currentIndex].is_bid == "ask"){
                // convert prices to numbers from strings
                raw_data[currentIndex].price = parseFloat(raw_data[currentIndex].price);
                // Check for best bid price
                if (raw_data[currentIndex].price < best_ask){
                    best_ask = raw_data[currentIndex].price;
                    best_ask_index = currentIndex;
                };
                // Check for max value
                if (raw_data[currentIndex].price > book_max){
                    book_max = raw_data[currentIndex].price;
                };
                // perform cumulative calc
                raw_data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
                return raw_data[currentIndex].cum_vol;
            } else {
                return previousValue;
            };
        }, 0);

        console.log("Best Bid: ",best_bid, " @ index ", best_bid_index, " Best Ask: ", best_ask, " @ index ", best_ask_index );

        // Setup threshold arrays
        function range_forward(start, end, step = 1) {
            const len = Math.floor((end - start) / step) + 1
            return Array(len).fill().map((_, idx) => start + (idx * step))
        }
        function range_backwards(start, end, step = 1) {
            const len = Math.floor((start - end) / step) + 1
            return Array(len).fill().map((_, idx) => start + (idx * -step))
        }

        var bid_threshold = range_backwards(best_bid, book_min, bin_delta);
        bid_threshold.reverse();
        var ask_threshold = range_forward(best_ask, book_max, bin_delta);
        console.log("Bid Thresholds: ", bid_threshold);
        console.log("Ask Thresholds: ", ask_threshold);


        ////////////////////////////
        //////// Attempt to bin!!!!
        ////////////////////////////

        var bins_bid = d3.histogram()
            .value(function (d) { if(d.is_bid == "bid") {return d.price;} })
            .thresholds(bid_threshold)
            (raw_data);

        var bins_ask = d3.histogram()
            .value(function (d) { if(d.is_bid == "ask") {return d.price;} })
            .thresholds(ask_threshold)
            (raw_data);

        console.log("Bins Bid: ", bins_bid);
        console.log("Bins Ask: ",bins_ask);

        var newData = [];
        var bin_cum_vol = 0;
        var bin_price = 0;
        var index = 0;

        bins_bid.forEach(function (bin) {
            // Loop through each bin and summarize the information in it
            bin.forEach(function (binItem) {
                bin_cum_vol += parseFloat(binItem.size);
            })
            //console.log("Bin index value hopefully:", index, bid_threshold[index]);
            //console.log(bin_cum_vol);
            if (bid_threshold[index] != null) {
                bin_price = bid_threshold[index];
                // Push bin summary to one object in array
                newData.push({
                    size: bin_cum_vol,
                    price: bin_price,
                    is_bid: "bid"
                })
            } else {
                // We are right on the edge of the last bin, put data into prior bin
                newData[index-1].size = newData[index-1].size + bin_cum_vol;
            }

            // Reset values for next loop
            bin_cum_vol = 0;
            bin_price = 0;
            index += 1;
        });

        console.log("New data after bid binning but not reversed", newData);
        // Reverse the bin bid order for the cumulation
        newData.reverse();
        index = 0;

        bins_ask.forEach(function (bin) {
            // Loop through each bin and summarize the information in it
            bin.forEach(function (binItem) {
                bin_cum_vol += parseFloat(binItem.size);
            })
            //console.log("Bin index value hopefully:", index, ask_threshold[index]);
            if (ask_threshold[index] != null) {
                bin_price = ask_threshold[index];
            } else {
                bin_price = ask_threshold[index-1] + bin_delta;
            }

            // Push bin summary to one object in array
            newData.push({
                size: bin_cum_vol,
                price: bin_price,
                is_bid: "ask"
            })
            // Reset values for next loop
            bin_cum_vol = 0;
            bin_price = 0;
            index += 1;
        });

        // Loop through and cumulate all bids - need to order before this loop if not already done in csv
        newData.reduce(function(previousValue, currentValue, currentIndex, array) {
            if (newData[currentIndex].is_bid == "bid"){
                // convert prices to numbers from strings
                newData[currentIndex].price = newData[currentIndex].price;
                // Check for best bid price
                if (newData[currentIndex].price > best_bid){
                    best_bid = newData[currentIndex].price;
                    best_bid_index = currentIndex;
                };
                // perform cumulative calc
                newData[currentIndex].cum_vol = previousValue + currentValue.size;
                return newData[currentIndex].cum_vol;
            } else {
                return previousValue;
            };
        }, 0);

            // Loop through and cumulate all asks - need to order before this loop if not already done in csv
            newData.reduce(function(previousValue, currentValue, currentIndex, array) {
                if (newData[currentIndex].is_bid == "ask"){
                    // convert prices to numbers from strings
                    newData[currentIndex].price = newData[currentIndex].price;
                    // Check for best bid price
                    if (newData[currentIndex].price < best_ask){
                        best_ask = newData[currentIndex].price;
                        best_ask_index = currentIndex;
                    };
                    // perform cumulative calc
                    newData[currentIndex].cum_vol = previousValue + currentValue.size;
                    return newData[currentIndex].cum_vol;
                } else {
                    return previousValue;
                };
            }, 0);

        console.log("New Data: ", newData);

        return [newData, bin_delta, best_bid, best_ask, currentTS];

    };


    var dump = organizeData(data, indexTS, bin_delta);
    var newData = dump[0];
    var bin_delta = dump[1];
    var best_bid = dump[2];
    var best_ask = dump[3];
    var currentTS = dump[4];


    /////////////////////////////////////
    ////// Setup our D3 visual
    /////////////////////////////////////

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 30, left: 40 };
    var width = 800 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var g = d3.select("#orderbook")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    var newData = newData.sort((a, b) => (a.price > b.price ? 1 : -1));
  
    console.log("sorted data: ", newData);

    // set the ranges and domains
    var x = d3.scaleLinear()
        .range([0, width])
        .domain([
            d3.min(newData, d => d.price),
            d3.max(newData, d => d.price) + 1,
        ]);

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(newData, d => d.cum_vol)]);
  
    // Setup the x and y Axis
    var xAxis = d3.axisBottom(x);
    g.append('g')
        .attr('class', 'x axis axis--x')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
  
    var yAxisLeft = d3.axisLeft(y);
    g.append('g')
        .attr('class', 'y axis axis--y')
        .call(yAxisLeft);

    // Define the div for the tooltip
    var tooltip = d3.select('body').append('div')
        .attr('class', 'orderbook-visualisation-tooltip')
        .style('position', 'absolute')
        .style('top', `${d3.select("svg").node().parentNode.offsetTop + 20}px`)
        .style('left', `${(d3.select("svg").node().parentNode.offsetLeft + margin.left + (width / 2)) + 300}px`)
        .style('width', '200px')
        .style('opacity', 0)
        .html('');

    var bestbid_bestask = d3.select('body').append('div')
        .attr('class', 'orderbook-visualisation-bbba')
        .style('position', 'absolute')
        .style('top', `${d3.select("svg").node().parentNode.offsetTop + 20}px`)
        .style('left', `${(d3.select("svg").node().parentNode.offsetLeft + margin.left + (width / 2)) + 100}px`)
        .style('width', '200px')
        .html('<table><tr><td><b>Best Bid: </b></td><td>' + best_bid + '</td></tr>' +
            '<tr><td><b>Best Ask: </b></td><td>' + best_ask + '</td></tr>' +
            '<tr><td><b>Current Time: </b></td><td>' + currentTS + '</td></tr> </table>'
            );

    // Add the cumulative bars to chart
    var bars = g.selectAll('.bar')
        .data(newData)
        .enter().append('rect')
        .attr('class', d => `bar ${d.is_bid}`)
        .attr('x', 
        d => {
            // if it's a bid, set the x price to be one bin_delta back
            if (d.is_bid === "bid"){
                return x(d.price - bin_delta);
            } else {
                return x(d.price);
            }
        })
        .attr('y', d => y(d.cum_vol))
        .attr('width', (d, i) => {
            // is there a next element and do they have the same type:
            // fill until the next order
            if (newData[i + 1] && newData[i + 1].is_bid === d.is_bid) {
                return x(newData[i + 1].price) - x(d.price);
            // is there a next element and they don't have the same type:
            // market price valley
            } else if (newData[i + 1]) {
                return x(d.price+bin_delta) - x(d.price);
                //return (x.range()[1] - x.range()[0]) / newData.length;
            }
            // this is the last element: fill until the end of the graph
            return x.range()[1] - x(d.price);
        })
        .attr('height', d => height - y(d.cum_vol))
        .on('mouseover', (d) => {
            tooltip.transition()
            .duration(500)
            .style('opacity', 1);
    
            let html = '<table>';
    
            Object.keys(d).forEach((key) => {
            html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`;
            });
    
            html += '</table>';
    
            tooltip.html(html);
        })
        .on('mouseout', () =>
            tooltip.transition().duration(500).style('opacity', 0),
        );

    ////////////////////////////////////
    // Ability to change x and y axis //
    ////////////////////////////////////

    function zoom(begin, end) {
        x.domain([begin, end - 1]);

        //Find max cum_vol in the new range
        var max_cum_vol = 0;
        newData.forEach(function (point){
            if (point.price > begin && point.price < end){
                if (point.cum_vol > max_cum_vol) {
                    max_cum_vol = point.cum_vol;
                };
            };
        });
        y.domain([0, max_cum_vol]);

        var t = g.transition().duration(0);

        t.select(".x.axis").call(xAxis);
        t.select(".y.axis").call(yAxisLeft);
        bars.attr('class', d => `bar ${d.is_bid}`)
            .attr('x', d => {
                // if it's a bid, set the x price to be one bin_delta back
                if (d.is_bid === "bid"){
                    return x(d.price - bin_delta);
                } else {
                    return x(d.price);
                }
            })
            .attr('y', d => y(d.cum_vol))
            .attr('width', (d, i) => {
                // is there a next element and do they have the same type:
                // fill until the next order
                if (newData[i + 1] && newData[i + 1].is_bid === d.is_bid) {
                    return x(newData[i + 1].price) - x(d.price);
                // is there a next element and they don't have the same type:
                // market price valley
                } else if (newData[i + 1]) {
                    return x(d.price+bin_delta) - x(d.price);
                    //return (x.range()[1] - x.range()[0]) / newData.length;
                }
                // this is the last element: fill until the end of the graph
                return x.range()[1] - x(d.price);
            })
            .attr('height', d => height - y(d.cum_vol))
            .on('mouseover', (d) => {
                tooltip.transition()
                .duration(500)
                .style('opacity', 1);
        
                let html = '<table>';
        
                Object.keys(d).forEach((key) => {
                    html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`;
                });
        
                html += '</table>';
        
                tooltip.html(html);
            })
            .on('mouseout', () =>
                tooltip.transition().duration(500).style('opacity', 0),
            );

    }

    $(function() {
        $( "#slider-range" ).slider({
            range: true,
            min: d3.min(newData, d => d.price),
            max: d3.max(newData, d => d.price),
            values: [ d3.min(newData, d => d.price), d3.max(newData, d => d.price) ],
            slide: function( event, ui ) {
                var begin = d3.min([ui.values[0],ui.values[1]]);
                var end = d3.max([ui.values[1], 0]);
                console.log("begin:", begin, "end:", end);

                zoom(begin, end);
            }
        });
    });


    ////////////////////////////////////
    // Ability to change bin size     //
    ////////////////////////////////////

    $(function() {
        $("#bins").val(bin_delta);
        $("#slider-range-max").slider({
            range: "max",
            min: 1,
            max: 250,
            value: bin_delta*100,
            slide: function(event, ui) {
                $("#bins").val(ui.value);
                

                // Determine best bid/ask to center around
                var best_bid_index = 0;
                var best_ask_index = 0;
                var bin_delta = ui.value/100;
                $("#bins").val($("#slider-range-max").slider("value")/100);
                var indexTS = $("#ts-slider").slider("value");
                
                var book_min = 100000;
                var book_max = 0;
                
                var dump = organizeData(data, indexTS, bin_delta);
                var newData = dump[0];
                var bin_delta = dump[1];
                var best_bid = dump[2];
                var best_ask = dump[3];
                var currentTS = dump[4];

                var newData = newData.sort((a, b) => (a.price > b.price ? 1 : -1));
                console.log("New Data: ", newData);

                var t = g.transition().duration(0);
                t.select(".x.axis").call(xAxis);

                g.selectAll(".bar")
                    .remove()

                bars = g.selectAll('.bar')
                    .data(newData)
                    .enter().append('rect')
                    .attr('class', d => `bar ${d.is_bid}`)
                    .attr('x', d => {
                        // if it's a bid, set the x price to be one bin_delta back
                        if (d.is_bid === "bid"){
                            return x(d.price - bin_delta);
                        } else {
                            return x(d.price);
                        }
                    })
                    .attr('y', d => y(d.cum_vol))
                    .attr('width', (d, i) => {
                        // is there a next element and do they have the same type:
                        // fill until the next order
                        if (newData[i + 1] && newData[i + 1].is_bid === d.is_bid) {
                            return x(newData[i + 1].price) - x(d.price);
                        // is there a next element and they don't have the same type:
                        // market price valley
                        } else if (newData[i + 1]) {
                            return x(d.price+bin_delta) - x(d.price);
                            //return (x.range()[1] - x.range()[0]) / newData.length;
                        }
                        // this is the last element: fill until the end of the graph
                        return x.range()[1] - x(d.price);
                    })
                    .attr('height', d => height - y(d.cum_vol))
                    .on('mouseover', (d) => {
                        tooltip.transition()
                        .duration(500)
                        .style('opacity', 1);
                
                        let html = '<table>';
                
                        Object.keys(d).forEach((key) => {
                        html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`;
                        });
                
                        html += '</table>';
                
                        tooltip.html(html);
                    })
                    .on('mouseout', () =>
                        tooltip.transition().duration(500).style('opacity', 0),
                    );

            }
        });
    });


    ////////////////////////////////////
    // Ability to change timestamp of data to display    //
    ////////////////////////////////////

    $(function() {
        $("#ts-slider").slider({
            range: "max",
            min: 1,
            //max: 100,
            max: data.length-1,
            value: 1,
            slide: function(event, ui) {
                $("#ts").val(ui.value);
                console.log("Timeline slider was moved");
                // Change to the selected timeline date
                var bin_delta = $("#slider-range-max").slider("value")/100;
                var indexTS = ui.value;

                var dump = organizeData(data, indexTS, bin_delta);
                var newData = dump[0];
                var bin_delta = dump[1];
                var best_bid = dump[2];
                var best_ask = dump[3];
                var currentTS = dump[4];
                console.log(currentTS);
                $("#ts").val(currentTS);

                var newData = newData.sort((a, b) => (a.price > b.price ? 1 : -1));
                console.log("sorted data: ", newData);


                //Find max and min price in the new range
                var max_price = 0;
                var min_price = 100000;
                newData.forEach(function (point){
                    if (point.price > max_price) {
                        max_price = point.price;
                    };
                    if (point.price < min_price) {
                        min_price = point.price;
                    };
                });
                console.log(max_price, min_price);
                var begin = min_price;
                var end = max_price;
                console.log("begin:", begin, "end:", end);

                zoom(begin, end);



                // Updated the
                var t = g.transition().duration(0);

                t.select(".x.axis").call(xAxis);

                g.selectAll(".bar")
                    .remove()

                bars = g.selectAll('.bar')
                    .data(newData)
                    .enter().append('rect')
                    .attr('class', d => `bar ${d.is_bid}`)
                    .attr('x', d => {
                        // if it's a bid, set the x price to be one bin_delta back
                        if (d.is_bid === "bid"){
                            return x(d.price - bin_delta);
                        } else {
                            return x(d.price);
                        }
                    })
                    .attr('y', d => y(d.cum_vol))
                    .attr('width', (d, i) => {
                        // is there a next element and do they have the same type:
                        // fill until the next order
                        if (newData[i + 1] && newData[i + 1].is_bid === d.is_bid) {
                            return x(newData[i + 1].price) - x(d.price);
                        // is there a next element and they don't have the same type:
                        // market price valley
                        } else if (newData[i + 1]) {
                            return x(d.price+bin_delta) - x(d.price);
                            //return (x.range()[1] - x.range()[0]) / newData.length;
                        }
                        // this is the last element: fill until the end of the graph
                        return x.range()[1] - x(d.price);
                    })
                    .attr('height', d => height - y(d.cum_vol))
                    .on('mouseover', (d) => {
                        tooltip.transition()
                        .duration(500)
                        .style('opacity', 1);
                
                        let html = '<table>';
                
                        Object.keys(d).forEach((key) => {
                        html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`;
                        });
                
                        html += '</table>';
                
                        tooltip.html(html);
                    })
                    .on('mouseout', () =>
                        tooltip.transition().duration(500).style('opacity', 0),
                    );

                d3.select(".orderbook-visualisation-bbba")
                    .remove()

                var bestbid_bestask = d3.select('body').append('div')
                    .attr('class', 'orderbook-visualisation-bbba')
                    .style('position', 'absolute')
                    .style('top', `${d3.select("svg").node().parentNode.offsetTop + 20}px`)
                    .style('left', `${(d3.select("svg").node().parentNode.offsetLeft + margin.left + (width / 2)) + 100}px`)
                    .style('width', '200px')
                    .html('<table><tr><td><b>Best Bid: </b></td><td>' + best_bid + '</td></tr>' +
                        '<tr><td><b>Best Ask: </b></td><td>' + best_ask + '</td></tr>' +
                        '<tr><td><b>Current Time: </b></td><td>' + currentTS + '</td></tr> </table>'
                        );

            }
        });
    });

});





