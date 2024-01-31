d3.csv("processing/average_life_expectancy_2000_2015.csv").then(function(data) {
    // Set up the SVG canvas dimensions
    var margin = { top: 20, right: 20, bottom: 50, left: 50 };
    var width = 800 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;

    // Create the SVG element
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // X and Y scales
    var x = d3.scaleLinear().domain([2000, 2015]).range([0, width]);
    var y = d3.scaleLinear().domain([65, 75]).range([height, 0]);

    // Define the line
    var line = d3.line()
        .x(function (d) { return x(d.Year); })
        .y(function (d) { return y(+d.avgLifeExpectancy); });

    // Add the X-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(16));

    // Add the Y-axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line to the chart using the loaded data
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line);
});
