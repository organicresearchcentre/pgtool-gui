<script>
module.exports = {
  name: "dropdown",
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
		question_code() {
				if ('question_connected' in this.question) {
					return this.question.question_connected
				} else {
					return this.question.question_code
				}
		},
		answer: {
			get() {
				var ans = this.currentAssessmentAnswers[this.question_code]
				return this.answerIndex >= 0 ? ans[this.answerIndex] : ans
			},
			set(newValue) {
				if (this.answerIndex >= 0) {
					this.$set(this.currentAssessmentAnswers[this.question.question_code], this.answerIndex, newValue)
					if ('question_connected' in this.question) {
						this.$set(this.currentAssessmentAnswers[this.question.question_connected], this.answerIndex, newValue)
					}
				} else {
					this.$set(this.currentAssessmentAnswers, this.question.question_code, newValue)
					if ('question_connected' in this.question) {
						this.$set(this.currentAssessmentAnswers, this.question.question_connected, newValue)
					}
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
		<select :tabindex="tabcustomindex" class="form-control" v-model="answer" :disabled="disabled || question.auto_calc" :class="{ glow: toFocus }">
			<option value=null>{{ question.question_placeholder }}</option>
			<option v-for="answer_element in question.answer_list" :value="answer_element.answer_code" :key="answer_element.answer_code">{{ answer_element.answer_name }}</option>
		</select>
		<small v-if="toFocus" class="form-text text-muted">This needs to be answered</small>
	</div>
</template>