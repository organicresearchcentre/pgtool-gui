<script>
module.exports = {
	name: "vert-bar-chart",
	props: {
		'elid': String,
		'chartdata': [Array, Object],
		'perc_or_abs': String, // to control the Y axis, if it is a % or absolute values
		'coloring': String, // cats or #colorcode
		'yunit': String,
		'hasBenchmarking': Boolean,
		'width0': Number,
		'height0': Number,
		'margin_bottom0': Number,
		'benchmarkingLegend': Object,
		'simple_x': Boolean,
		'color_x_labels': Boolean,
		'ymax': Number
	},
	mounted() {
		this.addChart();
	},
	watch: {
		chartdata: {
			handler(value) {
				this.addChart();
			},
			deep: true,
		}
	},
	computed: {
		colors() {
			return colors;
		}
	},
	methods: {
		addChart() {
			var self = this
			d3.select("#" + this.elid + " > *").remove()

			var thousandsSeparatorFormat = d3.format(',')
			var noDecimalsPercentageFormat = d3.format(",.0%")
			var noDecimalsFormat = d3.format(",.0f")
			var oneDecimalsFormat = d3.format(",.1f")
			var thousandsKFormat = d3.format(".3s")
			var thousandsKFormatYLabel = d3.format(".0s")
			
			var scoreColors =
				[ '#649B35', '#22586A', '#FFA500', '#998888', '#502419', '#8EB1C7',
				'#649B35', '#22586A', '#FFA500', '#998888', '#502419', '#8EB1C7' ]

			/* 
			 * Parse the Data
			 */
			var data = this.chartdata

			/*
			 * Set the dimensions and margins of the graph
			 */
			var height0 = this.height0 ? this.height0 : 350
			var width0 = this.width0 ? this.width0 : 500
			
			var yMax = 1
			if (this.ymax) {
				yMax = this.ymax
			} else {
				if (this.perc_or_abs == 'abs') {
					// If the Y values are absolute values
					var yMax = Math.max(d3.max(data, function(d) { return d.value; }), 1)
					if (this.hasBenchmarking) {
						yMax = Math.max(d3.max(data, function(d) { return Math.max(d.value, d.benchValue); }), 1)
					}
				}
			}

			function isValidValue(value) {
				return value !== null & value !== undefined && value !== "null" && value !== "";
			}
			
			var abs_format = yMax > 10000 ? thousandsKFormatYLabel : thousandsSeparatorFormat
			
			var nrCount = Math.round(yMax).toString().length
			if (yMax <= 10000 && nrCount >= 4 && nrCount <= 6 ) nrCount = nrCount+2 // count with ,

			var margin = {
				top: (this.hasBenchmarking) ? 20 : 5,
				right: this.hasBenchmarking ? 170 : 20,
				bottom: this.margin_bottom0 ? this.margin_bottom0 : (this.simple_x ? 30 : 160),
				left: (nrCount < 4 ? 4 : nrCount) * 9 + 10+50
				}
			var width = width0 - margin.left - margin.right
			if (this.hasBenchmarking) width = width0
			var height = height0 - margin.top - margin.bottom;

			/*
			 * Append the svg object to the body of the page
			 */
			var svg = d3.select("#" + this.elid)
				.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
			
			var g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			
			/*
			 * X Axis
			 */
			var x = d3.scaleBand()
				.range([ 0, width ])
				.domain(data.map(function(d) { return d.axis; }))
				.padding(0.2);

			g.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
				.selectAll("text")
					.attr("class", function(d, i) { return self.color_x_labels ? "font-weight-bold" : "" })
					.attr("font-family", "Open Sans")
					.attr("font-size", "12px")
					.style("fill", function(d, i) {
						return self.color_x_labels ? (self.coloring == "cats" ? self.colors.default[data[i].id] : (self.coloring == "scores" ? scoreColors[i] : self.coloring)) : "black"
					})
			
			if (this.simple_x) {
				g.selectAll("text")
					.style("text-anchor", "middle")
					.attr("x", 0)

			} else /*if (this.hasBenchmarking) {
				g.selectAll("text")
					.attr("transform", "translate(0,0)")
					.style("text-anchor", "middle");
			} else */{
				g.selectAll("text")
					.attr("transform", "translate(-10,0)rotate(-45)")
					.style("text-anchor", "end")
			}
			
			/*
			 * Y axis
			 */
			if (this.perc_or_abs == 'perc') {
				// If the Y values are in percentage
				var y = d3.scaleLinear()
					.domain([0, yMax])
					.range([height, 0])

				g.append("g")
					.style("font-family", "Open Sans")
					.style("font-size", "12px")
					.call(d3.axisLeft(y).ticks(5, "%"))

			} else if (this.perc_or_abs == 'abs') {

				var y = d3.scaleLinear()
					.domain([0, yMax]).nice()
					.range([height, 0])

				g.append("g")
					.style("font-family", "Open Sans")
					.style("font-size", "12px")
					.call(d3.axisLeft(y).ticks(5).tickFormat(abs_format))
					
				g.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", 0 - margin.left)
					.attr("x", 0 - (height / 2))
					.attr("dy", "1em")
					.style("text-anchor", "middle")
					.style("font-family", "Open Sans")
					.style("font-size", "12px")
					.text(this.yunit);
			}

			/*
			 * Bars
			 */
			if (this.coloring == "cats" || this.coloring == "scores") {	
				g.selectAll("mybar")
					.data(data)
					.enter()
					.append("rect")
						.attr("fill", function(d, i) { return (self.coloring == "cats" ? self.colors.default[d.id] : scoreColors[i] )})
						.attr("class", function(d) { return d.id })
						.attr("x", function(d) { return x(d.axis); })
						.attr("y", function(d) { return y(d.value); })
						.attr("width", x.bandwidth())
						.attr("height", function(d) { return height - y(d.value); })

						g.selectAll("rect")
					.on("mouseover", function() { tooltip.attr("class", "tooltip show") })
					.on("mouseout", function() { tooltip.attr("class", "tooltip") })
					.on("mousemove", function(ev, d) {
						var pointer = d3.pointer(ev)
						var xPosition = pointer[0] + margin.left;
						var yPosition = pointer[1] + margin.top + 20;
						tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
						//tooltip.select("text").text(formatFN(d.value) + " " + self.yunit);
						tooltip.select("text").text(d.value);
					});

				var tooltip = svg.append("g")
					.attr("class", "tooltip")

				tooltip.append("text")
					.attr("x", 30)
					.attr("dy", "1.2em")
					.style("text-anchor", "middle")
					.attr("font-size", "12px")

			} else {

				var indicatorLessWidth = 30
				g.selectAll("mybar")
					.data(data.filter(function(d) { return isValidValue(d.value) }))
					.enter()
					.append("rect")
						.attr("fill", this.coloring)
						.attr("x", function(d,i) { return x(d.axis); })
						.attr("y", function(d) { return y(d.value); })
						.attr("width", function(d,i) { return x.bandwidth() })
						.attr("height", function(d) { return height - y(d.value); })

				var formatFN = yMax > 10000 ? thousandsKFormat : ((self.yunit == 'min' || self.elid == 'sprayrounds') ? oneDecimalsFormat : noDecimalsFormat)

				g.selectAll("rect")
					.on("mouseover", function() { tooltip.attr("class", "tooltip show") })
					.on("mouseout", function() { tooltip.attr("class", "tooltip") })
					.on("mousemove", function(ev, d) {
						var pointer = d3.pointer(ev)
						var xPosition = pointer[0] + margin.left;
						var yPosition = pointer[1] + margin.top + 20;
						tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
						//tooltip.select("text").text(formatFN(d.value) + " " + self.yunit);
						tooltip.select("text").text(d.value);
					});

				var tooltip = svg.append("g")
					.attr("class", "tooltip")

				tooltip.append("text")
					.attr("x", 30)
					.attr("dy", "1.2em")
					.style("text-anchor", "middle")
					.attr("font-size", "12px")
			}

				var nodata = g.selectAll(".nodata")
					.data(data.filter(function(d) { return !isValidValue(d.value) }))
					.enter()
					.append('g')
				
				nodata.append("text")
					.attr("dy", "-0.5em")
					.attr("transform", function(d) { return "translate(" + (x(d.axis) + x.bandwidth()/2) + "," + height/2 + ")" })
					.style("text-anchor", "middle")
					.style("font-size", "12px")
					.style("font-family", "Open Sans")
					.attr("fill", this.coloring)
					.text('no data')

			if (this.hasBenchmarking) {
				/*
				* Points
				*/

				var formatFN = yMax > 10000 ? thousandsKFormat : ((self.yunit == 'min' || self.elid == 'sprayrounds') ? oneDecimalsFormat : noDecimalsFormat)

				var block = g.selectAll("cross")
						.data(data.filter(function(d) { return typeof d.benchValue === 'number' }))
						.enter()
						.append('g')
				
				block.append("path")
						.attr("d", d3.symbol().type(d3.symbolCircle).size(64))
						.attr("transform", function(d) { return "translate(" + (x(d.axis) + x.bandwidth()/2) + "," + (y(d.benchValue)) + ")" })

				block.append("text")
						.attr("dy", "-0.5em")
						.attr("transform", function(d) { return "translate(" + (x(d.axis) + x.bandwidth()/2) + "," + (y(d.benchValue)-5) + ")" })
						.style("text-anchor", "middle")
						.style("font-size", "12px")
						.style("font-family", "Open Sans")
						.attr("fill", "black")
						.text(function(d) { return formatFN(d.benchValue) + " " + self.yunit })
				
				/*
				 * Legend
				 */
				var legend = g.append("g")
					.attr("font-family", "Open Sans")
					.attr("font-size", '12px')
					.attr("text-anchor", "start")
				
				legend.append("g")
					.attr("transform", "translate(" + (width + 5) + ",0)")
					.append("rect")
						.attr("width", 15)
						.attr("height", 15)
						.attr("fill", this.coloring);
				
				legend.append("g")
					.attr("transform", "translate(" + (width + 12) + ",32)")
					.append("path")
						.attr("d", d3.symbol().type(d3.symbolCircle).size(64))

				legend.append("text")
						.attr("x", width + 10 + 15)
						.attr("y", 12)
						.text(this.benchmarkingLegend.main)
						.attr("font-family", "Open Sans")
				legend.append("text")
						.attr("x", width + 10 + 15)
						.attr("y", 36)
						.text(this.benchmarkingLegend.bench)
						.attr("font-family", "Open Sans")
				
			}
		}
	}
}
</script>

<template>
	<div :id="elid"></div>
</template>