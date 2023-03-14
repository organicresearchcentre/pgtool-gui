<script>
module.exports = {
  name: "input-text",
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
	<div>
		<input type="text" :tabindex="tabcustomindex" class="form-control" :class="{ glow: toFocus }"  :placeholder="question.question_placeholder" v-model.trim="answer" :disabled="disabled || (question.toSpecifyWhich && !compulsory) || question.auto_calc">
		<small v-if="toFocus" class="form-text text-muted">This needs to be answered</small>
	</div>
</template>