// The code for the chart is wrapped inside a function that automatically resizes the chart
function createResponsiveChart() {

  // Select the div with class 'scatter'
  var svgArea = d3.select("#scatter").select("svg");

  // if the SVG area isn't empty when the browser loads,
  // we remove it and replace it with a resized version of the chart
  if (!svgArea.empty()) {
    svgArea.remove();
  }

  // SVG wrapper dimensions are determined by the current width and height of the browser window.
  var svgWidth = window.innerWidth*(3/4);
  var svgHeight = window.innerHeight/2;
  
  // But we also want to set some minimums so that the chart never gets too small
  if (window.innerWidth < 600) {
    svgWidth = 500
  };
  if (window.innerHeight < 600) {
    svgHeight = 300
  };

  // Add some increased margins for the bottom/left for the multiple x/y axes
  var margin = {
    top: 20,
    right: 20,
    bottom: 100,
    left: 100
  };

  // Define the width and height of our chart based on the svg width less margins
  var width = svgWidth - margin.left - margin.right;
  var height = svgHeight - margin.top - margin.bottom;

  // Create an SVG wrapper that will hold our chart, and shift the latter by left and top margins.
  var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  // Append an SVG group
  var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Params for initial page load
  var chosenXAxis = "poverty";
  var chosenYAxis = "healthcare";

  // FUNCTION DEFINITIONS BEGIN ///////////////////////////////////////////////////////////////////
  
  // Updating x-scale upon axis label selection
  function xScale(fullData, chosenXAxis) {
    // create scales
    var xLinearScale = d3.scaleLinear()
      .domain([d3.min(fullData, d => d[chosenXAxis]) * 0.9,
        d3.max(fullData, d => d[chosenXAxis]) * 1.05
      ])
      .range([0, width]);

    return xLinearScale;

  } 

  // Updating y-scale upon axis label selection
  function yScale(fullData, chosenYAxis) {
    // create scales
    var yLinearScale = d3.scaleLinear()
      .domain([d3.min(fullData, d => d[chosenYAxis]) * 0.8,
        d3.max(fullData, d => d[chosenYAxis]) * 1.05
      ])
      .range([height, 0]);

    return yLinearScale;

  } ///////////////////////////////////////////////////////////////////////////////////////////////

  // Updating xAxis upon axis label selection
  function renderXaxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
      .duration(1000)
      .call(bottomAxis);

    return xAxis;
  } 

  // Updating yAxis upon axis label selection
  function renderYaxes(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
      .duration(1000)
      .call(leftAxis);

    return yAxis;
  } ///////////////////////////////////////////////////////////////////////////////////////////////


  // Updating circles group with a transition to new circle locations
  function renderCircles(circlesGroup, newXScale, chosenXAxis, newYScale, chosenYAxis,) {

    circlesGroup.transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]))
      .attr("cy", d => newYScale(d[chosenYAxis]));

    return circlesGroup;
  } ///////////////////////////////////////////////////////////////////////////////////////////////

  // Updating text group with a transition to new circle locations
  function renderText(textGroup, newXScale, chosenXAxis, newYScale, chosenYAxis,) {

    textGroup.transition()
      .duration(1000)
      .attr("x", d => newXScale(d[chosenXAxis]))
      .attr("y", d => newYScale(d[chosenYAxis])+1);

    return textGroup;
  } ///////////////////////////////////////////////////////////////////////////////////////////////

  // Updating circle group with new tooltips
  function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {

    var Xlabel;
    var Ylabel;

    if (chosenXAxis === "poverty") {
      Xlabel = "Percent in Poverty:";
    }
    else if (chosenXAxis === "age") {
      Xlabel = "Median Age:";
    }
    else if (chosenXAxis === "income") {
      Xlabel = "Median Household Income:";
    }
    
    if (chosenYAxis === "healthcare") {
      Ylabel = "Percent Lacking Healthcare:";
    }
    else if (chosenYAxis === "smokes") {
      Ylabel = "Percent that Smoke:";
    }
    else if (chosenYAxis === "obesity") {
      Ylabel = "Percent Obese:";
    }

    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html(function(d) {
        return (` ${d.state} <br>
                  ${Ylabel} ${d[chosenYAxis]} <br> 
                  ${Xlabel} ${d[chosenXAxis]}`);
    });

    circlesGroup.call(toolTip)
      .on("mouseover", d => toolTip.show(d, this))
      .on("mouseout", d => toolTip.hide(d));

    return circlesGroup;
  }

  // FUNCTION DEFINITIONS END /////////////////////////////////////////////////////////////////////

  // Retrieve data from the CSV file and execute all previously defined functions
  d3.csv("./assets/data/data.csv").then(function(fullData, err) {
    if (err) throw err;

    // Parse data
    fullData.forEach(function(data) {
      data.poverty = +data.poverty;
      data.age = +data.age;
      data.income = +data.income;
      data.healthcare = +data.healthcare;
      data.smokes = +data.smokes;
      data.obesity = +data.obesity;
    });

    // Create scale functions
    var xLinearScale = xScale(fullData, chosenXAxis);
    var yLinearScale = yScale(fullData, chosenYAxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append X & Y Axes
    var xAxis = chartGroup.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

    var yAxis = chartGroup.append("g")
      .classed("y-axis", true)
      .call(leftAxis);

    // Append initial circles with size and color formatting
    var circlesGroup = chartGroup.selectAll("circle.circles")
      .data(fullData)
      .enter()
      .append("circle")
      .classed("circles", true)
      .attr("cx", d => xLinearScale(d[chosenXAxis]))
      .attr("cy", d => yLinearScale(d[chosenYAxis]))
      .attr("r", 10)
      .attr("fill", "steelblue")
      .attr("opacity", ".7");

    // Append text to data points and format size, font, and color
    var textGroup = chartGroup.selectAll("text.circletext")
      .data(fullData)
      .enter()
      .append("text")
      .classed("circletext", true)
      .text(d => d.abbr)
      .attr("x", d => xLinearScale(d[chosenXAxis]))
      .attr("y", d => yLinearScale(d[chosenYAxis])+1)
      .attr("text-anchor",  "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", "8px")
      .attr("fill", "white");

    // Apply the updateToolTip function to the circles
    var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

    // Create group for three x-axis labels /////////////////////////
    var xlabelsGroup = chartGroup.append("g")
      .attr("transform", `translate(${width / 2}, ${height + 20})`);

          var povertyLabel = xlabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("value", "poverty")
            .classed("active", true)
            .text("Poverty (%)");

          var ageLabel = xlabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("value", "age")
            .classed("inactive", true)
            .text("Age (Median)");

          var incomeLabel = xlabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 60)
            .attr("value", "income")
            .classed("inactive", true)
            .text("Household Income (Median)");

    // Create group for three y-axis labels /////////////////////////
    var ylabelsGroup = chartGroup.append("g")
      .attr("transform", "rotate(-90)")

          var healthcareLabel = ylabelsGroup.append("text")
            .attr("y", 55 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("value", "healthcare")
            .classed("active", true)
            .text("Lacks Healthcare (%)");

          var smokesLabel = ylabelsGroup.append("text")
            .attr("y", 35 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("value", "smokes")
            .classed("inactive", true)
            .text("Smokes (%)");

          var obesityLabel = ylabelsGroup.append("text")
            .attr("y", 15 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("value", "obesity")
            .classed("inactive", true)
            .text("Obese (%)");


    // Event listener for the X axis
    xlabelsGroup.selectAll("text")
      .on("click", function() {
        
        // Get value of selection
        var Xvalue = d3.select(this).attr("value");
        
        // Begin if statment to ensure that a new selection was made
        if (Xvalue !== chosenXAxis) {

          // Update chosenXAxis
          chosenXAxis = Xvalue;

          // Set new X scale
          xLinearScale = xScale(fullData, chosenXAxis);

          // Updates X axis with transition
          xAxis = renderXaxes(xLinearScale, xAxis);

          // Update circles with their new X values
          circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

          // Update text with their new X values
          textGroup = renderText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

          // Update tooltips with their new X values and information
          circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

          // Change classes to bold the selected axis text
          if (chosenXAxis === "poverty") {
              povertyLabel
                .classed("active", true)
                .classed("inactive", false);
              ageLabel
                .classed("active", false)
                .classed("inactive", true);
              incomeLabel
                .classed("active", false)
                .classed("inactive", true);
          } else if (chosenXAxis === "age") {
              povertyLabel
                .classed("active", false)
                .classed("inactive", true);
              ageLabel
                .classed("active", true)
                .classed("inactive", false);
              incomeLabel
                .classed("active", false)
                .classed("inactive", true);
          } else if (chosenXAxis === "income") {
              povertyLabel
                .classed("active", false)
                .classed("inactive", true);
              ageLabel
                .classed("active", false)
                .classed("inactive", true);
              incomeLabel
                .classed("active", true)
                .classed("inactive", false);
          }
        }
    });

    // Event listener for the Y axis
    ylabelsGroup.selectAll("text")
    .on("click", function() {
      
      // Get value of selection
      var Yvalue = d3.select(this).attr("value");
      
      // Begin if statment to ensure that a new selection was made
      if (Yvalue !== chosenYAxis) {

        // Update chosenYAxis
        chosenYAxis = Yvalue;

        // Set new Y scale
        yLinearScale = yScale(fullData, chosenYAxis);

        // Updates Y axis with transition
        yAxis = renderYaxes(yLinearScale, yAxis);

        // Update circles with their new Y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

        // Update text with their new Y values
        textGroup = renderText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

        // Update tooltips with their new Y values and information
        circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

        // Change classes to bold the selected axis text
        if (chosenYAxis === "healthcare") {
            healthcareLabel
              .classed("active", true)
              .classed("inactive", false);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
            obesityLabel
              .classed("active", false)
              .classed("inactive", true);
        } else if (chosenYAxis === "smokes") {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", true)
              .classed("inactive", false);
            obesityLabel
              .classed("active", false)
              .classed("inactive", true);
        } else if (chosenYAxis === "obesity") {
            healthcareLabel
              .classed("active", false)
              .classed("inactive", true);
            smokesLabel
              .classed("active", false)
              .classed("inactive", true);
            obesityLabel
              .classed("active", true)
              .classed("inactive", false);
        }
      }
    });
  })
  // Catch any error that may have occured
  .catch(error => console.log(error));
};

// When the browser loads, createResponsiveChart() is called.
createResponsiveChart();

// When the browser window is resized, createResponsiveChart() is called.
d3.select(window).on("resize", createResponsiveChart);