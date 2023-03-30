<script>
module.exports = {
  name: "input-number",
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
		},
		answer(newValue, oldValue) {
			if (this.max && newValue > this.max) this.answer = this.max
		}
	},
	methods: {
		getDatasetElement() {
			var cat = 'initialdata'
			var ind = 'initialdata_crops'
			var qcode = 'initialdata_crops_cropname'
			if (this.question.question_code.includes('livestockprod') || this.question.question_code.includes('livestock_product')) {
				cat = 'initialdata'
				ind = 'initialdata_livestock'
				qcode = 'initialdata_livestock_producttype'
			} else if (this.question.question_code.includes('livestock')) {
				cat = 'initialdata'
				ind = 'initialdata_livestock'
				qcode = 'initialdata_livestock_type'
			} else if (this.question.question_code.includes('ownfuelamount')) {
				cat = 'energycarbon'
				ind = 'energycarbon_fueluse'
				qcode = 'energycarbon_fueluse_ownfueltype'
			} else if (this.question.question_code.includes('contractoramount')) {
				cat = 'energycarbon'
				ind = 'energycarbon_fueluse'
				qcode = 'energycarbon_fueluse_contractortype'
			}
			var answer = this.currentAssessmentAnswers[qcode][this.answerIndex]
			if (answer !== null && answer !== undefined && answer !== "" && answer !== "null") {
				return this.$root.pgtoolForm.categories[cat].indicators[ind].questions[qcode].answer_list.filter(function(el) { return el.answer_code == answer })[0]
			} else {
				return false
			}
		},
	},
	computed: {
		answer: {
			get() {
				var ans = this.currentAssessmentAnswers[this.question.question_code]
				var value = this.answerIndex >= 0 ? ans[this.answerIndex] : ans
				return (typeof value == 'number' && this.question.auto_calc) ? value.toFixed(2) : value
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
		},
		min() {
      if (this.question.answer_limits) {
        return this.question.answer_limits.min
      }
      return null
    },
    max() {
      if (this.question.answer_limits) {
        return this.question.answer_limits.max
      }
      return null
    },
		hasAnswerUnits() {
			if (!this.toShowUnits) {
				return 'answer_unit' in this.question ? this.question.answer_unit : null
			}
		},
		toShowUnits() {
			var qcodes = [ 'initialdata_livestock_productimport', 'initialdata_livestock_productexport', 'energycarbon_fueluse_ownfuelamount', 'energycarbon_fueluse_contractoramount' ]
			return qcodes.includes(this.question.question_code)
		},
		getUnits() {
      var element = this.getDatasetElement()
			return element ? element.answer_unit : null
    },
		showInputAppend() {
			return (this.toShowUnits && this.getUnits) || this.hasAnswerUnits
		},
		units() {
			return this.toShowUnits ? this.getUnits : this.hasAnswerUnits
		},
		step() {
			if (this.hasAnswerUnits) {
				if (["ha", "t/ha", "t/km", "£/l", "£/kg lw", "£/kg dw", "£/head", "£/dozen", "£/t"].includes(this.units)) {
					return "0.1"
				}
			}
		},
		isNPK() {
			return [ 'initialdata_fertilisers_organicn', 'initialdata_fertilisers_organicp', 'initialdata_fertilisers_organick', 'initialdata_fertilisers_inorganicn', 'initialdata_fertilisers_inorganicp', 'initialdata_fertilisers_inorganick' ].includes(this.question.question_code)
		}
	}
}
</script>

<template>
	<div>
		<div :class="{'input-group': showInputAppend }">
			<input type="number" :tabindex="tabcustomindex" :min="min" :step="step" class="form-control" :class="{ glow: toFocus && !disabled }" :placeholder="question.question_placeholder" v-model.number="answer" :disabled="disabled || (isNPK && !compulsory) || question.auto_calc">
			<div v-if="showInputAppend" class="input-group-append">
				<span class="input-group-text" id="basic-addon2">{{ units }}</span>
			</div>
		</div>
		<small v-if="toFocus && !disabled" class="form-text text-muted">This needs to be answered</small>
	</div>
</template>