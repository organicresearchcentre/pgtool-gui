var mixin_setInitialValues = {
  methods: {
    setInitialValue(question) {
      if ('answer_default' in question) {
        if (question.answer_type == 'array') {
          return [question.answer_default]
        } else {
          return question.answer_default
        }
      } else if (question.answer_type == 'array') {
        if (question.question_type == 'multiple_answer') {
          return [[]]
        } else {
          return [null]
        }
      } else if (question.question_type == 'multiple_answer') {
        return []
      } else {
        return null
      }
    },
    setDefaultArrayElement(question) {
      if (question.question_type == 'multiple_answer') {
        return []
      } else if ('answer_default' in question) {
        return question.answer_default
      } else {
        return null
      }
    }
  }
}

var mixin_getQuestion = {
  methods: {
    categoryOf(question_code) {
      return question_code.substring(0, question_code.indexOf('_'));
    },
    indicatorOf(question_code) {
      var firstApperance = question_code.indexOf('_')
      var endIdx = question_code.indexOf('_', firstApperance + 1)
      return question_code.substring(0, endIdx)
    },
    getQuestion(question_code, category_code, indicator_code) {
      try {
        if (!category_code) category_code = this.categoryOf(question_code)
        if (!indicator_code) indicator_code = this.indicatorOf(question_code)
        return this.form.categories[category_code].indicators[indicator_code].questions[question_code]
      } catch(err) {
        //debugger
      }
    },
  },
  computed: {
    form() {
      return this.$root.pgtoolForm
    },
    categoryObj() {
      return this.$root.pgtoolForm.categories[this.category]
    },
  }
}

var mixin_scroll = {
  beforeRouteUpdate(to, from, next) {    
    if (to.hash) {
      var distanceFromTopOfPage = window.pageYOffset
      var distanceOfStickyFromTop = document.getElementById('tabs').getBoundingClientRect().top
      var stickyHeight = this.$root.totalStickyElementsHeight
      var elementDistanceFromTop = document.getElementById(to.hash.substring(1)).getBoundingClientRect().top
      window.scrollTo({
        top: distanceFromTopOfPage + distanceOfStickyFromTop + elementDistanceFromTop - stickyHeight,
        behavior: "smooth"
      });
    }
  },
  beforeRouteLeave(to, from, next) {
    this.savedPosition = $(window).scrollTop();
    next()
  },
  beforeRouteEnter (to, from, next) {
    // https://router.vuejs.org/guide/advanced/navigation-guards.html#in-component-guards
    next(function(this_) {
      var distanceFromTopOfPage = window.pageYOffset
      var distanceOfStickyFromTop = document.getElementById('tabs').getBoundingClientRect().top
      var stickyHeight = this_.$root.totalStickyElementsHeight
      if (to.hash) {
        var elementDistanceFromTop = document.getElementById(to.hash.substring(1)).getBoundingClientRect().top
        
        window.scrollTo({
          top: distanceFromTopOfPage + distanceOfStickyFromTop + elementDistanceFromTop - stickyHeight - 10,
          behavior: "smooth"
        });
      } else if (this_.savedPosition >= 0) {
        window.scrollTo({
          top: this_.savedPosition,
          behavior: "smooth"
        });
      }
    })
  },
  data() {
    return {
      savedPosition: null
    }
  },
  mounted() {
    this.updateInitialSavedPosition()
  },
  methods: {
    updateInitialSavedPosition() {
      var distanceFromTopOfPage = window.pageYOffset
      var distanceOfStickyFromTop = document.getElementById('tabs').getBoundingClientRect().top
      var stickyHeight = this.$root.totalStickyElementsHeight
      var page = document.getElementsByClassName('page')
      var elementDistanceFromTop = 0
      if (page.length > 0) {
        elementDistanceFromTop = page[0].getBoundingClientRect().top
      }
      
      if (distanceOfStickyFromTop > 0) {
        this.savedPosition = distanceFromTopOfPage
      } else {
        this.savedPosition = distanceFromTopOfPage + distanceOfStickyFromTop + elementDistanceFromTop - stickyHeight
      }
    },
  }
}

var mixin_currentAssessment = {
  computed: {
    currentAssessmentID() {
      if (this.$root.$refs && this.$root.$refs.tab) {
        return this.$root.$refs.tab.currentTab
      } else {
        return 0
      }
    },
    currentAssessmentAnswers() {
      return this.$root.pgtoolAnswers[this.currentAssessmentID]
    },
    currentAssessmentScores() {
      return this.$root.pgtoolScores[this.currentAssessmentID]
    },
    currentLastSavedTime() {
      return this.$root.pgtoolLastSaved[this.currentAssessmentID]
    }
  }
}

var mixin_debugscoring = {
  computed: {
    isDebugMode() {
      return this.$root.$data.isDebugMode
    },
    currentAssessmentID() {
      return this.$root.$refs.tab.currentTab
    },
    currentScores() {
      return this.$root.$data.pgtoolScores[this.currentAssessmentID]
    }
  },
  methods: {
    categoryScoring(category) {
      if (!category) category = this.category
      return this.$root.pgtool.scoring.categories[category]
    },
    indicatorScoring(indicatorCode) {
      if (!indicatorCode) indicatorCode = this.indicatorCode
      var catScoring = this.categoryScoring()
      if (catScoring && catScoring.indicators) {
        return catScoring.indicators[indicatorCode]
      }
    },
    questionScoring(questionCode, indicatorCode) {
      var indScoring = this.indicatorScoring(indicatorCode)
      if (indScoring && indScoring.questions) {
        return indScoring.questions[questionCode]
      }
    },
    hasScoringFunction(questionCode) {
      if (!questionCode) questionCode = this.questionCode
      return this.questionScoring(questionCode)
    },
    getCategoryScoringMethod(category) {
      return this.categoryScoring(category).total
    },
    getIndicatorScoringMethod(indicatorCode) {
      var indicator = this.indicatorScoring(indicatorCode)
      if (indicator) return indicator.total
    },
    getQuestionScoringMethod(questionCode) {
      if (!questionCode) questionCode = this.questionCode
      var str = 'No scoring function.'
      if (this.hasScoringFunction(questionCode)) {
        var str = this.questionScoring(questionCode).toString()
      }
      if (str.includes('scores =')) {
        var start = str.indexOf('scores = {')
        var end = str.indexOf('}')
        return str.slice(start + 11, end - 1)
      } else {
        return str
      }
    }
  }
}

var mixin_checkCompulsory = {
  methods: {
    compliesWithRules(question, opts) {
      var answers = this.currentAssessmentAnswers
      var index = null
      if (opts && Object.keys(opts).includes('assessmentID')) {
        answers = this.$root.pgtoolAnswers[opts.assessmentID]
      }
      if (opts && Object.keys(opts).includes('idx')) {
        index = opts.idx
      }
      return this.$root.pgtool.compliesWithRules(question, answers, index)
    },
    answered(question_code, index = null) {
      try {
        return this.$root.pgtool.answered(question_code, this.currentAssessmentAnswers, index)
      } catch(err) {
        if (err.constructor.name == 'PGTOOLError') { return false }
        else console.log(err);
      }
    },
    toShow(question, opts) {
      if (question.compulsoryIf) {
        return this.compliesWithRules(question, opts)
      } else {
        return true
      }
    },
    toShowIndicator(category_code, indicator_code) {
      var indicator = this.$root.pgtoolForm.categories[category_code].indicators[indicator_code]
      return this.toShow(indicator)
    },
    toShowQuestionGroup(category_code, indicator_code, question) {
      var question_group = this.$root.pgtoolForm.categories[category_code].indicators[indicator_code].question_groups[question.question_group]
      return this.toShow(question_group)
    },
    isCompulsory(question, idx) {
      /*
        compulsory = true + no compulsoryIf
        shows up always, has to be answered
        compulsory = true + compulsoryIf
        only shows up and is compulsory if rules are met
        compulsory = false + no compulsoryIf
        shows up always, not need answer
        compulsory = false + compulsoryIf
        only shows up if rules are met, but doesn't need to be answered
      */
     var opts = {}
     opts.idx = idx
     if (this.toShow(question, opts)) {
       return question.compulsory
     } else {
       return false
     }
    }
  }
}