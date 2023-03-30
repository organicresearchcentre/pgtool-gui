<script>
module.exports = {
  name: "formgroup",
  props: [ "categoryCode", "indicatorCode", "questionGroup", 'showQuestionGroup', 'masterIndex'],
	mixins: [ mixin_getQuestion, mixin_currentAssessment, mixin_checkCompulsory, mixin_setInitialValues ],
  data() {
		return {
			nrCols: 0,
			nrRows: 0,
			table: [],
			hasArrays: false,
			main_question_code: null
		}
	},
	mounted() {
		var self = this
		this.prepareTable()

		VueBus.$on('updateData', function() {
			self.prepareTable()
		})
	},
	watch: {
		currentAssessmentAnswers: {
      handler() { this.prepareTable() },
      deep: true
    },
		currentAssessmentScores: {
			handler() { this.prepareTable() },
      deep: true
		},
		nrCols(newValue) {
			if (newValue > 4) {
        VueBus.$emit('enlarge', this.questionGroup.question_group)
			}
		}
	},
	methods: {
		prepareTooltips() {
			$('[data-toggle="tooltip"]').each(function() {
					$(this).tooltip({
					template: '<div class="tooltip menu-tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
					container: '#app'
					})
			})
		},
		prepareTable() {			
			// reset table lengths
			this.nrCols = 0
			this.nrRows = 0
			
			// calculate number of rows and columns
			if (this.isTableHeadersTop || this.isTable) this.nrCols = this.questions[0].length
			if (this.isTableHeadersLeft || this.isTable) this.nrRows = this.questions.length
			
			if (this.isTableHeadersLeft) {
				// elements of first row dictate the total number of columns
				var row = 0
				for (var col = 0; col < this.questions[row].length; col++) {
					var question_code = this.questions[row][col]
					this.nrCols += this.getLength(question_code)
				}
				this.main_question_code = this.questions[row][0]
			}

			if (this.isTableHeadersTop) {
				// elements of first column dictate the total number of rows
				var col = 0
				for (var row = 0; row < this.questions.length; row++) {
					var question_code = this.questions[row][col]
					this.nrRows += this.getLength(question_code)
				}
				this.main_question_code = this.questions[0][col]
			}

			// account for headers
			if (this.hasRowsHeaders) this.nrCols++
			if (this.hasColumnsHeaders) this.nrRows++
			
			// create an empty table and fill it
			this.fillTable(Array(this.nrRows).fill(null).map(()=>Array(this.nrCols).fill(null)))
			this.prepareTooltips()
		},
		fillTable(table) {
			// add headers
			var col = 0
			for (var row = 0; row < table.length; row++) {
				if (this.isHeader(row, col)) {
					table[row][col] = this.getHeader(row, col)
				}
			}
			var row = 0
			for (var col = 0; col < table[row].length; col++) {
				if (this.isHeader(row, col)) {
					table[row][col] = this.getHeader(row, col)
				}
			}

			var currentTableRow = this.hasColumnsHeaders ? 1 : 0
			var currentTableCol = this.hasRowsHeaders ? 1 : 0
			var startArrayRow = currentTableRow
			
			for (var row = 0; row < this.questions.length; row++) {
				for (var col = 0; col < this.questions[row].length; col++) {
					var question_code = this.questions[row][col]
					if (question_code !== null) {
						var question = Object.assign({question_code: question_code}, this.getQuestion(question_code))
						var answer = this.currentAssessmentAnswers[question_code]
						if (question.answer_type === 'array') {
							this.hasArrays = true
							if (this.isTableHeadersTop) currentTableRow = startArrayRow
							for (var i = 0; i < answer.length; i++) {
								table[currentTableRow][currentTableCol] = { question: question, index: i }
								if (this.isTableHeadersTop) currentTableRow++
								if (this.isTableHeadersLeft) currentTableCol++
							}
						} else {
							table[currentTableRow][currentTableCol] = { question: question }
						}
					}
					currentTableCol++
				}
				if (this.isTableHeadersTop) {
					startArrayRow = currentTableRow
				} else {
					currentTableRow++
				}
				currentTableCol = this.hasRowsHeaders ? 1 : 0
			}
			this.table = table
		},
		getLength(question_code) {
			var question = this.getQuestion(question_code)
			if (question.answer_type === 'array') {
				return this.currentAssessmentAnswers[question_code].length
			}
			return 1			
		},
		isHeader(row, col) {
			return this.isTableHeadersTop && row == 0 || this.isTableHeadersLeft && col == 0 || this.isTable && row == 0 && this.hasCustomColumnsHeaders || this.isTable && col == 0 && this.hasCustomRowsHeaders
		},
		getHeader(row, col) {
			if (this.hasColumnsHeaders && this.hasRowsHeaders && row == 0 && col == 0) {
				return { isHeader: true, text: null }
			}
			if (row == 0) {
				if (this.hasColumnsHeaders && this.hasRowsHeaders) col--
				if (this.hasCustomColumnsHeaders) {
					var text = this.questionGroup.question_group_headers.columns[col]
					if (text.includes('specialist channels')) {
						return { isHeader: true, text: text, guidance: this.form.categories.productivity.indicators.productivity_financial.questions.productivity_financial_volumesoldspecialistcrops.guidance }
					} else {
						return { isHeader: true, text: text }
					}
				} else if (this.isTableHeadersTop) {
					return { isHeader: true, question: this.getQuestion(this.questions[row][col]) }
				}
			}
			if (col == 0) {
				if (this.hasColumnsHeaders && this.hasRowsHeaders) row--
				if (this.hasCustomRowsHeaders) {
					var text = this.questionGroup.question_group_headers.rows[row]
					return { isHeader: true, text: text }
				} else if (this.isTableHeadersLeft) {
					return { isHeader: true, question: this.getQuestion(this.questions[row][col]) }
				}
			}
		},
		whichTabindex(rowIdx, colIdx) {
			return this.isTableHeadersLeft ? "" + this.masterIndex + colIdx + rowIdx : 0
		},
		removeRow(rowIdx) {
			if ((this.isTableHeadersTop && this.table.length == 2) || (this.isTableHeadersLeft && this.table[0].length == 2)) {
				VueBus.$emit('clearRow', this.main_question_code, rowIdx)
			} else {
				VueBus.$emit('removeRow', this.main_question_code, rowIdx)
			}
		},
		addRow() {
			VueBus.$emit('addRow', this.main_question_code)
		},
    isDisabled(qcode) {
			if (qcode === null) return false
      return this.categoryOf(qcode) !== this.categoryCode || this.indicatorOf(qcode) !== this.indicatorCode
    },
		qcodesToFillFirst() {
			var self = this
			var qcodes = []
			this.questions.flat().forEach(function(qcode) {
				if (qcode !== null) {
					var question = self.getQuestion(qcode)
					if ('question_ascendancies' in question) {
						qcodes = qcodes.concat(question.question_ascendancies)
					} else {
						if (self.isDisabled(qcode)) {
							qcodes.push(qcode)
						}
					}
				}
			})
			
			return [...new Set(qcodes)];
		}
	},
	computed: {
		questions() {
			return this.questionGroup.question_codes
		},
    isTable() {
      return this.questionGroup.question_group_type == 'table'
    },
    isTableHeadersLeft() {
      return this.questionGroup.question_group_type == 'table_headers_left'
    },
    isTableHeadersTop() {
      return this.questionGroup.question_group_type == 'table_headers_top'
    },
		hasRowsHeaders() {
			return this.hasCustomRowsHeaders || this.isTableHeadersLeft
		},
		hasColumnsHeaders() {
			return this.hasCustomColumnsHeaders || this.isTableHeadersTop
		},
		hasCustomRowsHeaders() {
			return 'question_group_headers' in this.questionGroup && 'rows' in this.questionGroup.question_group_headers
		},
		hasCustomColumnsHeaders() {
			return 'question_group_headers' in this.questionGroup && 'columns' in this.questionGroup.question_group_headers
		},
		filteredTable() {
			if (this.hasColumnsHeaders){
				return this.table.filter((element, index) => index > 0)
			} else {
				return this.table
			}
		},
    isManageable() {
      return this.hasArrays && this.categoryOf(this.main_question_code) === this.categoryCode
    }
	}
}
</script>

<template>
	<div class="table-responsive">
		<div v-if="questionGroup.title">
			<p>
				<strong>{{questionGroup.title}}</strong>
				<guidance v-if="'guidance' in questionGroup" :question="questionGroup"></guidance>
			</p>
		</div>
		<heading :heading="questionGroup.heading">
			<guidance v-if="!questionGroup.title && 'guidance' in questionGroup" :question="questionGroup"></guidance>
		</heading>
		<helper v-if="questionGroup.helper" :helper="questionGroup.helper" :code="questionGroup.question_group"></helper>
		<helper-fillfirst :pairs="qcodesToFillFirst()"></helper-fillfirst>

		<table class="table table-sm table-hover mt-4">

			<thead v-if="hasColumnsHeaders">
				<tr>
					<!-- COLUMNS HEADERS -->
					<th class="text-center" :class="{ minw200: (questionGroup.question_group == 'npkbudget_nutrientbalance_farmgatebudget' && colIdx > 0) || questionGroup.question_group != 'npkbudget_nutrientbalance_farmgatebudget' }" scope="col" v-for="(headerCell, colIdx) in table[0]" :key="'header-' + colIdx">
						<span v-if="headerCell && 'text' in headerCell">{{headerCell.text}} <guidance v-if="'guidance' in headerCell" :question="headerCell"></guidance></span>
						<span v-if="headerCell && 'question' in headerCell">
							<span :id="headerCell.question.number" class="numbering">{{headerCell.question.number}}</span>
							{{headerCell.question.question_name}}
							<span class="compulsory" data-toggle="tooltip" data-placement="top" title="Compulsory question" v-if="'compulsory' in headerCell.question && isCompulsory(headerCell.question)"> *</span>
							<guidance v-if="'guidance' in headerCell.question" :question="headerCell.question"></guidance>
						</span>
					</th>
				</tr>
			</thead>
			
			<tbody>
				<template v-for="(tableRow, rowIdx) in filteredTable">
					<tr :key="'row-' + rowIdx">

						<template v-for="(cell, colIdx) in tableRow">

							<!-- ROWS HEADERS -->
							<th v-if="cell && cell.isHeader" :class="{ minw200: (questionGroup.question_group == 'npkbudget_nutrientbalance_farmgatebudget' && colIdx > 0) || questionGroup.question_group != 'npkbudget_nutrientbalance_farmgatebudget', maxhalf: nrCols == 2 }" scope="row"  :key="'cell-' + rowIdx + colIdx">
								<span v-if="'text' in cell">{{cell.text}} <guidance v-if="'guidance' in cell" :question="cell"></guidance></span>
								<template v-if="'question' in cell">
									<span :id="cell.question.number" class="numbering">{{cell.question.number}}</span>
									{{cell.question.question_name}}
									<span class="compulsory" data-toggle="tooltip" data-placement="top" title="Compulsory question" v-if="isCompulsory(cell.question)"> *</span>
									<guidance v-if="'guidance' in cell.question" :question="cell.question"></guidance>
								</template>
							</th>

							<td v-else-if="cell" :key="'cell-' + rowIdx + colIdx" :class="{ minw200: isTableHeadersLeft && rowIdx == 0 }">
								<div :class="{displayinline: isTable}">
								
									<!-- CELLS -->
									<template v-if="isTable">
										<p :id="cell.question.number" class="numbering">{{cell.question.number}}</p>
										<p class="compulsory" data-toggle="tooltip" data-placement="top" title="Compulsory question" v-if="isCompulsory(cell.question)"> *</p>
										<guidance v-if="!['productivity_agrisummary', 'productivity_livestocksummary'].includes(questionGroup.question_group) && 'guidance' in cell.question" :question="cell.question"></guidance>
									</template>

									<autocalc v-if="cell.question.auto_calc" :tabindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" class="text-center"></autocalc>

									<dropdown v-else-if="cell.question.question_type == 'dropdown'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :disabled="isDisabled(cell.question.question_code)"></dropdown>

									<dropdown-filter v-else-if="cell.question.question_type == 'dropdown_filter'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :disabled="isDisabled(cell.question.question_code)"></dropdown-filter>

									<radio v-else-if="cell.question.question_type == 'boolean'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :center-text="true" :disabled="isDisabled(cell.question.question_code)"></radio>

									<input-number v-else-if="cell.question.question_type == 'number'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :disabled="isDisabled(cell.question.question_code)"></input-number>

									<input-text v-else-if="cell.question.question_type == 'text'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :disabled="isDisabled(cell.question.question_code)"></input-text>

									<checkbox v-else-if="cell.question.question_type == 'multiple_answer'" :tabcustomindex="whichTabindex(rowIdx, colIdx)" :question="cell.question" :answer-index="cell.index" :disabled="isDisabled(cell.question.question_code)"></checkbox>
								</div>
							</td>
							<td v-else :key="'cell-' + rowIdx + colIdx"></td>
							<td v-if="isManageable && isTableHeadersTop && colIdx == tableRow.length - 1" :key="'cell-remove-' + rowIdx + colIdx">
									<i class="fas fa-times remove-row pointer" @click="removeRow(rowIdx)"></i>
							</td>
						</template>
					</tr>

					<tr v-if="isManageable && isTableHeadersTop && rowIdx == filteredTable.length - 1" :key="'row-add-' + rowIdx" class="add-row">
						<td><button type="button" class="btn btn-primary" @click="addRow()">Add row</button></td>
					</tr>

          <template v-if="isManageable && isTableHeadersLeft && rowIdx == filteredTable.length - 1" class="add-row">
            <tr :key="'row-remove-' + rowIdx" class="add-row">
              <template v-for="tdIdx in nrCols">
                <td v-if="tdIdx > 1" :key="'cell-remove-' + rowIdx + tdIdx" class="text-center">
                  <i class="fas fa-times remove-row pointer mt-0" @click="removeRow(tdIdx-2)"></i>
                </td>
                <td v-else :key="'cell-remove-' + rowIdx + tdIdx"></td>
              </template>
            </tr>
            <tr :key="'row-add-' + rowIdx" class="add-row">
              <template v-for="tdIdx in nrCols">
                <td v-if="tdIdx < nrCols" :key="'row-add-' + rowIdx + tdIdx"></td>
                <td v-else :key="'row-add-' + rowIdx + tdIdx"><button type="button" class="btn btn-primary float-right" @click="addRow()">Add column</button></td>
              </template>
            </tr>
					</template>

				</template>
			</tbody>
		</table>
	</div>
</template>