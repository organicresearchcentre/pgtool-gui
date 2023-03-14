<script>
module.exports = {
	name: "radar-chart",
	props: {
		'elid': String,
		'chartdata': Array,
		'multiple':  { type: Boolean, default: false },
	},
	mounted() {
		this.addChart();
	},
	watch: {
		chartdata: {
			deep: true,
			handler(value) {
					this.addChart();
			}
		}
	},
	methods: {
		addChart() {
			var self = this
			
			var data = []
			if (this.multiple) {
				// reorganize data
				var allSeries = this.chartdata[0].axis
				for (var i = 0; i < this.chartdata[0].values.length; i++) {
					data.push([])
					for (el of this.chartdata) {
							var element = Object.assign({}, el)
							//element.value = el.values[i].y > 0 ? el.values[i].y/100 : el.values[i].y
							//element.value = el.values[i].y/100
							element.value = el.values[i].y
							element.axis = el.title
							data[i].push(element)
					}
				}
			} else {
				data = this.chartdata.slice()
			}
			var id = "#" + this.elid
			
			var cfg = {
				w: 280,
				h: 300,
				margin: { top: 50, right: 70, bottom: 50, left: 70 },
				levels: 10,				//How many levels or inner circles should there be drawn
				maxValue: 5, 			//What is the value that the biggest circle will represent
				labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
				wrapWidth: 15, 		//The number of pixels after which a label needs to be given a new line
				opacityArea: 0.3,//0.35, 	//The opacity of the area of the blob
				dotRadius: 4, 			//The size of the colored circles of each blog
				opacityCircles: 0.3,//0.5, 	//The opacity of the circles of each blob
				strokeWidth: 2, 		//The width of the stroke around each blob
				roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
				colorGradient: ['red','red','red','orange','orange','orange','orange','#4caf50','#4caf50','#4caf50'].reverse()
			};
			bottomLegend = 0
			if (allSeries) {
				bottomLegend = allSeries.length*22
			}
			
			//If the supplied maxValue is smaller than the actual one, replace by the max in the data
			var maxValue = 5
			
			var allAxis = (data[0].map(function(i, j){return i.axis})),	//Names of each axis
				total = allAxis.length,					//The number of different axes
				radius = Math.min(cfg.w/2, cfg.h/2), 	//Radius of the outermost circle
				//Format = d3.format('.0%'),			 	//Percentage formatting
				Format = d3.format('.1f'),
				angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"
			
			//Scale for the radius
			var rScale = d3.scaleLinear() // 28/04/2021 UPDATE TO WORK WITH D3 V6.7.0
				.range([0, radius])
				.domain([0, maxValue]);

			function colorize(i) {
				if (self.multiple) {
					var highContrastColors = ['#0057E9', '#5a11af', '#FF00BD', '#64dcf0', '#24fa48', '#e3fa24', "#2c0094","#f03ab9","#98c72a","#db5c25","#14b7fc","#cf1597","#2cf267","#a85632"]
					if (i > highContrastColors.length) {
						i = i - highContrastColors.length
					}
					return highContrastColors[i]
				} else {
					return 'white'
				}
			}
				
			/////////////////////////////////////////////////////////
			//////////// Create the container SVG and g /////////////
			/////////////////////////////////////////////////////////

			//Remove whatever chart with the same id/class was present before
			d3.select(id).select("svg").remove();

			var width = cfg.w + cfg.margin.left + cfg.margin.right
			var height = cfg.h + cfg.margin.top + cfg.margin.bottom + bottomLegend
			
			//Initiate the radar chart SVG
			var svg = d3.select(id).append("svg")
					.attr("width",  width)
					.attr("height", height)
					.attr("class", "radar"+id);
			//Append a g element		
			var g = svg.append("g")
					.attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
			
			/////////////////////////////////////////////////////////
			////////// Glow filter for some extra pizzazz ///////////
			/////////////////////////////////////////////////////////
			
			//Filter for the outside glow
			var filter = g.append('defs').append('filter').attr('id','glow'),
				feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
				feMerge = filter.append('feMerge'),
				feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
				feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

			/////////////////////////////////////////////////////////
			/////////////// Draw the Circular grid //////////////////
			/////////////////////////////////////////////////////////
			
			var radialGradient = g.append("defs")
			.append("radialGradient")
				.attr("id", "radial-gradient");

			radialGradient.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", "red");
			radialGradient.append("stop")
				.attr("offset", "50%")
				.attr("stop-color", "yellow");
			radialGradient.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", "green");

			//Wrapper for the grid & axes
			var axisGrid = g.append("g").attr("class", "axisWrapper");
			
			//Draw the background circles
			axisGrid.selectAll(".levels")
				.data(d3.range(1,(cfg.levels+1)).reverse())
				.enter()
				.append("circle")
				.attr("class", "gridCircle")
				.attr("r", function (d, i) { return radius / cfg.levels * d; })
				.style("stroke", "#737373")
				.style("fill", function(d, i) {
					return cfg.colorGradient[i]
				})
				.style("fill-opacity", function(d, i) {
					if (i > 0) {
						return cfg.opacityCircles
					}	else {
						return 0.5
					}		
				})

			//Text indicating at what % each level is
			axisGrid.selectAll(".axisLabel")
				.data(d3.range(1,(cfg.levels+1)).reverse())
				.enter().append("text")
				.attr("class", "axisLabel")
				.attr("x", 4)
				.attr("y", function(d){return -d*radius/cfg.levels;})
				.attr("dy", "0.4em")
				.style("font-size", "10px")
				.attr("font-family", "Open Sans")
				.attr("fill", "#737373")
				.text(function(d,i) { return Format(maxValue * d/cfg.levels); });

			/////////////////////////////////////////////////////////
			//////////////////// Draw the axes //////////////////////
			/////////////////////////////////////////////////////////
			
			//Create the straight lines radiating outward from the center
			var axis = axisGrid.selectAll(".axis")
				.data(allAxis)
				.enter()
				.append("g")
				.attr("class", "axis");
			//Append the lines
			axis.append("line")
				.attr("x1", 0)
				.attr("y1", 0)
				.attr("x2", function(d, i){ return rScale(maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
				.attr("y2", function(d, i){ return rScale(maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
				.attr("class", "line")
				.style("stroke", "#737373")
				.style("stroke-width", "1px");

			//Append the labels at each axis
			axis.append("text")
				.attr("class", "legend")
				.style("font-size", "11px")
				.attr("font-family", "Open Sans")
				.attr("text-anchor", "middle")
				.attr("dy", "0.35em")
				.attr("x", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
				.attr("y", function(d, i){ return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
				.text(function(d){return d})
				.call(wrap, cfg.wrapWidth);

			/////////////////////////////////////////////////////////
			///////////// Draw the radar chart blobs ////////////////
			/////////////////////////////////////////////////////////
			
			function isValidValue(value) {
				return value !== null & value !== undefined && value !== "null" && value !== "";
			}
			
			//The radial line function
			var radarLine = d3.lineRadial() // 28/04/2021 UPDATE TO WORK WITH D3 V6.7.0
				//.interpolate("linear-closed")
				//.defined(function (d) { return isValidValue(d.value) })
				.curve(d3.curveLinearClosed) // 28/04/2021 UPDATE TO WORK WITH D3 V6.7.0
				.radius(function(d) { return rScale(d.value); })
				.angle(function(d,i) {	return i*angleSlice; });
				
			if (cfg.roundStrokes) {
				radarLine.curve(d3.curveCardinalClosed) // 28/04/2021 UPDATE TO WORK WITH D3 V6.7.0
				//radarLine.interpolate("cardinal-closed");
			}
			
			//Create a wrapper for the blobs	
			var blobWrapper = g.selectAll(".radarWrapper")
				.data(data)
				.enter().append("g")
				.attr("class", "radarWrapper");
			
			if (!this.multiple) {
			//Append the backgrounds	
			blobWrapper
				.append("path")
				.attr("class", "radarArea")
				.attr("d", function(d,i) { return radarLine(d); })
				.style("fill", function(d,i) { return colorize(i); })
				.style("fill-opacity", cfg.opacityArea)
				.on('mouseover', function (d,i){
					//Dim all blobs
					d3.selectAll(".radarArea")
						.transition().duration(200)
						.style("fill-opacity", 0.1); 
					//Bring back the hovered over blob
					d3.select(this)
						.transition().duration(200)
						.style("fill-opacity", 0.7);	
				})
				.on('mouseout', function(){
					//Bring back all blobs
					d3.selectAll(".radarArea")
						.transition().duration(200)
						.style("fill-opacity", cfg.opacityArea);
				});
			}
				
			//Create the outlines	
			blobWrapper.append("path")
				.attr("class", "radarStroke")
				.attr("d", function(d,i) { return radarLine(d); })
				.style("stroke-width", cfg.strokeWidth + "px")
				.style("stroke", function(d,i) { return colorize(i); })
				.style("fill", "none")
				//.style("filter" , "url(#glow)");		
			
			//Append the circles
			blobWrapper.selectAll(".radarCircle")
				.data(function(d,i) { return d; })
				.enter().append("circle")
				.attr("class", "radarCircle")
				.attr("r", cfg.dotRadius)
				.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
				.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
				.style("fill", function(d,i,group,j) { return colorize(j); }) // 28/04/2021 D3 CODE CHANGE
				.style("fill-opacity", 0.8);

			/////////////////////////////////////////////////////////
			//////// Append invisible circles for tooltip ///////////
			/////////////////////////////////////////////////////////
			
			//Wrapper for the invisible circles on top
			var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
				.data(data)
				.enter().append("g")
				.attr("class", "radarCircleWrapper");
				
			//Append a set of invisible circles on top for the mouseover pop-up
			blobCircleWrapper.selectAll(".radarInvisibleCircle")
				.data(function(d,i) { return d; })
				.enter().append("circle")
				.attr("class", "radarInvisibleCircle")
				.attr("r", cfg.dotRadius*1.5)
				.attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
				.attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
				.style("fill", "none")
				.style("pointer-events", "all")
				.on("mouseover", function(d,i) {
					newX =  parseFloat(d3.select(this).attr('cx')) - 10;
					newY =  parseFloat(d3.select(this).attr('cy')) - 10;
					
					tooltip
						.attr('x', newX)
						.attr('y', newY)
						.text(Format(i.value))
						.transition().duration(200)
						.style('opacity', 1);
				})
				.on("mouseout", function(){
					tooltip.transition().duration(200)
						.style("opacity", 0);
				});
				
			//Set up the small tooltip for when you hover over a circle
			var tooltip = g.append("text")
				.attr("class", "tooltip")
				.style("opacity", 0);

			if (this.multiple) {
				var legend = g.append("g")
				.attr("font-family", "Open Sans")
				.attr("font-size", '10px')
				.attr("text-anchor", "start")
				.attr("transform", function(d, i) { return "translate(-" + width/2 + "," + (cfg.h/2 + cfg.margin.bottom) + ")"; })
			.selectAll("g")
			.data(data)
			.enter().append("g")
				.attr("transform", function(d, i) { return "translate(0," + (i * 22) + ")"; });

		legend.append("rect")
				.attr("x", 0)
				.attr("width", 19)
				.attr("height", 19)
				//.attr('stroke', 'black')
				.style("fill", function(d,i) { return colorize(i); })

		legend.append("text")
				.attr("x", 22)
				.attr("y", 9.5)
				.attr("dy", "0.32em")
				.text(function(d, i) { return allSeries[i].name })
				.attr("font-family", "Open Sans")
			}
		}
	}
}
</script>

<template>
	<div :id="elid"></div>
</template>