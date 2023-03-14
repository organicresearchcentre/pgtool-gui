<script>
module.exports = {
  name: "checkbox",
  props: [ 'tabcustomindex', 'question', 'answerIndex', 'disabled' ],
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
		}
	},
	computed: {
		value: {
			get() {
				var answer = this.currentAssessmentAnswers[this.question.question_code]
				return this.answerIndex >= 0 ? answer[this.answerIndex] : answer
			},
			set(newValue) {
				if (this.answerIndex >= 0) {
					this.$set(this.currentAssessmentAnswers[this.question.question_code], this.answerIndex, newValue)
				} else {
					this.$set(this.currentAssessmentAnswers, this.question.question_code, newValue)
				}
			}
		},
		compulsory() {
			return this.isCompulsory(this.question, this.answerIndex)
		},
		toFocus() {
			return this.wasValidated && this.compulsory && !this.answered(this.question.question_code, this.answerIndex)
		}
	}
}
</script>

<template>
	<div :class="{ glow: toFocus }">
		<div class="form-check ml-2">
			<div v-for="answer_element in question.answer_list" :key="answer_element.answer_code">
				<input class="form-check-input" type="checkbox"
					:disabled="disabled"
					:tabindex="tabcustomindex" 
					:value ="answer_element.answer_code"
					v-model="value">
				<label class="form-check-label">{{ answer_element.answer_name }}</label>
			</div>
			<small v-if="toFocus" class="form-text text-muted pb-2">Please choose at least one option</small>
		</div>
	</div>
</template>