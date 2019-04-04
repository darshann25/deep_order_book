
// btc_usd_03_26_2019_1
// mini_btc_usd


d3.csv("BTC_Histogram.csv").then(function(data) {


    // Determine best bid/ask to center around
    var best_bid = 0;
    var best_ask = 100000; //placehold value, should always be less
    var best_bid_index = 0;
    var best_ask_index = 0;
    var bin_delta = 15;
    var filter_max = 4500;
    var filter_min = 3500;
    
    // Loop through and cumulate all bids - need to order before this loop if not already done in csv
    data.reduce(function(previousValue, currentValue, currentIndex, array) {
        if (data[currentIndex].is_bid == "bid"){
            // convert prices to numbers from strings
            data[currentIndex].price = parseFloat(data[currentIndex].price);
            // Check for best bid price
            if (data[currentIndex].price > best_bid){
                best_bid = data[currentIndex].price;
                best_bid_index = currentIndex;
            };
            // perform cumulative calc
            data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
            return data[currentIndex].cum_vol;
        } else {
            return previousValue;
        };
    }, 0);

    // Loop through and cumulate all asks - need to order before this loop if not already done in csv
    data.reduce(function(previousValue, currentValue, currentIndex, array) {
        if (data[currentIndex].is_bid == "ask"){
            // convert prices to numbers from strings
            data[currentIndex].price = parseFloat(data[currentIndex].price);
            // Check for best bid price
            if (data[currentIndex].price < best_ask){
                best_ask = data[currentIndex].price;
                best_ask_index = currentIndex;
            };
            // perform cumulative calc
            data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
            return data[currentIndex].cum_vol;
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

    var bid_threshold = range_backwards(best_bid, filter_min, bin_delta);
    bid_threshold.reverse();
    var ask_threshold = range_forward(best_ask, filter_max, bin_delta);
    console.log("Bid Thresholds: ", bid_threshold);
    console.log("Ask Thresholds: ", ask_threshold);


    // Filter out the extreme outliers that only make the graphs look weird - Get 3 standard deviations of the mean
    /*var l = data.length;
    var sum=0;     // stores sum of elements
    var sumsq = 0; // stores sum of squares
    for(var i=0;i<data.length;++i) {
        sum+=data[i].price;
        sumsq+=data[i].price*data[i].price;
    }
    var mean = best_bid; 
    console.log("mean", mean, l, sumsq);
    var varience = sumsq / l - mean*mean;
    var sd = Math.sqrt(varience);
    console.log("sd",sd);
    var data3 = new Array(); // uses for data which is 3 standard deviations from the mean
    for(var i=0;i<data.length;++i) {
        if(data[i].price> mean - 3 *sd && data[i].price < mean + 3 *sd)
            data3.push(data[i]);
    } */

    

    // Issues with filtering by mean and std above, did a manual one for now
    for(var i = data.length-1; i >= 0; i--) {
        if(data[i].price < filter_min || data[i].price > filter_max ){
            data.splice(i, 1);
        }
    }

    console.log("median_data",data);

    ////////////////////////////
    //////// Attempt to bin!!!!
    ////////////////////////////


    var bins_bid = d3.histogram()
        .value(function (d) { if(d.is_bid == "bid") {return d.price;} })
        .thresholds(bid_threshold)
        (data);

    var bins_ask = d3.histogram()
        .value(function (d) { if(d.is_bid == "ask") {return d.price;} })
        .thresholds(ask_threshold)
        (data);

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

    data = newData;

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
        .style('left', `${(d3.select("svg").node().parentNode.offsetLeft + margin.left + (width / 2)) - 100}px`)
        .style('width', '200px')
        .style('opacity', 0)
        .html('');

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
        //y.domain([0, d3.max(data, d => d.cum_vol)]);

        var t = g.transition().duration(0);

        t.select(".x.axis").call(xAxis);
        //t.select(".y.axis").call(yAxisLeft);
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
                if (data[i + 1] && data[i + 1].is_bid === d.is_bid) {
                    return x(data[i + 1].price) - x(d.price);
                // is there a next element and they don't have the same type:
                // market price valley
                } else if (data[i + 1]) {
                    return x(d.price+bin_delta) - x(d.price);
                    //return (x.range()[1] - x.range()[0]) / data.length;
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
            min: d3.min(data, d => d.price),
            max: d3.max(data, d => d.price),
            values: [ d3.min(data, d => d.price), d3.max(data, d => d.price) ],
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
        $("#slider-range-max").slider({
            range: "max",
            min: 1,
            max: 100,
            value: bin_delta,
            slide: function(event, ui) {
                $("#bins").val(ui.value);
                

                // Determine best bid/ask to center around
                var best_bid_index = 0;
                var best_ask_index = 0;
                var bin_delta = 15;
                
                // Loop through and cumulate all bids - need to order before this loop if not already done in csv
                data.reduce(function(previousValue, currentValue, currentIndex, array) {
                    if (data[currentIndex].is_bid == "bid"){
                        // convert prices to numbers from strings
                        data[currentIndex].price = parseFloat(data[currentIndex].price);
                        // Check for best bid price
                        if (data[currentIndex].price > best_bid){
                            best_bid = data[currentIndex].price;
                            best_bid_index = currentIndex;
                        };
                        // perform cumulative calc
                        data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
                        return data[currentIndex].cum_vol;
                    } else {
                        return previousValue;
                    };
                }, 0);

                // Loop through and cumulate all asks - need to order before this loop if not already done in csv
                data.reduce(function(previousValue, currentValue, currentIndex, array) {
                    if (data[currentIndex].is_bid == "ask"){
                        // convert prices to numbers from strings
                        data[currentIndex].price = parseFloat(data[currentIndex].price);
                        // Check for best bid price
                        if (data[currentIndex].price < best_ask){
                            best_ask = data[currentIndex].price;
                            best_ask_index = currentIndex;
                        };
                        // perform cumulative calc
                        data[currentIndex].cum_vol = previousValue + parseFloat(currentValue.size);
                        return data[currentIndex].cum_vol;
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

                var bid_threshold = range_backwards(best_bid, filter_min, ui.value);
                bid_threshold.reverse();
                var ask_threshold = range_forward(best_ask, filter_max, ui.value);
                //console.log("Bid Thresholds: ", bid_threshold);
                //console.log("Ask Thresholds: ", ask_threshold);

                var bins_bid = d3.histogram()
                    .value(function (d) { if(d.is_bid == "bid") {return d.price;} })
                    .thresholds(bid_threshold)
                    (data);

                var bins_ask = d3.histogram()
                    .value(function (d) { if(d.is_bid == "ask") {return d.price;} })
                    .thresholds(ask_threshold)
                    (data);

                var newData = [];
                var bin_cum_vol = 0;
                var bin_price = 0;
                var index = 0;
                console.log("Hopefully empty:", newData);
            
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
        $("#bins").val($("#slider-range-max").slider("value"));
    });




});





