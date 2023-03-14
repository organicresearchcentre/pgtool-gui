<script>
module.exports = {
  name: "autocalc",
  props: [ 'tabcustomindex', 'question', 'answerIndex' ],
	mixins: [ mixin_currentAssessment ],
	computed: {
		answer() {
			var value = this.currentAssessmentAnswers[this.question.question_code]
			if (this.question.answer_type == 'array') {
        value = value[this.answerIndex]
      }
			if ('answer_list' in this.question && value !== null) {
        var answer = this.question.answer_list.filter(obj => obj.answer_code == value)
				if (answer.length > 0) {
					value = answer[0].answer_name
				} else {
					console.log('Value ' + value + " not in " + this.question.question_code + "'s answer_list.");
					value = null
				}
			}
			if (value === null || value === undefined || value === false) {
        if ('question_placeholder' in this.question) {
					value = this.question.question_placeholder
				} else {
					return '-'
				}
      }
			if (this.question.question_code == 'npkbudget_inputsandoutputs_total') return value
			if (typeof value === 'number') {
        value = value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
			}
      var unit = 'answer_unit' in this.question ? (" " + this.question.answer_unit) : ""
      return value + unit
		}
	},
}
</script>

<template>
	<p :tabindex="tabcustomindex">{{ answer }}</p>
</template>