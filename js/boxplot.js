function createBoxPlot(){
// Define the dimensions and margins of the graph
const marginBoxPlot = {top: 10, right: 30, bottom: 30, left: 60},
        widthBoxPlot = 800 - marginBoxPlot.left - marginBoxPlot.right,
        heightBoxPlot = 400 - marginBoxPlot.top - marginBoxPlot.bottom;
// const boxWidth = 20;
    // Append the svg object for the box plot to the body of the page
    const svgBoxPlot = d3.select("#BoxPlot")
        .append("svg")
        .attr("width", widthBoxPlot + marginBoxPlot.left + marginBoxPlot.right)
        .attr("height", heightBoxPlot + marginBoxPlot.top + marginBoxPlot.bottom)
        .append("g")
        .attr("transform", `translate(${marginBoxPlot.left},${marginBoxPlot.top})`);

// Read the country-to-continent mapping
d3.csv('processing/CountryToContinent.csv').then(function(mappingData) {
    const countryToContinent = {};
    mappingData.forEach(d => {
        countryToContinent[d.Country] = d.Continent;
    });
    console.log(countryToContinent);

    // Now read the life expectancy data
    d3.csv('processing/Life_Expectancy_Data.csv').then(function(data) {
        // Assign a continent to each country in the life expectancy data
        data.forEach(d => {
            d.Continent = countryToContinent[d.Country] || "Other";
            if(d.Continent === "Other"){
            // console.log(d.Country + " "+ d.Continent);
            }
            
            d.Schooling = +d.Schooling;
        });
        data = data.filter(d => d.Continent !== "Other");
        // Group by continent and calculate statistics for box plot
        const dataByContinent = d3.rollups(data, v => {
            const q1 = d3.quantile(v.map(d => d.Schooling).sort(d3.ascending), .25);
            const median = d3.quantile(v.map(d => d.Schooling), .5);
            const q3 = d3.quantile(v.map(d => d.Schooling), .75);
            const interQuantileRange = q3 - q1;
            const min = q1 - 1.5 * interQuantileRange;
            const max = q3 + 1.5 * interQuantileRange;
            return {q1, median, q3, min, max};
        }, d => d.Continent);

        
        // Transform dataByContinent into a suitable format for D3
        const transformedData = dataByContinent.map(d => ({
            continent: d[0],
            stats: d[1]
        }));

        // console.log("Transformed Data for Box Plot:", transformedData);
        // Create scales
        const x = d3.scaleBand()
            .range([0, widthBoxPlot])
            .domain(dataByContinent.map(d => d[0]))
            .paddingInner(1)
            .paddingOuter(.5);
        svgBoxPlot.append("g")
        .attr("transform", `translate(0, ${heightBoxPlot})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "14px")

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Schooling)])
            .range([heightBoxPlot, 0]);
        svgBoxPlot.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");


             // Bind the transformed data to the D3 selection
        const boxes = svgBoxPlot.selectAll("rect").data(transformedData);

        const boxWidth = 20;
        svgBoxPlot.selectAll("rect")
            .data(transformedData)
            .enter()
            .append("rect")
                .attr("x", d => x(d.continent) - boxWidth / 2)
                .attr("y", d => y(d.stats.q3))
                .attr("height", d => y(d.stats.q1) - y(d.stats.q3))
                .attr("width", boxWidth)
                .attr("stroke", "black")
                .style("fill", "#69b3a2");
   // Create lines from the box to the max value
svgBoxPlot.selectAll("maxLines")
.data(transformedData)
.enter()
.append("line")
    .attr("x1", d => x(d.continent))
    .attr("x2", d => x(d.continent))
    .attr("y1", d => y(d.stats.q3))
    .attr("y2", d => y(d.stats.max))
    .attr("stroke", "black");

// Create lines from the box to the min value
svgBoxPlot.selectAll("minLines")
.data(transformedData)
.enter()
.append("line")
    .attr("x1", d => x(d.continent))
    .attr("x2", d => x(d.continent))
    .attr("y1", d => y(d.stats.q1))
    .attr("y2", d => y(d.stats.min))
    .attr("stroke", "black");
        
        svgBoxPlot.selectAll("medianLines")
            .data(dataByContinent)
            .enter()
            .append("line")
                .attr("x1", d => x(d[0]) - boxWidth / 2)
                .attr("x2", d => x(d[0]) + boxWidth / 2)
                .attr("y1", d => {
                    // console.log("Median Y:", y(d[1].median)); // Log Y position
                    return y(d[1].median);
                })
                .attr("y2", d => y(d[1].median))
                .attr("stroke", "black")
                .style("width", 80);

                
                // Calculate average life expectancy for each continent
            const lifeExpectancyByContinent = d3.rollups(data, v => d3.mean(v, d => d['Life expectancy ']), d => d.Continent);

            // Create a secondary y-axis for life expectancy
            const yRight = d3.scaleLinear()
                .domain([0, d3.max(lifeExpectancyByContinent, d => d[1])])
                .range([heightBoxPlot, 0]);

            svgBoxPlot.append("g")
                .attr("transform", `translate(${widthBoxPlot}, 0)`)
                .call(d3.axisRight(yRight));

            // Create a line for average life expectancy
            const line = d3.line()
                .x(d => x(d[0]) + x.bandwidth() / 2) // Center the line in the band
                .y(d => yRight(d[1]));

            svgBoxPlot.append("path")
                .datum(lifeExpectancyByContinent)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", line);
    });
});
}
createBoxPlot();
