function a() {
    // Load the GeoJSON file
    d3.json('processing/custom.geo.json').then(geoData => {
        // Load the Life Expectancy Data
        d3.csv('processing/Life_Expectancy_Data.csv').then(data => {
            // Process the data
            let countryDataByCountry = {};
            data.forEach(d => {
                if (!countryDataByCountry[d.Country]) {
                    countryDataByCountry[d.Country] = {
                        totalLifeExpectancy: 0,
                        totalGDP: 0,
                        totalSchooling: 0,
                        count: 0
                    };
                }
                countryDataByCountry[d.Country].totalLifeExpectancy += parseFloat(d['Life expectancy ']);
                countryDataByCountry[d.Country].totalGDP += parseFloat(d.GDP);
                countryDataByCountry[d.Country].totalSchooling += parseFloat(d.Schooling);
                countryDataByCountry[d.Country].count += 1;
            });

            for (let country in countryDataByCountry) {
                let countryData = countryDataByCountry[country];
                countryData.averageLifeExpectancy = countryData.totalLifeExpectancy / countryData.count;
                countryData.averageGDP = countryData.totalGDP / countryData.count;
                countryData.averageSchooling = countryData.totalSchooling / countryData.count;
            }

            // Create an SVG element and append it to the div
            const svg = d3.select('#cMap').append('svg')
                .attr('width', 960)
                .attr('height', 400);
                

            // Define a projection and path generator
            const projection = d3.geoNaturalEarth1()
                .scale(160)
                .translate([480, 250]);
            const pathGenerator = d3.geoPath().projection(projection);

            // Define a color scale
            const colorScale = d3.scaleSequential(d3.interpolateViridis)
                .domain(d3.extent(Object.values(countryDataByCountry), d => d.averageLifeExpectancy));

                // Create a vertical legend at the top right corner of the SVG
            const legendHeight = 200;
            const legendWidth = 20;
            const numRects = 10;
            const legend = svg.append('g')
                .attr('id', 'legend')
                .attr('transform', `translate(${960 - 50}, 30)`); // Positioning the legend

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([legendHeight, 0]);

            const legendAxis = d3.axisRight(legendScale)
                .ticks(numRects)
                .tickFormat(d => Math.round(d));

            legend.selectAll('rect')
                .data(d3.range(numRects))
                .enter().append('rect')
                .attr('x', 0)
                .attr('y', (d, i) => legendHeight - (i + 1) * (legendHeight / numRects))
                .attr('width', legendWidth)
                .attr('height', legendHeight / numRects)
                .attr('fill', d => colorScale(legendScale.domain()[0] + d * (legendScale.domain()[1] - legendScale.domain()[0]) / numRects));

            legend.append('g')
                .attr('transform', `translate(${legendWidth}, 0)`)
                .call(legendAxis);
            // Create a tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip2')
                .style('position', 'absolute')
                .style('opacity', 0)
                .style('background', 'white')
                .style('padding', '10px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '5px')
                .style('text-align', 'left')
                .style('pointer-events', 'none')
                .style('transition', 'opacity 0.3s');

            // Draw the countries
            svg.selectAll('path')
                .data(geoData.features)
                .enter().append('path')
                .attr('d', pathGenerator)
                .attr('fill', d => {
                    const countryName = d.properties && d.properties.name;
                    const countryData = countryName && countryDataByCountry[countryName];
                    return countryData ? colorScale(countryData.averageLifeExpectancy) : '#ccc';
                })
                .on('mouseover', (event, d) => {
                    const countryName = d.properties && d.properties.name;
                    const countryData = countryName && countryDataByCountry[countryName];
                    if (countryData) {
                        tooltip.style("opacity", .9);
                        tooltip.html(`<strong>${countryName}</strong><br>Avg Life Expectancy: ${countryData.averageLifeExpectancy.toFixed(2)}<br>Avg GDP: ${countryData.averageGDP.toFixed(2)}<br>Avg Schooling: ${countryData.averageSchooling.toFixed(2)}`)
                            .style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    }
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on('mouseout', () => {
                    tooltip.style('opacity', 0);
                });

            // Add more code here for interactivity, legends, etc.
        });
    });
}
a();
