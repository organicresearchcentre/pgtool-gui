<script>
module.exports = {
  name: "radio",
  props: [ 'tabcustomindex', 'question', 'answerIndex', 'centerText', 'disabled' ],
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
		answer: {
			get() {
				var ans = this.currentAssessmentAnswers[this.question.question_code]
				return this.answerIndex >= 0 ? ans[this.answerIndex] : ans
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
	<div :class="{ glow: toFocus, 'pb-2': toFocus, 'text-center': centerText }">
		<div class="form-check form-check-inline" :class="{ 'ml-2': !centerText }" v-for="answer_element in question.answer_list" :key="answer_element.answer_code">
			<input class="form-check-input" type="radio"
				:disabled="disabled"
				:tabindex="tabcustomindex" 
				:value ="answer_element.answer_code"
				v-model="answer">
			<label class="form-check-label">{{ answer_element.answer_name }}</label>
		</div>
		<small v-if="toFocus" :class="{ 'ml-2': !centerText }" class="form-text text-muted">Please choose an option</small>
	</div>
</template>