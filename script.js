var margin = {top: 10, right: 20, bottom: 30, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg1 = d3.select("#line").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function update_sp() {
    svg1.selectAll("*").remove();
    d3.csv('sp.csv', function (data) {
        var parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(function (d) {d["Date"] = parseDate(d["Date"]);});

        // Add X axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) {return d["Date"];}))
            .range([0, width]);
        svg1.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%Y-%m-%d")));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) {return +d["S&P500"];})])
            .range([height, 0]);
        svg1.append("g")
            .call(d3.axisLeft(y));

        // Find the closest X index of the mouse
        var bisect = d3.bisector(function(d) { return d["Date"]; }).left;

        var focus = svg1
            .append('g')
            .append('circle')
            .style("fill", "orange")
            .attr("stroke", "black")
            .attr('r', 8)
            .style("opacity", 0)

        // Create the text that travels along the curve of chart
        var focusText = svg1
            .append('g')
            .append('text')
            .attr("text-anchor", "left")
            .attr("alignment-baseline", "middle")
            .style("opacity", 0)
            .style("fill", "black")
            .style("font-size", "12px")
            .style("font-family", "Arial, sans-serif")

        var textBackground = svg1
            .append('rect')
            .attr("width", 200)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("ry", 5)
            .style("opacity", 0)
            .style("fill", 'none')
            .style("stroke", "black")
            .style("stroke-width", 1)

        // Add the line
        svg1
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "purple")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function(d) { return x(d["Date"]) })
                .y(function(d) { return y(d["S&P500"]) })
            )
            .each(function (d) {d.pathLength = this.getTotalLength();})
            .attr("stroke-dasharray", function (d) {return d.pathLength + " " + d.pathLength;})
            .attr("stroke-dashoffset", function (d) {return d.pathLength;})
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        svg1
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        function mouseover() {
            focus.style("opacity", 1)
            focusText.style("opacity",1)
            textBackground.style("opacity",1)
        }

        function mousemove() {
            var formatDate = d3.timeFormat("%Y-%m-%d");
            var mouseX = d3.mouse(this)[0];
            var mouseY = d3.mouse(this)[1];

            // Adjust text box position if it goes outside the SVG boundaries
            var textWidth = 200; // Width of the text box
            var textHeight = 30; // Height of the text box
            var textX = mouseX + textWidth > width ? mouseX - textWidth : mouseX;
            var textY = mouseY + textHeight > height ? mouseY - textHeight : mouseY;

            var x0 = x.invert(mouseX);
            var i = bisect(data, x0, 1);

            selectedData = data[i]
            focus
                .attr("cx", x(selectedData["Date"]))
                .attr("cy", y(selectedData["S&P500"]))
            focusText
                .attr("x", textX - 20)
                .attr("y", textY + 65)
                .html(formatDate(selectedData["Date"]) + ' ( S&P500: ' + selectedData["S&P500"] + ' )')
            textBackground
                .attr("x", textX - 30)
                .attr("y", textY + 50);

        }
        function mouseout() {
            focus.style("opacity",0)
            focusText.style("opacity",0)
            textBackground.style("opacity",0)
        }
    })
}
update_sp()

function update_top() {
    svg1.selectAll("*").remove();
    d3.csv('annual.csv', function (data) {
        var parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(function (d) {d["Date"] = parseDate(d["Date"]);});

        // group the data
        var sumstat = d3.nest()
            .key(function (d) {return d["Symbol"];})
            .entries(data);

        // Add X axis
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) {return d["Date"];}))
            .range([0, width]);
        svg1.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%Y-%m-%d")));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) {return +d["Close"];})])
            .range([height, 0]);
        svg1.append("g")
            .call(d3.axisLeft(y));

        // color palette
        var res = sumstat.map(function (d) {return d.key})
        var color = d3.scaleOrdinal().domain(res).range(d3.schemeSet2)

        // Draw the line
        svg1.selectAll(".line")
            .data(sumstat)
            .enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke", function (d) {return color(d.key)})
            .attr("stroke-width", 1.5)
            .attr("d", function (d) {
                return d3.line()
                    .x(function (d) {return x(d["Date"]);})
                    .y(function (d) {return y(+d["Close"]);})
                    (d.values)
            })
            .each(function (d) {d.pathLength = this.getTotalLength();})
            .attr("stroke-dasharray", function (d) {return d.pathLength + " " + d.pathLength;})
            .attr("stroke-dashoffset", function (d) {return d.pathLength;})
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        var sort = sumstat.sort(function(a, b) {
            return b.values[b.values.length - 1].Close - a.values[a.values.length - 1].Close;
        });
        // Add the Legend
        svg1.selectAll("mydots")
            .data(sort)
            .enter()
            .append("circle")
            .attr("cx", 50)
            .attr("cy", function(d,i){ return 10 + i*15})
            .attr("r", 2)
            .style("fill", function(d){ return color(d.key)})

        svg1.selectAll("mylabels")
            .data(sort)
            .enter()
            .append("text")
            .attr("x", 60)
            .attr("y", function(d,i){ return 10 + i*15})
            .style("fill", function(d){ return color(d.key)})
            .text(function(d){ return d.key})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .style("font-size", "8pt")

    })
}