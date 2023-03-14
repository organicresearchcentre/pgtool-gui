httpVueLoader.register(Vue, 'vue/formelements/checkbox.vue');
httpVueLoader.register(Vue, 'vue/formelements/radio.vue');
httpVueLoader.register(Vue, 'vue/formelements/dropdown.vue');
httpVueLoader.register(Vue, 'vue/formelements/dropdown-filter.vue');
httpVueLoader.register(Vue, 'vue/formelements/input-text.vue');
httpVueLoader.register(Vue, 'vue/formelements/input-number.vue');
httpVueLoader.register(Vue, 'vue/formelements/autocalc.vue');
httpVueLoader.register(Vue, 'vue/formelements/date.vue');
httpVueLoader.register(Vue, 'vue/formelements/location-map.vue');
httpVueLoader.register(Vue, 'vue/card.vue');
httpVueLoader.register(Vue, 'vue/formcontrol.vue');
httpVueLoader.register(Vue, 'vue/formgroup.vue');
httpVueLoader.register(Vue, 'vue/tab.vue');
httpVueLoader.register(Vue, 'vue/guidance.vue');
httpVueLoader.register(Vue, 'vue/helper.vue');
httpVueLoader.register(Vue, 'vue/helper-fillfirst.vue');
httpVueLoader.register(Vue, 'vue/charts/double-bar-chart.vue');
httpVueLoader.register(Vue, 'vue/charts/vert-bar-chart.vue');
httpVueLoader.register(Vue, 'vue/charts/radar-chart.vue');
httpVueLoader.register(Vue, 'vue/scores.vue');
httpVueLoader.register(Vue, 'vue/heading.vue');
httpVueLoader.register(Vue, 'vue/category.vue');
httpVueLoader.register(Vue, 'vue/top-right.vue');
httpVueLoader.register(Vue, 'vue/top.vue');
httpVueLoader.register(Vue, 'vue/top-menu.vue');
httpVueLoader.register(Vue, 'vue/notfound.vue');

const router = new VueRouter({
    mode: 'history',
    base: '/pgtool-gui',
    routes: [
        {
            path: '/',
            name: 'homepage',
            component: httpVueLoader('vue/contents.vue') },
        {
            path: '/initialdata',
            name: 'initialdata',
            component: Vue.options.components.category,
            props: { category: "initialdata" }
        },
        {
            path: '/soilmanagement',
            name: 'soilmanagement',
            component: Vue.options.components.category,
            props: { category: "soilmanagement" }
        },
        {
            path: '/agrienvironmentalmanagement',
            name: 'agrienvironmentalmanagement',
            component: Vue.options.components.category,
            props: { category: "agrienvironmentalmanagement" }
        },
        {
            path: '/landscapeheritage',
            name: 'landscapeheritage',
            component: Vue.options.components.category,
            props: { category: "landscapeheritage" }
        },
        {
            path: '/water',
            name: 'water',
            component: Vue.options.components.category,
            props: { category: "water" }
        },
        {
            path: '/npkbudget',
            name: 'npkbudget',
            component: Vue.options.components.category,
            props: { category: "npkbudget" }
        },
        {
            path: '/fertiliserman',
            name: 'fertiliserman',
            component: Vue.options.components.category,
            props: { category: "fertiliserman" }
        },
        {
            path: '/energycarbon',
            name: 'energycarbon',
            component: Vue.options.components.category,
            props: { category: "energycarbon" }
        },
        {
            path: '/foodsecurity',
            name: 'foodsecurity',
            component: Vue.options.components.category,
            props: { category: "foodsecurity" }
        },
        {
            path: '/agriculturalsystemsdiversity',
            name: 'agriculturalsystemsdiversity',
            component: Vue.options.components.category,
            props: { category: "agriculturalsystemsdiversity" }
        },
        {
            path: '/socialcapital',
            name: 'socialcapital',
            component: Vue.options.components.category,
            props: { category: "socialcapital" }
        },
        {
            path: '/farmbusinessresilience',
            name: 'farmbusinessresilience',
            component: Vue.options.components.category,
            props: { category: "farmbusinessresilience" }
        },
        {
            path: '/animalhealthwelfare',
            name: 'animalhealthwelfare',
            component: Vue.options.components.category,
            props: { category: "animalhealthwelfare" }
        },
        {
            path: '/scores',
            name: 'scores',
            component: Vue.options.components.scores
        },
        {
            path: '*',
            name: 'notfound',
            component: Vue.options.components.notfound
        },
    ],
})
router.beforeEach((to, from, next) => {
    // to avoid floating popovers (particularly for guidance)
    $('[data-toggle="popover"]').popover('hide');
    next()
  })

var VueBus = new Vue();

var app = new Vue({
    el: '#app',
    router: router,
    data: {
        isDebugMode: false,
        stickyElements: 0,
        dataFile: null,
        bundleFiles: [],
        setOfQuestionsThatAreNotArrays: new Set(),
        pgtool: new PGTOOL(),
        pgtoolAnswers: [],
        pgtoolScores: [],
        pgtoolRunnedScenario: [],
        pgtoolAssessmentsNames: [],
        pgtoolLastSaved: [],
        currentErrors: {},
        totalStickyElementsHeight: 0,
        isLoaded: false,
        filename: "",
        makePrivate: false,
        linkedQuestionCodes: {},
        stopWatcher: [],
        currentAssessmentID: 0,
        smallDevice: false
    },
    mixins: [ mixin_setInitialValues, mixin_getQuestion ],
    computed: {
        pgtoolForm() { return this.pgtool.getForm(); },
        getScore() { return this.pgtool.calculateScore },
        getCategoryScore() { return this.pgtool.calculateCategoryScore },
        getIndicatorScore() { return this.pgtool.calculateIndicatorScore },
        getQuestionScore() { return this.pgtool.calculateQuestionScore },
        getAutoCalcValues() { return this.pgtool.calculateAutomaticCalculations },
        scoringKeys() { return this.pgtool.getScoringKeys() },
        currentAssessmentAnswers() {
          return this.pgtoolAnswers[this.currentAssessmentID]
        },
        currentAssessmentScores() {
          return this.pgtoolScores[this.currentAssessmentID]
        },
        currentLastSavedTime() {
          return this.pgtoolLastSaved[this.currentAssessmentID]
        }
    },
    created() {
        var self = this;

        this.checkWidth();
        
        this.addFormNumbering();
        //this.editBiodiversityQuestions();
        this.setQuestionsLinks();
        this.setupAssessment();
        
        VueBus.$on('setupAssessment', function() {
            self.setupAssessment();
        });

        VueBus.$on('updateHeight', function() {
            self.updateElementsHeight();
        })

        // update sticky elements distance from window top
        $(window).resize(function() {
            self.checkWidth();
            self.updateElementsHeight();
        });

        VueBus.$on('mounted', function() {
            self.stickyElements++
        })

        VueBus.$on('updateScore', function(cat) {
            self.updateScore(cat);
        });

        VueBus.$on('downloadData', function() {
            self.openDownloadModal()
        });

        VueBus.$on('updateDebugMode', function(flag) {
            self.isDebugMode = flag
        })

        VueBus.$on('tabChange', function(index) {
            $('[data-toggle="tooltip"]').tooltip("hide");
            self.triggerTooltips();
            self.currentAssessmentID = index
        });

        VueBus.$on('addRow', function(qcode) { self.mutateArrays('addRow', qcode) })
        VueBus.$on('removeRow', function(qcode, idx) { self.mutateArrays('removeRow', qcode, idx) })
        VueBus.$on('clearRow', function(qcode, idx) { self.mutateArrays('clearRow', qcode, idx) })
    },
    watch: {
        stickyElements(value) {
            var self = this
            if (value == 2) {
                setTimeout(function(){
                    self.updateElementsHeight();
                }, 1000);
                self.isLoaded = true
            }
        },
        isLoaded(value) {
            if (value) {
                this.triggerTooltips();
            }
        },
        currentAssessmentAnswers:  {
            deep: true,
            handler(value) {
                if (!this.stopWatcher[this.currentAssessmentID]) {
                    this.updateAutoCalcValues(value)
                    VueBus.$emit('updatePercentages')
                }
            }
        }
    },
    methods: {
        checkWidth() {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            this.smallDevice = width < 992
        },
        applyPatch(obj) {
            // CORRECTLY PREPARE THE "OTHER" ANSWERS ARRAYS
            var questionsWithOtherAnswers = ['initialdata_crops_cropname', 'initialdata_crops_foragecropname', 'initialdata_crops_permanentpasturename', 'initialdata_livestock_type', 'initialdata_livestock_producttype', 'initialdata_seedsfeeds_seedstype', 'initialdata_seedsfeeds_feedstype', 'initialdata_fertilisers_organictype', 'initialdata_fertilisers_inorganictype']

            var all_qcodes = Object.keys(obj)

            for (qcode of questionsWithOtherAnswers) {
                var qcode_other = qcode + 'other'
                var qcode_length = obj[qcode].length
                if (!all_qcodes.includes(qcode_other)) {
                    obj[qcode_other] = new Array(qcode_length).fill(null);
                } else {
                    var qcode_other_length = obj[qcode_other].length
                    if (qcode_other_length < qcode_length) {
                        for (var i = qcode_other_length; i < qcode_length; i++) {
                            obj[qcode_other].push(null)
                        }
                    } else if (qcode_other_length > qcode_length) {
                        for (var i = qcode_other_length; i < qcode_length; i--) {
                            obj[qcode_other].splice(obj[qcode_other].length, 1)
                        }
                    }
                }
            }

            this.pgtoolForm.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_prodmodeyears.question_name = "Years"
            this.pgtoolForm.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_prodmodemonths.question_name = "Months"

            this.pgtoolForm.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_fullyorgyears.question_name = "Years"
            this.pgtoolForm.categories.initialdata.indicators.initialdata_farminfo.questions.initialdata_farminfo_fullyorgmonths.question_name = "Months"
        },
        triggerTooltips() {
            this.$nextTick(function() {
                $('[data-toggle="tooltip"]').each(function() {
                    var id = "options"
                    if (this.attributes.id) {
                    var id = this.attributes.id.nodeValue
                    }
                    $(this).tooltip({
                    template: '<div class="tooltip ' + id + '-tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
                    container: '#app'
                    })
                })
            });
        },
        editBiodiversityQuestions() {
            var form = this.pgtoolForm.categories.biodiversity.indicators.biodiversity_landscape.questions
            for (qcode of [ 'biodiversity_landscape_arabletype', 'biodiversity_landscape_grasslandtype', 'biodiversity_landscape_heathlandtype', 'biodiversity_landscape_othertype', 'biodiversity_landscape_wetlandtype', 'biodiversity_landscape_woodlandtype' ]) {
                form[qcode].question_name = "Type of habitat"
            }
            for (qcode of [ 'biodiversity_landscape_arablearea', 'biodiversity_landscape_grasslandarea', 'biodiversity_landscape_heathlandarea', 'biodiversity_landscape_otherarea', 'biodiversity_landscape_wetlandarea', 'biodiversity_landscape_woodlandarea' ]) {
                form[qcode].question_name = "Area"
            }
        },
        addFormNumbering() {
            var i = 1
            for (cat in this.pgtoolForm.categories) {
                var category = this.pgtoolForm.categories[cat]
                category.number = i
                var j = 0
                for (ind in category.indicators) {
                    var indicator = category.indicators[ind]
                    indicator.number = i + "." + j
                    var k = 0
                    for (q in indicator.questions) {
                        var question = indicator.questions[q]
                        //if (!question.auto_calc) {
                        //}
                        question.number = i + "." + j + "." + k++
                    }
                    j++
                }
                i++
            }
        },
        setQuestionsLinks() {
            var self = this;
            // TODO Urgently review this thing
            var main_qcodes = {
                'initialdata_crops_cropname': [],
                'initialdata_crops_foragecropname': [],
                'initialdata_crops_permanentpasturename': [],
                'initialdata_livestock_type': [],
                'initialdata_livestock_producttype': [],
                'initialdata_seedsfeeds_seedstype': [],
                'initialdata_seedsfeeds_feedstype': [],
                'initialdata_fertilisers_organictype': [],
                'initialdata_fertilisers_inorganictype': [],
                'energycarbon_fueluse_ownfueltype': [],
                'energycarbon_fueluse_contractortype': [],
                'energycarbon_use_contractortype': [],
                /*'crop_pestdiseasecontrol_cropname': [],
                'crop_pestdiseasecontrol_activeingredient': [],
                'biodiversity_landscape_arabletype': [],
                'biodiversity_landscape_grasslandtype': [],
                'biodiversity_landscape_heathlandtype': [],
                'biodiversity_landscape_othertype': [],
                'biodiversity_landscape_wetlandtype': [],
                'biodiversity_landscape_woodlandtype': []*/
            }

            // for each question_group
            // flat question_codes
            // if first element of flat is in main_qcodes
            // add the ARRAY group qcode to a gathering array that should only hold unique qcodes
            function populate(qgroup_qcodes) {
                if (Object.keys(main_qcodes).includes(qgroup_qcodes[0])) {
                    var qcode_links = main_qcodes[qgroup_qcodes[0]]
                    for (var i = 1; i < qgroup_qcodes.length; i++) {
                        if (qgroup_qcodes[i] && qcode_links.indexOf(qgroup_qcodes[i]) === -1 && self.getQuestion(qgroup_qcodes[i]).answer_type === 'array') {
                            qcode_links.push(qgroup_qcodes[i])
                        }
                    }
                }
            }

            for (cat in this.pgtoolForm.categories) {
                var category = this.pgtoolForm.categories[cat]
                for (ind in category.indicators) {
                    var indicator = category.indicators[ind]
                    if ('question_groups' in indicator) {
                        for (qgroup in indicator.question_groups) {
                            var question_group = indicator.question_groups[qgroup]
                            if (qgroup === 'productivity_financialoutput') {
                                for (var j = 0; j < question_group.question_codes.length; j++) {
                                    var qgroup_qcodes = question_group.question_codes[j]
                                    populate(qgroup_qcodes)
                                }
                            } else {
                                var qgroup_qcodes = question_group.question_codes.flat()
                                populate(qgroup_qcodes)
                            }
                            
                        }
                    }
                }
            }
            this.linkedQuestionCodes = main_qcodes
        },
        checkName(name) {
            var initialName = name
            var finalName = null
            var version = 1
            while (!finalName) {
                if (this.pgtoolAssessmentsNames.includes(name)) {
                    name = initialName + ' (' + version++ + ')'
                } else {
                    finalName = name
                }
            }
            return finalName
        },
        setupAssessment(loadedAssessment, assessmentName, version, tool) {
            var self = this

            var loadedAnswers = null
            var loadedScores = null
            
            if (loadedAssessment) {
                
                this.pgtoolAssessmentsNames.push(this.checkName(assessmentName));

                loadedAnswers = loadedAssessment.answers
                loadedScores = loadedAssessment.scores

            } else { // new assessment

                var name = this.checkName(new Date().getFullYear().toString())
                this.pgtoolAssessmentsNames.push(name)
                this.pgtoolRunnedScenario.push(false);

            }

            var objAnswers = {}
            var objScores = {}

            for (const [category_code, category] of Object.entries(this.pgtoolForm.categories)) {

                if (!loadedScores) objScores[category_code] = 0

                Object.values(category.indicators).forEach(function(indicator) {
                    for (const [question_code, question] of Object.entries(indicator.questions)) {
                        if (loadedAnswers && question_code in loadedAnswers) {
                            objAnswers[question_code] = loadedAnswers[question_code]
                        } else {
                            objAnswers[question_code] = self.setInitialValue(question)
                            if (question.answer_type != "array") {
                                self.setOfQuestionsThatAreNotArrays.add(question_code)
                            }
                        }
                    }
                });

                if (loadedAssessment) {

                    var updatedValues = self.getCategoryScore(category_code, loadedAnswers)
                    Object.assign(objScores, updatedValues.scores)
                    Object.assign(objAnswers, updatedValues.calculations)

                }

            }
            
            if (!loadedScores) {
                objScores.total = 0
            }
            
            var index = this.stopWatcher.push(true)
            this.applyPatch(objAnswers)
            this.pgtoolAnswers.push(objAnswers);
            this.pgtoolScores.push(objScores);
            this.pgtoolLastSaved.push(false)
            if (loadedAssessment) {
                self.pgtoolRunnedScenario.push(true);
            }
            this.$set(this.stopWatcher, index-1, false)
        },
        throwErrors(thrownErrors) {
            this.closeAllAlerts();
            for (cat in thrownErrors) {
                if (thrownErrors[cat].length > 0) {
                    if (!(cat in this.currentErrors)) {
                        this.$set(this.currentErrors, cat, []);
                    }
                    for (err in thrownErrors[cat]) {
                        var error = thrownErrors[cat][err]
                        if (typeof error === 'string') {
                            if (this.isDebugMode) {
                                this.currentErrors[cat].push(error)
                            }
                        } else {
                            error.category = this.categoryOf(error.question_code)
                            var ind = this.indicatorOf(error.question_code)
                            error.number = this.pgtoolForm.categories[error.category].indicators[ind].questions[error.question_code].number
                            this.currentErrors[cat].push(error)
                        }
                    }
                }
            }
            this.$nextTick(function() { $('.alert').addClass('show') })
        },
        closeAllAlerts() {
            /*for (cat in this.currentErrors) {
                this.$set(this.currentErrors, cat, []);
            }*/
            this.currentErrors = {}
            $(".alert").alert('dispose')
        },
        closeAlert(category, idx, id) {
            var self = this
            $("#"+id).fadeOut(200, function() {
                self.currentErrors[category].pop(idx)
                if (self.currentErrors[category].length == 0) {
                    delete self.currentErrors[category]
                }
            })
        },
        removeTab() {
            VueBus.$emit('removeTab')
            $("#removeTabModal").modal('hide')
        },
        updateElementsHeight() {
            // get current heights
            var managHeight = document.getElementById('manag-menu').offsetHeight;
            var menuHeight = document.getElementById('menu').offsetHeight;
            
            // set 'top' with the same value as the precedent element's height
            //document.getElementById('manag-menu').style.top = (menuHeight - 1) + 'px'
            document.getElementById('menu').style.top = (managHeight - 1) + 'px'
            this.totalStickyElementsHeight = managHeight + menuHeight
        },
        updateAutoCalcValues: debounce(function(answers) {
            var response = this.getAutoCalcValues(answers)
            Object.assign(this.pgtoolAnswers[this.currentAssessmentID], response.calculations)
            }, 2000),
        updateScore(cat) {
            var assessmentID = this.$refs.tab.currentTab
            var answers = this.pgtoolAnswers[assessmentID]
            var response = {}
            if (!cat) {
                response = this.getScore(answers);
            } else {
                response = this.getCategoryScore(cat, answers);
            }
            Object.assign(this.pgtoolScores[assessmentID], response.scores)
            Object.assign(this.pgtoolAnswers[assessmentID], response.calculations)
            this.$set(this.pgtoolRunnedScenario, assessmentID, true)
            this.throwErrors(response.errors)
            VueBus.$emit('updatedScores', this.pgtoolScores[assessmentID]);
        },
        downloadData() {
            var self = this;

            var timestamp = new Date()

            // TODO Improve this working version
            var obj = { version: this.pgtool.version, tool: 'pgtool', timestamp: timestamp, assessments: {} }
            var privateObj = {}

            this.pgtoolAssessmentsNames.forEach(function(assessmentID, index) {
                var answers = Object.assign({}, self.pgtoolAnswers[index])
                if (self.makePrivate) {
                    var key = "anon_" + index

                    privateObj[key + 'a'] = answers['initialdata_farminfo_farmname']
                    answers['initialdata_farminfo_farmname'] = key + 'a'
                }

                obj.assessments[assessmentID] = {
                    answers: answers,
                    scores: self.pgtoolScores[index],
                }

                self.$set(self.pgtoolLastSaved, index, timestamp)
            })

            var content = JSON.stringify(obj, null, 2)
            var content2 = JSON.stringify(privateObj, null, 2)
            var contentType = "text/plain"

            const a = document.createElement("a");
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = this.filename + ".json";
            a.click();

            if (this.makePrivate) {
                const a2 = document.createElement("a");
                const file2 = new Blob([content2], { type: contentType });
                a2.href = URL.createObjectURL(file2);
                a2.download = this.filename + "_anonimizedData.json";
                a2.click();
            }

            $('#downloadModal').modal('hide');
        },
        onFileChange(e) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.dataFile = files[0]
        },
        onMultipleFileChange(e) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.bundleFiles = files
        },
        loadFileAndReplace(e) {
            this.loadFile(e, true)
        },
        loadFile(e, toReplaceAssessments = false) {
            var self = this;
            let reader = new FileReader();
            reader.onload = e => {
                var data = JSON.parse(e.target.result);
                self.loadJSONdata(data, toReplaceAssessments)
                document.getElementById("file-upload").value = "";
                $('#replaceAssessmentsModal').modal('hide');
            };
            reader.readAsText(this.dataFile);
        },
        openDownloadModal() {
            var assessmentID = this.$refs.tab.currentTab
            var filename = ""
            var farmname = this.pgtoolAnswers[assessmentID]['initialdata_farminfo_farmname']
            var assessmentName = this.pgtoolAssessmentsNames[assessmentID]
            if (farmname) {
                filename += farmname + "_"
            }
            if (assessmentName) {
                filename += assessmentName
            }
            this.filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            $('#downloadDataModal').modal('show');
            // this is in index.html because modals can't be inside sticky elements
        },
        openReplaceAssessmentModal() {
            $('#loadDataModal').modal('hide');
            $('#replaceAssessmentsModal').modal('show');
            // this is in index.html because modals can't be inside sticky elements
        },
        resetApp() {
            this.pgtoolAnswers = []
            this.pgtoolScores = []
            this.pgtoolAssessmentsNames = []
            this.pgtoolRunnedScenario = []
            this.pgtoolLastSaved = []
            this.stopWatcher = []
            this.currentErrors = {}
        },
        loadJSONdata(data, toReplaceAssessments) {
            var self = this;
            
            if (toReplaceAssessments) {
                this.resetApp();
            }
            
            Object.keys(data.assessments).forEach(function(assessmentName) {
                self.setupAssessment(data.assessments[assessmentName], assessmentName, data.version, data.tool)
            })
            
            var lastLoadedTab = this.pgtoolAssessmentsNames.length-1

            VueBus.$emit('updateTabs');
            VueBus.$emit('changeTab', lastLoadedTab);
            VueBus.$emit('updateData');
            VueBus.$emit('updateBadges')
            this.dataFile = null;
        },
        downloadBundle(data) {
            var self = this
            var content = []
            var filecounter = 0 // for naming bundle
            var assesscounter = 0 // for naming bundle

            var headers = ['filename', 'assessment_name'].concat(Array.from(this.setOfQuestionsThatAreNotArrays)).concat(Array.from(this.scoringKeys))
            content.push(headers)
            var privateData = []

            data.forEach(function(el, i) {
                try {
                    var filename = el[0]
                    var filedata = el[1]
                    Object.entries(filedata.assessments).forEach(function(assessment, j) {
                        var assessmentName = assessment[0]
                        var assessmentAnswers = Object.assign({}, assessment[1].answers)
                        var assessmentScores = assessment[1].scores
                        var row = []
                        var column = 0
                        for (header of headers) {
                            column++
                            if (header == 'filename') {
                                if (self.makePrivate) {
                                    var key = "anon_" + i + j + column
                                    row.push(key)
                                    privateData.push([key, filename])
                                } else {
                                    row.push(filename)
                                }
                            } else if (header == 'assessment_name') {
                                row.push(assessmentName)
                            } else if (header.startsWith('score_')) {
                                var scoreKey = header.substring(6)
                                if (scoreKey in assessmentScores) {
                                    row.push(assessmentScores[scoreKey])
                                } else {
                                    row.push(null)
                                }
                            } else {
                                if (header in assessmentAnswers) {
                                    if (self.makePrivate && header == 'initialdata_farminfo_farmname') {
                                        var key = "anon_" + i + j + column
                                        row.push(key)
                                        privateData.push([key, assessmentAnswers[header]])
                                    } else {
                                        row.push(assessmentAnswers[header])
                                    }
                                } else {
                                    row.push(null)
                                }
                            }
                        }
                        content.push(row)
                        assesscounter++
                    })
                    filecounter++
                } catch (err) {
                    alert("Something's not correct with the file " + filename + ". Please, try to create the CSV dataset again, but without this file.")
                    throw err;
                }
             })

            let csvContent = "data:text/csv;charset=utf-8," + content.map(e => e.join(";")).join("\n");
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "CSVDataset_" + filecounter + "Files_" + assesscounter + "Assessments" + ".csv");
            document.body.appendChild(link); // Required for FF
            link.click();

            if (this.makePrivate) {
                let csvContent2 = "data:text/csv;charset=utf-8," + privateData.map(e => e.join(";")).join("\n");
                var encodedUri2 = encodeURI(csvContent2);
                var link2 = document.createElement("a");
                link2.setAttribute("href", encodedUri2);
                link2.setAttribute("download", "CSVDataset_" + filecounter + "Files_" + assesscounter + "Assessments" + "_anonimizedData.csv");
                document.body.appendChild(link2); // Required for FF
                link2.click();
            }
        },
        mutateArrays(action, main_question_code, idx) {
            if (!Object.keys(this.linkedQuestionCodes).includes(main_question_code)) return;

            if (action === 'addRow') {
                for (question_code of this.linkedQuestionCodes[main_question_code]) {
                    var question = this.getQuestion(question_code)
                    this.currentAssessmentAnswers[question_code].push(this.setDefaultArrayElement(question));
                }
                this.currentAssessmentAnswers[main_question_code].push(this.setDefaultArrayElement(this.getQuestion(main_question_code)));

            } else if (action === 'removeRow') {
                for (question_code of this.linkedQuestionCodes[main_question_code]) {
                    this.currentAssessmentAnswers[question_code].splice(idx, 1)
                }
                this.currentAssessmentAnswers[main_question_code].splice(idx, 1)

            } else if (action === 'clearRow') {
                for (question_code of this.linkedQuestionCodes[main_question_code]) {
                    var question = this.getQuestion(question_code)
					this.currentAssessmentAnswers[question_code] = this.setInitialValue(question);
                }
                var question = this.getQuestion(main_question_code)
                this.currentAssessmentAnswers[main_question_code] = this.setInitialValue(question);
            }
		}
    }
});
