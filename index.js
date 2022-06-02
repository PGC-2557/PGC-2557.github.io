const format = d3.format(',');

const margin = {top: 0, right: 0, bottom: 0, left: 0};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
var data1,data2,data3;
const color = d3.scaleQuantize()
  .range(d3.schemeOranges[5],d3.schemeOranges[10]);

// Set tooltips
const tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(d => `<strong>Country: </strong><span class='details'>${d.Country}<br></span><strong>Starting & Ending times: </strong><span class='details'>${d["Began"]+" "+ d["Ended"]}<br></span><strong>Deaths: </strong><span class='details'>${d.Dead}<br></span><strong>Displacement: </strong><span class='details'>${d.Displaced}<br></span><strong>Main Cause: </strong><span class='details'>${d.MainCause}<br></span><strong>Severity: </strong><span class='details'>${d.Severity}<br></span><strong>Centeroid X & Y: </strong><span class='details'>${d.long+" "+ d.lat}<br></span>`);

const tip1 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(d => `<strong>Country & Location: </strong><span class='details'>${d.place}<br></span><strong>Starting time: </strong><span class='details'>${d["time"]}<br></span><strong>Exact Location[lat,long]: </strong><span class='details'>${d.latitude+" "+d.longitude}<br></span><strong>Magnitude: </strong><span class='details'>${d.mag}<br></span><strong>Focal Depth: </strong><span class='details'>${d.depth}<br></span>`);

const tip2 = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(d => `<strong>Country & Location: </strong><span class='details'>${d.Country}<br></span><strong>Starting time: </strong><span class='details'>${d["Year"]}<br></span><strong>Exact Location[lat,long]: </strong><span class='details'>${d.Latitude+" "+d.Longitude}<br></span><strong>Name: </strong><span class='details'>${d.Name}<br></span><strong>Type of Volcano: </strong><span class='details'>${d.Type}<br></span><strong>Explosion Index: </strong><span class='details'>${d.VEI}<br></span><strong>Deaths: </strong><span class='details'>${d.Deaths}<br></span>`);

const svg = d3.select('#chloropleth')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .style("overflow", "visible")
  .append('g')
  .attr('class', 'map');

const projection = d3.geoRobinson()
  .scale(168)
  .rotate([352, 0, 0])
  .translate( [width / 2.5, height / 2.2]);

const path = d3.geoPath().projection(projection);

svg.call(tip);
svg.call(tip1);
svg.call(tip2);

Promise.all([
	d3.json('world_countries.json'),
  d3.csv("Floodings.csv"),
  d3.csv("earthquakes.csv"),
  d3.tsv("volcano.tsv")
]).then(
  function(d){
    start(null, d[0], d[1], d[2], d[3], d[4])
  }
);

function parseDate(str) {
    return new Date(str); // months are 0 indexed
}

function datediff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
}

function start(error, data, Floodings, earthquakes, volcano){
  data1 = Floodings;
  data2 = earthquakes;
  data3 = volcano;
    var disasters = ["All", "Floodings","Earthquakes","Volcanic Activities"];
    var disaster = ["Floodings","Earthquakes","Volcanic Activities"];
    disasters.sort(d3.ascending);


  var dropdownMenu = d3.select("#dropdown");
  dropdownMenu
            .append("select")
            .attr("id", "Menu")
            .selectAll("option")
                .data(disasters)
                .enter()
                .append("option")
                .attr("value", function(d, i) { return i; })
                .text(function(d) { return d; });
                dropdownMenu.on("change", function(){
                    b = d3.select("#dropdown option:checked").text();
                    let year = d3.select("#range").text();
                    update(year);
                });
              
                ready(error, data, disaster, Floodings, earthquakes, volcano);
}
function ready(error, data, disasters, Floodings, earthquakes, volcano) {  
  var filterFlooding = Floodings.filter(function(fl){ return fl.Began.substring(6,10)=="1950";})
  var filterEarthQuakes = earthquakes.filter(function(eq){ return eq.time.substring(0,4)=="1950";})
  var filterVolcano = volcano.filter(function(v){ return v.Year=="1950";})
  
  svg.append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(data.features)
    .enter().append('path')
      .attr('d', path)
      .style('fill', "#06830b")
      .style('stroke', 'white')
      .style('opacity', 0.8)
      .style('stroke-width', 0.3)
      
      
    var legend = svg.selectAll('g.legendEntry')
    .data(disasters)
    .enter()
    .append('g').attr('class', 'legendEntry');

    legend
        .append('circle')
        .attr("cx", width - 15)
        .attr("cy", function(d, i) {
          return i * 22.5;
        })
      .attr("r", 5)
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("fill", function(d){
        if(d=="Floodings"){
          return "blue";
        }
        if(d=="Earthquakes"){
          return "#e6ac00";
        }
        if(d=="Volcanic Activities"){
          return "#e60000";
        }
      }); 

    legend
        .append('text')
        .attr("x", width -5) 
        .attr("y", function(d, i) {
          return i * 21;
        })
        .attr("dy", "0.5em") 
        .text(function(d,i) {
            return d;
        });


        var fld = svg
    .selectAll(".floodings")
		.data(filterFlooding);
		fld.enter()
		.append("circle")
    .attr("class", "floodings")
			.attr("cx", function(d) {
			return projection([d.long, d.lat])[0];
			})
			.attr("cy", function(d) {
			return projection([d.long, d.lat])[1];
			})
			.attr("r", function(d){ return +d.Severity*2-1;})
      .attr("fill", "blue").on('mouseover',function(d){
        let diff = datediff(parseDate(d.Began),parseDate(d.Ended));
        d["diff"] = diff;
        tip.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });
     

     var erq = svg.selectAll(".earthquakes")
		.data(filterEarthQuakes)
		erq.enter()
		.append("circle")
			.attr("cx", function(d) {
			return projection([d.longitude, d.latitude])[0];
			})
			.attr("cy", function(d) {
			return projection([d.longitude, d.latitude])[1];
			})
			.attr("r", function(d){ return 0.5+((+d.mag-6))*1.5;})
      .attr("fill", "#e6ac00")
      .attr("class", "earthquakes")
      .on('mouseover',function(d){
        tip1.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip1.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });

      

      var vol = svg.selectAll(".volcano")
		.data(filterVolcano)
		vol.enter()
		.append("circle")
			.attr("cx", function(d) {
			return projection([d.Longitude, d.Latitude])[0];
			})
			.attr("cy", function(d) {
			return projection([d.Longitude, d.Latitude])[1];
			})
			.attr("r",  function(d){ return (0.8+d.VEI*1.25);})
      .attr("fill", "#e60000")
      .attr("class", "volcano").on('mouseover',function(d){
        tip2.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip2.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });
      

      var zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', function() {
          svg.selectAll('path')
           .attr('transform', d3.event.transform);
           svg.selectAll('.earthquakes')
           .attr('transform', d3.event.transform);
            svg.selectAll('.volcano')
           .attr('transform', d3.event.transform);
            svg.selectAll('.floodings')
           .attr('transform', d3.event.transform);
});

svg.call(zoom);

d3.select("#reset").on("click", function(){
   svg.selectAll('path').transition()
    .duration(1000)
    .call(zoom.transform, d3.zoomIdentity);

     svg.selectAll('.earthquakes')
           .transition()
    .duration(1000)
    .call(zoom.transform, d3.zoomIdentity);
            svg.selectAll('.volcano')
          .transition()
    .duration(1000)
    .call(zoom.transform, d3.zoomIdentity);
            svg.selectAll('.floodings')
           .transition()
    .duration(1000)
    .call(zoom.transform, d3.zoomIdentity);
})

}

function update(year){
  var filterFlooding = data1.filter(function(fl){ return fl.Began.substring(6,10)==year;})
  var filterEarthQuakes = data2.filter(function(eq){ return eq.time.substring(0,4)==year;})
  var filterVolcano = data3.filter(function(v){ return v.Year==year;})

  d3.selectAll(".floodings").remove();
  d3.selectAll(".earthquakes").remove();
  d3.selectAll(".volcano").remove();
  d3.selectAll(".legendEntry").remove();
  var fld = svg.selectAll(".floodings")
		.data(filterFlooding);
		fld.enter()
		.append("circle")
			.attr("cx", function(d) {
			return projection([d.long, d.lat])[0];
			})
			.attr("cy", function(d) {
			return projection([d.long, d.lat])[1];
			})
			.attr("r", function(d){ return +d.Severity*2-1;})
      .attr("fill", "blue")
			.attr("class", "floodings")
      .on('mouseover',function(d){
        let diff = datediff(parseDate(d.Began),parseDate(d.Ended));
        d["diff"] = diff;
        tip.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });
      

     var erq = svg.selectAll(".earthquakes")
		.data(filterEarthQuakes)
		erq.enter()
		.append("circle")
			.attr("cx", function(d) {
			return projection([d.longitude, d.latitude])[0];
			})
			.attr("cy", function(d) {
			return projection([d.longitude, d.latitude])[1];
			})
			.attr("r", function(d){ return 0.5+((+d.mag-6))*1.5;})
      .attr("fill", "#e6ac00")
      .attr("class", "earthquakes")
      .on('mouseover',function(d){
        tip1.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip1.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });

      

      var vol = svg.selectAll(".volcano")
		.data(filterVolcano)
		vol.enter()
		.append("circle")
			.attr("cx", function(d) {
			return projection([d.Longitude, d.Latitude])[0];
			})
			.attr("cy", function(d) {
			return projection([d.Longitude, d.Latitude])[1];
			})
			.attr("r",  function(d){ return (0.8+d.VEI*1.25);})
      .attr("fill", "#e60000")
      .attr("class", "volcano")
      .on('mouseover',function(d){
        tip2.show(d);
        d3.select(this)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseout', function(d){
        tip2.hide(d);
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke-width',0.3);
      });

      var disaster = ["Floodings","Earthquakes","Volcanic Activities"];

      let b = d3.select("#dropdown option:checked").text();
      if(b=="All"){
        d3.selectAll(".floodings").style("opacity", 1)
        d3.selectAll(".earthquakes").style("opacity", 1)
         d3.selectAll(".volcano").style("opacity", 1)  
         disaster = ["Floodings","Earthquakes","Volcanic Activities"];
      }
      if(b=="Floodings"){
        d3.selectAll(".floodings").style("opacity", 1)
        d3.selectAll(".earthquakes").style("opacity", 0)
         d3.selectAll(".volcano").style("opacity", 0) 
         disaster = ["Floodings"];
      }
      if(b=="Earthquakes"){
        d3.selectAll(".floodings").style("opacity", 0)
        d3.selectAll(".earthquakes").style("opacity", 1)
         d3.selectAll(".volcano").style("opacity", 0)  
         disaster = ["Earthquakes"];
      }
      if(b=="Volcanic Activities"){
        d3.selectAll(".floodings").style("opacity", 0)
        d3.selectAll(".earthquakes").style("opacity", 0)
         d3.selectAll(".volcano").style("opacity", 1)  
         disaster = ["Volcanic Activities"];
      }

      var legend = svg.selectAll('g.legendEntry')
    .data(disaster)
    .enter()
    .append('g').attr('class', 'legendEntry');

    legend
        .append('circle')
        .attr("cx", width - 15)
        .attr("cy", function(d, i) {
          return i * 22.5;
        })
      .attr("r", 5)
      .style("stroke", "black")
      .style("stroke-width", 1)
      .style("fill", function(d){
        if(d=="Floodings"){
          return "blue";
        }
        if(d=="Earthquakes"){
          return "#e6ac00";
        }
        if(d=="Volcanic Activities"){
          return "#e60000";
        }
      }); 

    legend
        .append('text')
        .attr("x", width -5) 
        .attr("y", function(d, i) {
          return i * 21;
        })
        .attr("dy", "0.5em") 
        .text(function(d,i) {
            return d;
        });
}