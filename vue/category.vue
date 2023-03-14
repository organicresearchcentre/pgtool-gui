<script>
module.exports = {
  name: "category",
  mixins: [ mixin_scroll, mixin_getQuestion, mixin_debugscoring, mixin_checkCompulsory, mixin_currentAssessment ],
  props: {
    category: {
      type: String,
      required: true
    }
  },
  data: function() {
    return {
      enlarge: []
    }
  },
  mounted() {
    var self = this

    VueBus.$on('enlarge', function(qgroupname) {
      if (self.enlarge.indexOf(qgroupname) == -1) {
        self.enlarge.push(qgroupname)
      }
    });
  },
  methods: {
    imgUrl(category_code) {
      return 'img/categories/' + category_code + '.jpg'
    },
    hasLivestock() {
      return this.toShow(this.$root.pgtoolForm.categories.animalhealthwelfare)
    },
    hasCrops()  {
      return this.toShow(this.$root.pgtoolForm.categories.crop)
    },
    updateScore() {
      VueBus.$emit('updateScore', this.category);
    },
    prepareQuestions(indicator) {
      var q = []
      var q_group = []
      Object.keys(indicator.questions).forEach(function(question_code) {
        var question = indicator.questions[question_code]
        if ('question_group' in question) {
          var group_name = question.question_group
          if (!q_group.includes(group_name)) {
            q.push(Object.assign({ question_group: group_name }, indicator.question_groups[group_name]))
            q_group.push(group_name)
          }
        } else {
          q.push(Object.assign({ question_code: question_code }, question))
        }
      })
      return q;
    },
    toEnlarge(questionGroup) {
      return this.enlarge.indexOf(questionGroup) > -1
    },
    qcodesToFillFirst() {
      var qcodes = []
      if (this.category == 'animalhealthwelfare') {
        for (rule of this.$root.pgtoolForm.categories.animalhealthwelfare.compulsoryIf) {
          qcodes.push(rule.question)
        }
      } else if (this.category == 'crop') {
        return [ 'initialdata_crops_croparea', 'initialdata_crops_foragecroparea', 'initialdata_crops_permanentpasturearea' ]
      }
      return qcodes
    }
  }
}
</script>

<template>
  <div class="container-fluid category page" id="category">
    <div class="section">
      <button v-if="category != 'initialdata'" class="update-button" @click='updateScore()'>Update Score</button>
      <div class="category-locator">
        <div class="title">{{ categoryObj.title }}</div>
        <div class="img" :style="{ backgroundImage: 'url(' + imgUrl(category) + ')'}"></div>
      </div>
    </div>
    <heading class="text-justify" :heading="categoryObj.heading"></heading>

    <div class="text-center mb-200" v-if="category == 'animalhealthwelfare' && !hasLivestock()">
      <h2 class="glow-text my-4"><span>- No livestock added -</span></h2>
      <helper-fillfirst class="pl-0 mb-5" :pairs="qcodesToFillFirst()"></helper-fillfirst>
    </div>

    <div v-for="indicator, indicator_code, idx in categoryObj.indicators" :key="indicator_code">
      <div class="row" :class="{'first': idx == 0}">
        <div class="d-none col-sm-3 divider"></div>
        <div class="col-xs-12 col-sm-8 subtitle text-center" :class="{ 'block-answer': !toShowIndicator(category, indicator_code)}">
          <h2>{{ indicator.title }}</h2>
        </div>
        <div class="d-none col-sm-2 divider"></div>
      </div>
      <heading :heading="indicator.heading"></heading>
      <helper v-if="indicator.helper" :helper="indicator.helper" :code="indicator_code"></helper>
      <div v-if="isDebugMode" class="row">
        <p class="m-scoring">SCORING: {{ getIndicatorScoringMethod(indicator_code) }}</p>
        <p class="m-scoring">SCORE: {{ currentScores[indicator_code] }}</p>
      </div>
      <div v-for="question, idx in prepareQuestions(indicator)" :key="idx" class="position-relative">
        <template v-if="question.question_group">
          <formgroup :category-code="category" :indicator-code="indicator_code" :question-group="question" :show-question-group="toShowQuestionGroup(category, indicator_code, question)" :master-index="idx" class="question-group flex-row flex-nowrap" :class="{ larger: toEnlarge(question.question_group) }"></formgroup>
          <div class="do-not-answer" v-if="!toShowQuestionGroup(category, indicator_code, question)">
            <!--span class="mt-4 py-1 px-1" style="position: absolute; left: 5rem;"></span-->
          </div>
        </template>
        <template v-else>
          <template v-if="question.question_code == 'initialdata_farminfo_longitude'">
            <location-map></location-map>
          </template>
          <formcontrol :category="category" :question-code="question.question_code" :question="question" :indicator-code="indicator_code"></formcontrol>
          <div class="do-not-answer" v-if="!toShow(question)">
            <!--span class="mt-4 py-1 px-1" style="position: absolute; left: 5rem;"></span-->
          </div>
        </template>
      </div>
    </div>
  </div>
</template>