function createScatterPlot(){
    const container = d3.select("#my_dataviz_scatter");
    let svgScatter;

    function drawChart() {
        container.selectAll("*").remove();

    // Get the dimensions of the container
    const containerWidth = container.node().getBoundingClientRect().width;
    const aspectRatio = 16 / 9; // Example aspect ratio
    const marginScatter = { top: 10, right: 30, bottom: 30, left: 60 };
    const widthScatter = containerWidth - marginScatter.left - marginScatter.right;
    const heightScatter = widthScatter / aspectRatio - marginScatter.top - marginScatter.bottom;

    // Append the svg object for the scatter plot to the container
    svgScatter = container.append("svg")
        .attr("width", widthScatter + marginScatter.left + marginScatter.right)
        .attr("height", heightScatter + marginScatter.top + marginScatter.bottom)
        .append("g")
        .attr("transform", `translate(${marginScatter.left},${marginScatter.top})`);

d3.csv('processing/Life_Expectancy_Data.csv').then(function(rawData) {
    // Process rawData to get the average GDP for each country
    const countryData = {};
    rawData.forEach(row => {
        const country = row.Country;
        const lifeExpectancy = +row['Life expectancy '];
        const gdp = +row.GDP;

        if (isNaN(gdp)) {
            // console.log("Invalid GDP value for country:", country, "GDP:", row.GDP);
            return;
        }

        if (!countryData[country]) {
            countryData[country] = { Country: country, TotalGDP: 0, Count: 0, LifeExpectancy: lifeExpectancy };
        }
        countryData[country].TotalGDP += gdp;
        countryData[country].Count++;
    });

    // Calculate the average GDP for each country
    const filteredData = Object.values(countryData)
        .filter(d => d.TotalGDP > 0 && d.Count > 0)
        .map(d => {
            return {
                Country: d.Country,
                AvgGDP: d.TotalGDP / d.Count,
                LifeExpectancy: d.LifeExpectancy
            };
        });
        
    // Add X axis
    const x = d3.scaleLog()
        .domain([50, d3.max(filteredData, function(d) { return +d.AvgGDP; })])
        .range([0, widthScatter]);
    svgScatter.append("g")
        .attr("transform", `translate(0, ${heightScatter})`)
        .call(d3.axisBottom(x));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([40, d3.max(filteredData, function(d) { return +d.LifeExpectancy; })])
        .range([heightScatter, 0]);
    svgScatter.append("g")
        .call(d3.axisLeft(y));
// Filter out entries with invalid or missing life expectancy values
const validData = filteredData.filter(d => d.LifeExpectancy > 0);

// Sort valid data by Life Expectancy
validData.sort((a, b) => b.LifeExpectancy - a.LifeExpectancy);

// Get top 5 and bottom 5 countries by Life Expectancy, but keep the variable names as is
const top5GDP = validData.slice(0, 10);  // Top 5 countries by Life Expectancy
const bottom5GDP = validData.slice(-10);
    // Add dots
const tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style("position", "absolute")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px");

const dots = svgScatter.append('g')
    .selectAll("dot")
    .data(filteredData)
    .enter()
    .append("circle")
        .attr("cx", function(d) { return x(d.AvgGDP); })
        .attr("cy", function(d) { return y(d.LifeExpectancy); })
        .attr("r", 5)
        .style("fill", function(d) {
            if (top5GDP.includes(d)) {
                return "gold"; // Color for top 5 GDP
            } else if (bottom5GDP.includes(d)) {
                return "#8B4513"; // Color for bottom 5 GDP (dark brown)
            }
            return "#69b3a2"; // Default color
        })
    .on("mouseover", function(event, d) {
        tooltip.style("opacity", .9);
        tooltip.html("Country: " + d.Country + "<br>Life Expectancy: " + d.LifeExpectancy + "<br>GDP: " + d.AvgGDP)
            .style("left", (event.pageX + 15) + "px") // Adjust positioning to prevent overlap with cursor
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function(event, d) {
        tooltip.style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        tooltip.style("opacity", 0);
    });


    // Calculate regression
    const xValues = filteredData.map(d => Math.log(d.AvgGDP));
    const yValues = filteredData.map(d => d.LifeExpectancy);
    const regressionCoefficients = ss.linearRegression(xValues.map((x, i) => [x, yValues[i]]));

    // Add regression line
    svgScatter.append("line")
        .attr("x1", x(Math.exp(Math.min.apply(Math, xValues))))
        .attr("y1", y(regressionCoefficients.m * Math.min.apply(Math, xValues) + regressionCoefficients.b))
        .attr("x2", x(Math.exp(Math.max.apply(Math, xValues))))
        .attr("y2", y(regressionCoefficients.m * Math.max.apply(Math, xValues) + regressionCoefficients.b))
        .attr("stroke", "red")
        .attr("stroke-width", 2);
});
    }
window.addEventListener("resize", drawChart);

    // Initial drawing
    drawChart();
}

createScatterPlot();
