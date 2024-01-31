function createStackedArea(){
// Set the dimensions and margins of the graph
d3.csv("processing/Life_Expectancy_Data.csv", function(d) {
    d.Year = d3.timeParse("%Y")(d.Year);
    d['Hepatitis B'] = +d['Hepatitis B'];
    d['Measles '] = +d['Measles '];
    d['Polio'] = +d['Polio'];
    d[' HIV/AIDS'] = +d[' HIV/AIDS'];
    d['Life expectancy '] = +d['Life expectancy '];
    return d;
}).then(function(data) {
    // Aggregate data by year and calculate average life expectancy
    var aggregatedData = d3.rollups(data, 
        v => ({
            'Hepatitis B': d3.sum(v, d => d['Hepatitis B']),
            'Measles': d3.sum(v, d => d['Measles ']),
            'Polio': d3.sum(v, d => d['Polio']),
            'HIV/AIDS': d3.sum(v, d => d[' HIV/AIDS']),
            'Average Life Expectancy': d3.mean(v, d => d['Life expectancy '])
        }), 
        d => d.Year
    ).map(d => ({ Year: d[0], ...d[1] }));

    // Sort by year
    aggregatedData.sort((a, b) => d3.ascending(a.Year, b.Year));

    // Set up dimensions
    var margin = { top: 20, right: 30, bottom: 50, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Create SVG container
    var svg = d3.select("#stacked_area").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define color scale for diseases
    var color = d3.scaleOrdinal()
        .domain(["Hepatitis B", "Measles", "Polio", "HIV/AIDS"])
        .range(d3.schemeCategory10);

    // Create a stack generator for the data
    var stack = d3.stack()
        .keys(["Hepatitis B", "Measles", "Polio", "HIV/AIDS"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    var layers = stack(aggregatedData);

    // Set up scales
    var x = d3.scaleTime()
        .domain(d3.extent(aggregatedData, function(d) { return d.Year; }))
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(layers[layers.length - 1], function(d) { return d[1]; })])
        .nice()
        .range([height, 0]);

    // Create area generator for stacked areas
    var area = d3.area()
        .x(function(d) { return x(d.data.Year); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
        .curve(d3.curveBasis);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(10));

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5));

    // Add legend
    var legend = svg.selectAll(".legend")
        .data(["Hepatitis B", "Measles", "Polio", "HIV/AIDS"])
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });


        var tooltip = d3.select("body").append("div")
        .attr("class", "custom-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none"); // Tooltip should not capture mouse events
    
    // Add areas to the chart
    svg.selectAll(".area")
        .data(layers)
        .enter().append("path")
        .attr("class", "area")
        .attr("d", area)
        .style("fill", function(d) { return color(d.key); })
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1);
            tooltip.html("Disease: " + d.key + "<br>Total Cases: " + (d[d.length - 1][1] - d[d.length - 1][0]))
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", function(event, d) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseleave", function(event, d) {
            tooltip.style("opacity", 0);
        });
        // Create a new scale for the line chart (Average Life Expectancy)
var yLine = d3.scaleLinear()
.domain(d3.extent(aggregatedData, function(d) { return d['Average Life Expectancy']; })) // Set domain based on life expectancy
.range([height, 0])
.nice();

// Add a new y-axis for the line chart to the right side of the plot
svg.append("g")
.attr("class", "y-axis-line")
.attr("transform", "translate(" + width + ",0)") // Move this axis to the right side
.call(d3.axisRight(yLine)); // Use d3.axisRight for the right-aligned axis


const index2012 = aggregatedData.findIndex(d => d.Year.getFullYear() === 2012);
const index2013 = aggregatedData.findIndex(d => d.Year.getFullYear() === 2013);
const index2014 = aggregatedData.findIndex(d => d.Year.getFullYear() === 2014);

// If all indices are found, set the value for 2013 to the average of 2012 and 2014
if (index2012 !== -1 && index2013 !== -1 && index2014 !== -1) {
    const avgLifeExpectancy = (aggregatedData[index2012]['Average Life Expectancy'] + aggregatedData[index2014]['Average Life Expectancy']) / 2;
    aggregatedData[index2013]['Average Life Expectancy'] = avgLifeExpectancy;
}

// Adjust the line generator to use the new scale
var line = d3.line()
    .x(function(d) { return x(d.Year); })
    .y(function(d) { return yLine(d['Average Life Expectancy']); }); // Use yLine for y-values

// Remove any existing lines to avoid duplication
svg.selectAll(".line").remove();

// Add the line plot for Average Life Expectancy
svg.append("path")
    .datum(aggregatedData)
    .attr("class", "line")
    .attr("d", line)
    .style("fill", "none") // Remove fill
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity",0.2);

// Add circles for each data point
svg.selectAll(".dot")
    .data(aggregatedData)
    .enter().append("circle") // Append a circle for each datum in the dataset
    .attr("class", "dot")
    .attr("cx", function(d) { return x(d.Year); })
    .attr("cy", function(d) { return yLine(d['Average Life Expectancy']); })
    .attr("r", 3) // Radius of the dots
    .style("fill", "black")
    .style("opacity",0.1);

// const lifeExpectancyByContinent = d3.rollups(data, v => d3.mean(v, d => d['Life expectancy ']), d => d.Continent);

//             // Create a secondary y-axis for life expectancy
//             const yRight = d3.scaleLinear()
//                 .domain([0, d3.max(lifeExpectancyByContinent, d => d[1])])
//                 .range([heightBoxPlot, 0]);

//             svgBoxPlot.append("g")
//                 .attr("transform", `translate(${widthBoxPlot}, 0)`)
//                 .call(d3.axisRight(yRight));

//             // Create a line for average life expectancy
//             const line = d3.line()
//                 .x(d => x(d[0]) + x.bandwidth() / 2) // Center the line in the band
//                 .y(d => yRight(d[1]));

//             svgBoxPlot.append("path")
//                 .datum(lifeExpectancyByContinent)
//                 .attr("fill", "none")
//                 .attr("stroke", "steelblue")
//                 .attr("stroke-width", 1.5)
//                 .attr("d", line);


}).catch(function(error) {
    console.error('Error loading the CSV file:', error);
});
}
createStackedArea();
