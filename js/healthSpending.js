function createHealthcareSpendingChart() {
    // Define the dimensions and margins of the graph
    const margin = {top: 20, right: 80, bottom: 30, left: 50},
        width = 860 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#healthcareSpendingChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Read the data
    d3.csv('processing/Life_Expectancy_Data.csv').then(function(data) {
        // Filter data to include only the needed fields and remove entries without expenditure or GDP data
        const filteredData = data.filter(d => d['Total expenditure'] && d['GDP'] && d['Life expectancy ']);

        // Group data by country and calculate the average for 'Total expenditure', 'GDP', and 'Life expectancy'
        const groupedData = d3.rollup(
            filteredData,
            v => ({
                'Total expenditure': d3.mean(v, d => +d['Total expenditure']),
                'GDP': d3.mean(v, d => +d['GDP']),
                'Life expectancy': d3.mean(v, d => +d['Life expectancy '])
            }),
            d => d.Country
        );

        // Convert the grouped data into an array
        const countryAverages = Array.from(groupedData, ([Country, values]) => ({ Country, ...values }));

        // Sort data by Life expectancy in descending order
        countryAverages.sort((a, b) => b['Life expectancy'] - a['Life expectancy']);
        
        // Select top 5 and bottom 5 countries based on Life expectancy
        const top5Data = countryAverages.slice(0, 5);
        const bottom5Data = countryAverages.slice(-5);
        const topBottom10Data = top5Data.concat(bottom5Data);

        // Create X scale
        const x = d3.scaleBand()
            .range([0, width])
            .domain(topBottom10Data.map(d => d.Country))
            .padding(0.2);

        // Create two Y scales for the different data
        const yLeft = d3.scaleLinear()
            .domain([0, d3.max(topBottom10Data, d => +d['Total expenditure'])*1.1])
            .range([height, 0]);

        const yRight = d3.scaleLinear()
            .domain([0, d3.max(topBottom10Data, d => +d['GDP'])*1.1])
            .range([height, 0]);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .text(function(d) {
        // Truncate the label to 15 characters
            return d.length > 15 ? d.substring(0, 15) + '...' : d;
        });     

        // Add left Y axis
        svg.append("g")
            .call(d3.axisLeft(yLeft));

        // Add right Y axis
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yRight));

        // Add bars for Total expenditure
        svg.selectAll(".bar-total-exp")
            .data(topBottom10Data)
            .enter()
            .append("rect")
            .attr("class", "bar-total-exp")
            .attr("x", d => x(d.Country))
            .attr("y", d => yLeft(+d['Total expenditure']))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - yLeft(+d['Total expenditure']))
            .attr("fill", "#69b3a2");

        // Add bars for GDP
        svg.selectAll(".bar-gdp")
            .data(topBottom10Data)
            .enter()
            .append("rect")
            .attr("class", "bar-gdp")
            .attr("x", d => x(d.Country) + x.bandwidth() / 2)
            .attr("y", d => yRight(+d['GDP']))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => height - yRight(+d['GDP']))
            .attr("fill", "#ffab00");
    });
}

createHealthcareSpendingChart();
