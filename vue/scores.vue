<script>
module.exports = {
	name: "scores",
	mixins: [ mixin_scroll, mixin_getQuestion, mixin_currentAssessment, mixin_checkCompulsory ],
	data() {
		return {
			scores: {},
			isDownloading: false,
			showAllCharts: false
		};
	},
	mounted() {
		var self = this;
		this.setCharts();
		
		VueBus.$on("updatedScores", function () {
			self.setCharts()
		});
		VueBus.$on("tabChange", function () {
			self.setCharts()
		});
		VueBus.$on("updateData", function () {
			self.setCharts()
		});
	},
	beforeRouteEnter(to, from, next) {
		// https://router.vuejs.org/guide/advanced/navigation-guards.html#in-component-guards
		next(function (this_) {
			this_.setCharts()
		});
	},
	watch: {
		showAllCharts: function(toShow) {
			if (toShow) {
				this.hoverMessage()
				$('.collapse').collapse('show')
			} else {
				$('.collapse').collapse('hide')
			}
		},
		currentAssessmentID: function() {
			this.setCharts()
		}
	},
	methods: {
		hoverMessage() {
			$('.ring-button').addClass('show')
			setTimeout(function() { $('.ring-button').removeClass('show') }, 4000)
		},
		filename() {
			var filename = ""
			var farmname = this.currentAssessmentAnswers.initialdata_farminfo_farmname
			var assessmentName = this.$root.pgtoolAssessmentsNames[this.currentAssessmentID]
			if (farmname) {
					filename += farmname + "_"
			}
			if (assessmentName) {
					filename += assessmentName
			}
			return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		},
		showCategory(category_code) {
			return this.toShow(this.form.categories[category_code])
		},
		showIndicator(category_code, indicator_code) {
			return this.toShow(this.form.categories[category_code].indicators[indicator_code])
		},
		startDownload() {
			var self = this
			this.isDownloading = true
			setTimeout(function() {
				window.print()
				self.isDownloading = false
			}, 1000)
		},
		setCharts() {
			this.setScores()
		},
		setScores() {
			var currentScores = this.currentAssessmentScores
			function getScore(element) {
				if (currentScores && currentScores[element]) {
					return currentScores[element]
				} else {
					return 0
				}				
			}
			var tempscores = {}
			for (category_code of this.categories) {
				if (category_code == 'initialdata') continue;
				if (!this.showCategory(category_code)) continue;
				var cat = this.form.categories[category_code]
				var obj = {
					axis: cat.title,
					id: category_code,
					value: getScore(category_code),
					indicators: []
				}
				for (indicator_code in cat.indicators) {
					if (!this.showIndicator(category_code, indicator_code)) continue;
					if (['npkbudget_inputsandoutputs'].includes(indicator_code)) continue;
					var ind = cat.indicators[indicator_code]
					var title = ind.title
					if (indicator_code == 'water_protection') {
						title = "Reducing pollution"
					} else if (indicator_code == 'socialcapital_csr') {
						title = "CSR initiatives and accreditations"
					} else if (indicator_code == 'soilmanagement_measureserosion') {
						title = "Measures to reduce erosion"
					}
					obj.indicators.push({ axis: title, value: getScore(indicator_code) })
				}
				tempscores[category_code] = obj
			}
			this.scores = tempscores
		},
		setDataForStackedBar(x_items, y_variable, y_variable_other, simplify = function(name){ return name;}) {
			var y_items = this.getValue(y_variable)
			var obj = {}
			var keys = {}
			var y_question = this.getQuestion(y_variable)
			var y_question_other = this.getQuestion(y_variable_other)
			for (let i = 0; i < x_items.length; i++) {
				var x_variable = x_items[i]
				var x_question = this.getQuestion(x_variable)
				var column = {
					axis: x_variable,
					axis_name: x_question.question_name,
					unit: x_question.answer_unit
				}
				var total = 0
				for (let j = 0; j < y_items.length; j++) {
					var elemID = y_items[j]
					if (elemID === null || elemID === undefined || elemID === "" || elemID === "null") {
						continue;
					}
					var other_elemIDs = y_question_other.compulsoryIf[0].value
					var name = simplify(y_question.answer_list.filter(answer => answer.answer_code == elemID)[0].answer_name)

					if (other_elemIDs.includes(elemID)) {
						elemID = elemID + "_" + j
						var name = this.getValue(y_variable_other, j);
					}

					if (i == 0) { // add each key only once
						keys[elemID] = name
					}

					var value = this.getValue(x_variable, j)
					total += value
					column[elemID] = value
				}
				column.total = total
				obj[x_variable] = column
			}
			obj.keys = keys
			return obj
		},
		toString(value, decimals = 2) {
			if (value || value === 0) {
				return value.toLocaleString('en-GB', { maximumFractionDigits: decimals })
			} else {
				return 'no data'
			}
		},
		getValue(question_code, i) {
			var value = this.currentAssessmentAnswers[question_code]
			if (i >= 0) {
				value = value[i]
			}
			if (value == null || value == false) return 0
			return value
		},
		sumArray(arr){ //ignore the undefined and nulls
			const sum = arr.reduce((acc, val) => {
					return acc + (val || 0);
				}, 0);
				return sum;
		},
	},
	computed: {
		runnedScenario() {
			var scenarioID = 0
			if (this.$root.$refs && this.$root.$refs.tab) {
        scenarioID = this.$root.$refs.tab.currentTab
      }
			return this.$root.pgtoolRunnedScenario[scenarioID]
		},
		currentDate() {
			var str = this.currentAssessmentAnswers.initialdata_farminfo_dates
			if (str === null || str === "" || str === undefined) return null
			var dateArr = str.split('/')
      return new Date(dateArr[2], dateArr[1]-1, dateArr[0])
		},
		ownership() {
			var anscode = this.currentAssessmentAnswers['initialdata_farminfo_ownership']
			if (anscode === null || anscode === "" || anscode === undefined) return null
			return this.form.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_ownership.answer_list[anscode].answer_name
		},
		soil() {
			var anscode = this.currentAssessmentAnswers['initialdata_farminfo_soiltype']
			if (anscode === null || anscode === "" || anscode === undefined) return null
			return this.form.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_soiltype.answer_list[anscode].answer_name
		},
		agrienvironmentalscheme() {
			var anscode = this.currentAssessmentAnswers['initialdata_farminfo_agrienvscheme']
			if (anscode === null || anscode === "" || anscode === undefined) return null
			return this.form.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_agrienvscheme.answer_list[anscode].answer_name
		},
		lessfavouredarea() {
			var anscode = this.currentAssessmentAnswers['initialdata_farminfo_lessfavouredarea']
			if (anscode === null || anscode === "" || anscode === undefined) return null
			return this.form.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_lessfavouredarea.answer_list[anscode].answer_name
		},
		uaa() {
			var answer = this.currentAssessmentAnswers['initialdata_landuse_totalUAA']
			if (answer === null || answer === "" || answer === undefined) return null
			return answer
		},
		colors() {
			// from helper.js
			return colors
		},
		categories() {
			return Object.keys(this.form.categories)
		},
		form() {
			return this.$root.pgtoolForm;
		},
		farminfo_dates() {
			var date = this.currentAssessmentAnswers['initialdata_farminfo_dates']
			if (date) {
				var year = date.getFullYear()
				var month = date.toLocaleString('en-GB', { month: 'short' })
				return ", assessment period from " + month + " " + year + " to " + month + " " + parseInt(year+1)
			} else {
				return false
			}
		},
		hasCrops() {
			return this.answered('initialdata_crops_cropname')
		},
		hasForage() {
			return this.answered('initialdata_crops_foragecropname')
		},
		hasPP() {
			return this.answered('initialdata_crops_permanentpasturename')
		},
		hasLivestock() {
			return this.answered('initialdata_livestock_type')
		},
		hasLivestockProd() {
			return this.answered('initialdata_livestock_producttype')
		},
		hasLandLeftBare() {
			return this.answered('soil_structure_barearableland') && this.currentAssessmentAnswers.soil_structure_barearableland !== 0 /* answer code for N/A */
		},
		hasCroppedArableLand() {
			return this.answered('soil_structure_harvestedbeforewinter') && this.currentAssessmentAnswers.soil_structure_harvestedbeforewinter !== 0 /* answer code for N/A */
		},
		hasUAA() {
			return this.answered('initialdata_landuse_totalUAA') && this.currentAssessmentAnswers.initialdata_landuse_totalUAA > 0
		},
		hasActiveIngredients() {
			return this.hasCrops && this.answered('crop_pestdiseasecontrol_activeingredient')
		}
	}
};
</script>

<template>	 
	<div class="container my-4" id="scores">
		<div v-if="!runnedScenario">
			<h3 class="title text-center">Fill in the previous sections and click on the corresponding "Update Score" button to have a look at the detailed scores.</h3>
		</div>
		<div v-else>
			<div class="section">
				<button class="update-button d-print-none" @click='startDownload()'>
					<span v-if="isDownloading">Printing... <i class="fa fa-circle-o-notch fa-spin"></i></span>
					<span v-else>Print report</span>
				</button>
			</div>
			<div class="row text-center text-uppercase">
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-right.svg" />
				</div>
				<div class="col-sm-4 line"><h2>Farm Identification</h2></div>
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-left.svg" />
				</div>
			</div>

			<div class="row my-4" id="scores-identification">
				<div class="col-sm-5 offset-sm-1 text-right"><b>Farm name</b></div>
				<div class="col-sm-6"><span v-if="currentAssessmentAnswers.initialdata_farminfo_farmname">{{currentAssessmentAnswers.initialdata_farminfo_farmname}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Assessment period</b></div>
				<div class="col-sm-6"><span v-if="currentDate">From {{ currentDate.toLocaleString('default', { month: 'short' })}} {{currentDate.getFullYear()}} to {{currentDate.toLocaleString('default', { month: 'short' })}} {{currentDate.getFullYear()+1}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Ownership</b></div>
				<div class="col-sm-6"><span v-if="ownership">{{ownership}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Soil type</b></div>
				<div class="col-sm-6"><span v-if="soil">{{soil}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Rainfall</b></div>
				<div class="col-sm-6"><span v-if="currentAssessmentAnswers.initialdata_farminfo_rainfall">{{currentAssessmentAnswers.initialdata_farminfo_rainfall}} mm</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Altitude</b></div>
				<div class="col-sm-6"><span v-if="currentAssessmentAnswers.initialdata_farminfo_altitude">{{currentAssessmentAnswers.initialdata_farminfo_altitude}} m.a.s.l.</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>Level of agri-environmental scheme</b></div>
				<div class="col-sm-6"><span v-if="agrienvironmentalscheme">{{agrienvironmentalscheme}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>More than 50% land in less favoured area?</b></div>
				<div class="col-sm-6"><span v-if="lessfavouredarea">{{lessfavouredarea}}</span><span v-else>-</span></div>
				<div class="col-sm-5 offset-sm-1 text-right"><b>UAA</b></div>
				<div class="col-sm-6"><span v-if="uaa">{{uaa}} ha</span><span v-else>-</span></div>
			</div>
			
			<div class="row text-center text-uppercase">
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-right.svg" />
				</div>
				<div class="col-sm-4 line"><h2>Final Score</h2></div>
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-left.svg" />
				</div>
			</div>
			<div class="row text-center mb-4">
				<div class="col-sm"><radar-chart elid="radar_chart" :chartdata="[Object.values(scores)]"></radar-chart></div>
			</div>

			<div class="row text-center text-uppercase">
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-right.svg" />
				</div>
				<div class="col-sm-4 line"><h2>Category Scores</h2></div>
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-left.svg" />
				</div>
			</div>
			<div class="row text-center">
			<div class="col-sm"><vert-bar-chart coloring="scores" elid="category_chart" perc_or_abs="abs" :chartdata="Object.values(scores)" :ymax="5" yunit="" :color_x_labels="true"></vert-bar-chart></div>
			</div>

			<div class="row text-center text-uppercase">
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-right.svg" />
				</div>
				<div class="col-sm-4 line"><h2>Sub-category Scores</h2></div>
				<div class="col-sm-4 line">
					<img class="img-responsive" src="img/hand-line-left.svg" />
				</div>
			</div>
			<div class="row my-4 text-center">
				<div class="col-sm-2"></div>
			<div class="col-sm-8"><double-bar-chart elid="indicator_chart" :chartdata="Object.values(scores)"></double-bar-chart></div>
				<div class="col-sm-2"></div>
			</div>
			
		</div>
	</div>
</template>
