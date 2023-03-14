<script>
module.exports = {
  name: "date",
  props: [ 'tabcustomindex', 'question', 'answerIndex' ],
	mixins: [ mixin_currentAssessment, mixin_checkCompulsory ],
	data() {
		return {
			wasValidated: false,
		}
	},
	watch: {
		compulsory(newValue, oldValue) {
			if (oldValue === false && newValue === true) this.wasValidated = true
			if (oldValue === true && newValue === false) this.wasValidated = false
		},
    beginDate(value) {
			this.updateDates(value)
    }
  },
	mounted() {
		var self = this
		var startdate = $('#' + this.question.question_code + '_startdate')
		var enddate = $('#' + this.question.question_code + '_enddate')
		
		enddate.datepicker({ format: "dd/mm/yyyy" })
    startdate.datepicker({ format: "dd/mm/yyyy" }).on(
		"changeDate", function(e) {
			// this only catches the date input changes due to calendar manipulation
			if (!'date' in e || e.date == undefined) { return; }
			var startDate = e.date.getDate() + "/" + (+e.date.getMonth()+1) + "/" + e.date.getFullYear()
			self.updateDates(startDate)
		})
		startdate.datepicker('setDate', this.createDate(this.beginDate))
	},
	methods: {
    createEndDate(str) {
      if (str === null || str === undefined) return null;
      var dateArr = str.split('/')
      return new Date(+dateArr[2]+1, dateArr[1]-1, dateArr[0])
    },
    createDate(str) {
      if (str === null || str === undefined) return null;
      var dateArr = str.split('/')
      return new Date(dateArr[2], dateArr[1]-1, dateArr[0])
    },
		updateDates(str) {
		  var startdate = $('#' + this.question.question_code + '_startdate')
			var enddate = $('#' + this.question.question_code + '_enddate')
			if (this.currentAssessmentAnswers[this.question.question_code] != str) {
				var date = this.createDate(str)
				this.$set(this.currentAssessmentAnswers, this.question.question_code, str)
				startdate.datepicker('setDate', date)
			}
			enddate.datepicker('setDate', this.createEndDate(str))
		}
	},
	computed: {
		compulsory() {
			return this.isCompulsory(this.question, this.answerIndex)
		},
		toFocus() {
			return this.wasValidated && this.compulsory && !this.answered(this.question.question_code, this.answerIndex)
		},
		beginDate: {
			get() {
				return this.currentAssessmentAnswers[this.question.question_code]
			},
			set(newValue) {
				// needed for when v-model is triggered (e.g. selecting a previously
				// entered date, without using the calendar)
				this.updateDates(newValue)
			}
    }
	}
}
</script>

<template>
	<div>
		<div class="input-group">
			<input :id="this.question.question_code + '_startdate'" type="text" class="form-control" :class="{ glow: toFocus }" :tabindex="tabcustomindex" v-model="beginDate"/>
			<div class="input-group-append">
				<span class="input-group-text">to</span>
			</div>
			<input disabled :id="this.question.question_code + '_enddate'" type="text" class="form-control"/>
		</div>
		<small v-if="toFocus" class="form-text text-muted">Please choose a start date</small>
	</div>
</template>