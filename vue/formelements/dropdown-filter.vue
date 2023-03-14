<script>
module.exports = {
  name: "dropdown-filter",
  props: [ 'tabcustomindex', 'question', 'answerIndex', 'disabled' ],
	mixins: [ mixin_currentAssessment, mixin_checkCompulsory ],
	data() {
		return {
			wasValidated: false,
		}
	},
	mounted() {
		var self = this;

		$(this.selectpickerID).selectpicker({ container: '#crop', noneSelectedText: this.question.question_placeholder, liveSearch: true });

		this.$watch('currentAssessmentAnswers.' + this.question.question_code, function() {
			self.updateValue()
		}, { deep: true });
	},
	watch: {
		compulsory(newValue, oldValue) {
			if (oldValue === false && newValue === true) this.wasValidated = true
			if (oldValue === true && newValue === false) this.wasValidated = false
		}
	},
	methods: {
		updateValue() {
			var value = this.currentAssessmentAnswers[this.question.question_code][this.answerIndex]
			$(this.selectpickerID).selectpicker('val', value);
		}
	},
	computed: {
		selectpickerID() {
			return '#' + this.question_code + '_' + this.answerIndex + ' .selectpicker'
		},
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
		<div :class="{ glow: toFocus }" :id="question_code + '_' + answerIndex">
			<select :tabindex="tabcustomindex" class="form-control selectpicker" v-model="answer" :disabled="disabled || question.auto_calc">
				<option value=null>{{ question.question_placeholder }}</option>
				<option v-for="answer_element in question.answer_list" :value="answer_element.answer_code" :key="answer_element.answer_code">{{ answer_element.answer_name }}</option>
			</select>
		</div>
		<small v-if="toFocus" class="form-text text-muted">This needs to be answered</small>
	</div>
</template>