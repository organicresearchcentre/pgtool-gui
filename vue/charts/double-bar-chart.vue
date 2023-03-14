<script>
module.exports = {
	name: "double-bar-chart",
	props: [
		'elid', // category-chart
		'chartdata' // [ { id: category_code, axis: categoryAxisName, value: value, indicators: [ { axis: indicatorAxisName, value: value }, { axis: indicatorAxisName, value: value } ]}, { axis: categoryAxisName, value: value } ]
		],
	data() {
		return {
			margin: {
					top: 30,
					right: 15,
					bottom: 15,
					left: 400,
				},
			width0: 600,
			height0: 650,
			barPadding: 5,
		}
	},
	mounted() {
		this.addChart();
	},
	watch: {
		chartdata(value) {
			this.addChart();
		}
	},
	methods: {
		addChart() {
			var self = this;
			var width = this.width0 - this.margin.left - this.margin.right
			var height = this.height0 - this.margin.top - this.margin.bottom
			var margin = this.margin
			var barPadding = this.barPadding
			var x_translate = 200 - this.margin.left
			var colors =
				[ '#649B35', '#22586A', '#FFA500', '#998888', '#502419', '#8EB1C7',
				'#649B35', '#22586A', '#FFA500', '#998888', '#502419', '#8EB1C7' ]

			d3.select("#" + this.elid + " > *").remove()

			var svg = d3
				.select("#" + this.elid)
				.append("svg")
				//.attr("viewBox", "0 0 " + this.width0 + " " + this.height0)
				
					.attr("width", this.width0)
					.attr("height", this.height0)
				//.attr("preserveAspectRatio", "xMidYMid meet")
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var data = this.chartdata.filter(category => category.indicators.length != 0)
			var rangeBands = [];
			var cummulative = 0;
			data.forEach(function(val, i) {
				val.cummulative = cummulative;
				val.nr = i
				cummulative += val.indicators.length;
				val.indicators.forEach(function(values) {
					values.parentId = val.id;
					values.parentKey = val.axis;
					values.parentNr = i
					rangeBands.push(i);
				})
			});

			var x = d3.scaleLinear().range([0, width]).domain([0, 5]);

			var y_category = d3.scaleLinear().range([height, 0])

			var y_indicator = d3
				.scaleBand()
				.range([height, 0])
				.domain(rangeBands);

			var y_category_domain = y_indicator.bandwidth() * rangeBands.length;
			y_category.domain([y_category_domain, 0]);

			//make y axis to show bar names
			var yAxis = d3
				.axisLeft()
				.scale(y_category)
				//no tick marks
				.tickValues([]);

			var xAxis = d3
				.axisTop()
				.scale(x)
				.ticks(5);

			var gy = svg.append("g").attr("class", "y axis").call(yAxis);
			var gx = svg.append("g")
				.attr("font-family", "Open Sans")
				.attr("class", "x axis")
				.call(xAxis);

			var category_g = svg.selectAll(".category")
				.data(data)
				.enter().append("g")
				.attr("font-size", "10px")
				.attr("font-family", "Open Sans")
				.attr("transform", function(d) {
					return "translate(0," + y_category((d.cummulative * y_indicator.bandwidth())) + ")";
				})
			
			var category_label = category_g.selectAll(".category-label")
				.data(function(d) { return [d]; })
				.enter().append("text")
				.attr("class", 'category-label font-weight-bold') // category-label-' + d.key;
				.attr("transform", function(d) {
					var y_label = y_category((d.indicators.length * y_indicator.bandwidth() + barPadding) / 2);
					var x_label = x_translate
					return "translate(" + x_label + "," + y_label + ")";
				})
				.text(function(d) { return d.axis; })
				//.style("fill", function(d) { return self.colors.default[d.id] })
				.style("fill", function(d) { return colors[d.nr] })
				.attr('text-anchor', 'end')
			
			var indicator_g = category_g.selectAll(".indicator")
				.data(function(d) { return d.indicators; })
				.enter().append("g")
				.attr("font-size", "10px")
				.attr("font-family", "Open Sans")
				.attr("transform", function(d, i) {
					return "translate(0," + y_category((i * y_indicator.bandwidth())) + ")";
				});

			var indicator_label = indicator_g.selectAll(".indicator-label")
				.data(function(d) {
					return [d];
				})
				.enter().append("text")
				.attr("class", 'indicator-label')
				.attr("transform", function(d) {
					var y_label = y_category((y_indicator.bandwidth() + barPadding + margin.top) / 2);
					var x_label = -10
					return "translate(" + x_label + "," + y_label + ")";
				})
				.text(function(d) { return d.axis; })
				//.style("fill", function(d) { return self.colors.default[d.parentId] })
				.style("fill", function(d) { return colors[d.parentNr] })
				.attr('text-anchor', 'end');
			
			var rects = indicator_g.selectAll('.rect')
				.data(function(d) {
					return [d];
				})
				.enter().append("rect")
				.attr("class", "rect")
				//.style("fill", function(d, i) { return self.colors.default[d.parentId] })
				.style("fill", function(d) { return colors[d.parentNr] })
				.attr("height", y_category(y_indicator.bandwidth() - barPadding))
				.attr("y", function(d) {
					return y_category(barPadding);
				})
				.attr("x", function(d) {
					return x(0)+2;
				})
				.attr("width", function(d) {
					return x(d.value);//width - x(d.value);
				});

			indicator_g
				.append("text")
				.attr("class", "label")
				.attr("fill", "white")
				.attr("text-anchor", "end")
				.attr("transform", function(d) {
					var y_label = y_category((y_indicator.bandwidth() + barPadding + margin.top - 2) / 2);
					var x_label = x(d.value) - 4
					return "translate(" + x_label + "," + y_label + ")";
				})
				/*.text(function (d) {
					return d3.format(".0%")(d.value);
				})*/
				.text(function(d) { return d.value })
				.call((text) =>
					text
						.filter(function(d) { return x(d.value) - x(0) < 30; }) // short bars
						.attr("dx", 8)
						.attr("fill", "black")
						.attr("text-anchor", "start")
				)
		}
	}
}
</script>

<template>
	<div :id="elid"></div>
</template>