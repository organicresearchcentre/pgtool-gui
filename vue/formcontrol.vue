<script>
module.exports = {
  name: "formcontrol",
  props: ["category", "questionCode", "question", "indicatorCode"],
  mixins: [ mixin_getQuestion, mixin_debugscoring, mixin_currentAssessment, mixin_checkCompulsory ],
  mounted() {
    var self = this
    $('[data-toggle="tooltip"]').each(function() {
        $(this).tooltip({
        template: '<div class="tooltip ' + self.category + '-menu-tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
        container: '#app'
        })
    })
  }
}
</script>

<template>
  <div class="mt-3" :class="{'row no-gutters': question.question_code == 'initialdata_farminfo_atmosdeposition'}">
    <div :class="{'col-sm-12': question.question_code == 'initialdata_farminfo_atmosdeposition'}">
      <p class="m-question"><span :id="question.number" class="numbering">{{question.number}}</span> {{ question.question_name }}<span class="compulsory" data-toggle="tooltip" data-placement="top" title="Compulsory question" v-if="isCompulsory(question)"> * </span><guidance v-if="'guidance' in question" :question="question"></guidance></p>
    </div>
    <helper :class="{'col-sm-6': question.question_code == 'initialdata_farminfo_atmosdeposition'}" v-if="question.helper" :helper="question.helper"></helper>
    <div :class="{'col-sm-6': question.question_code == 'initialdata_farminfo_atmosdeposition'}">
        <dropdown v-if="question.question_type == 'dropdown'" :question="question"></dropdown>

        <radio v-if="question.question_type == 'boolean'" :question="question"></radio>
        
        <checkbox v-if="question.question_type == 'multiple_answer'" :question="question"></checkbox>
        
        <input-number v-if="question.question_type == 'number'" :question="question"></input-number>

        <input-text v-if="question.question_type == 'text'" :question="question"></input-text>

        <date v-if="question.question_type == 'date'" :question="question"></date>
    </div>
  </div>
</template>