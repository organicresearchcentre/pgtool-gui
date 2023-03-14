/*!
 * Public Goods Tool (PGTOOL) API
 *
 * Licensed under MIT (https://github.com/organicresearchcentre/pgtool-api/blob/master/LICENSE)
 */

function PGTOOL() {
    const _version = "1.0"
    const _version_excel = "3.1"

    var PGTOOL_ANSWERS = {}
    var PGTOOL_CALCULATIONS = {}
    var PGTOOL_SCORES = {}

    const QUESTION_TYPE = {
        DROPDOWN: 'dropdown',
        DROPDOWN_FILTER: 'dropdown_filter',
        BOOLEAN: 'boolean',
        MULTIPLE_ANSWER: 'multiple_answer',
        NUMBER: 'number',
        TEXT: 'text',
        DATE: 'date',
    }

    const ANSWER_TYPE = {
        ARRAY: 'array',
    }

    const QUESTION_GROUP_TYPE = {
        TABLE: 'table',
        TABLE_HEADERS_LEFT: 'table_headers_left',
        TABLE_HEADERS_TOP: 'table_headers_top'
    }

    const EVALUATORS = {
        NOT_EMPTY: 'not_empty',
        EQUALS: 'equals',
        GREATER_THAN: 'greater_than',
        GREATER_OR_EQUAL_THAN: 'greater_or_equal_than',
        SUM_IS_GREATER_THAN: 'sum_is_greater_than',
        CHECK_TYPE: 'check_type',
        IS_ONE_OF: 'is_one_of'
    }

    /* John Nix Farm Management Pocketbook 2017 */
    const PRICES = {
        MILK: 22,
        BEEF_COW: 1.81,
        WEANERS: 50.30,
        FINISHED_PIGS: 1.43,
        LAMBS_LOWLAND: 1.81,
        LAMBS_UPLAND: 1.75,
        FREE_RANGE_EGGS: 0.95,
        TABLE_CHICKEN: 0.83,
        FEED_WHEAT: 140,
        MILLING_WHEAT: 146,
        BARLEY: 120,
        OATS: 120,
        POTATOES_MAINCROP: 175,
        POTATOES_EARLY: 260
    }
    /* Standard man days (from The John Nix Farm Management Handbook 2010 p177-178) */
    const SMD_PER_HEAD = {
        DAIRY_COWS: 4,
        BEEF_COWS: 1.68,
        EWES: 0.5,
        SOWS: 2.25,
        LAYING_BIRDS: 0.06,
        TABLE_BIRDS: 0.002
    }
    const WOODLAND_ENERGY_CONTENT = 12700
    const LABOUR_USE_IN_FTE_PER_HA = 0.024
    const WORKING_HOURS_PER_YEAR = 2200
    const WOODFUEL_CONVERSION_FACTOR_M3_TO_TONNES = 1.84
    const ATMOSPHERIC_DEPOSITION_N_PER_HA = 25

    Object.filter = function(obj, predicate) {
        let result = {}, key;

        for (key in obj) {
            if (obj.hasOwnProperty(key) && predicate(obj[key])) {
                result[key] = obj[key];
            }
        }

        return result;
    };

    function round(value) {
        if (value === false) return false
        return Math.round(value)
    }

    function sum(arr) {
        if (arr === false) return false
        return arr.reduce(function(a, b) {
            if (b == "N/A") {
                return a;
            } else {
                return a + b
            }
        }, 0);
    }

    function countNotFalse(arr) {
        var count = 0;
        for(let i = 0; i < arr.length; i++)
            if (arr[i] !== false)
                count++;
        return count;
    }

    function countNotNullOrUndefined(arr) {
        var count = 0;
        for(let i = 0; i < arr.length; i++)
            if (arr[i] !== null && arr[i] !== undefined && arr[i] !== "null" && arr[i] !== "")
                count++;
        return count;
    }

    function avg(arr) {
        var nrAnswers = countNotFalse(arr)
        if (nrAnswers == 0) {
            return false
        }
        return sum(arr) / nrAnswers
    }

    function exists(prop, obj) {
        if (prop in obj && obj[prop] !== null && obj[prop] !== "") {
            if (Array.isArray(obj[prop]) && obj[prop].length === 0) {
                return false
            } else if (JSON.stringify(obj[prop]) === JSON.stringify({})) {
                return false
            }
            return true
        }
    }

    function hasSome(haystack, arr) {
        return arr.some(function (v) {
            return haystack.some(function(value) {
                return value === v
            })
        });
    };
    
    function calculateRatio(numerator, denominator) {
        if (denominator > 0) {
            return numerator / denominator
        } else {
            return false
        }
    }

    function calculatePercentage(part, total) {
        var ratio = calculateRatio(part, total)
        if (ratio !== false) {
            return ratio * 100
        } else {
            return false
        }
    }

    function PGTOOLError(question_code, error_code, err) {
        this.question_code = question_code;
        this.error = error_code
        this.stack = (new Error(error_code + ': ' + question_code + (err ? (': ' + err) : ''))).stack;
    }

    function categoryOf(question_code) {
        return question_code.substring(0, question_code.indexOf('_'))
    }

    function indicatorOf(question_code) {
        var firstApperance = question_code.indexOf('_')
        var endIdx = question_code.indexOf('_', firstApperance + 1)
        return question_code.substring(0, endIdx)
    }

    function compliesWithRules(question, answers, idx) {
        for (var i = 0; i < question.compulsoryIf.length; i++) {
            var rule = question.compulsoryIf[i]
            var questionToEvaluate = form.categories[categoryOf(rule.question)].indicators[indicatorOf(rule.question)].questions[rule.question]
            var answer = answers[rule.question]

            if (questionToEvaluate.answer_type === ANSWER_TYPE.ARRAY || questionToEvaluate.question_type === QUESTION_TYPE.MULTIPLE_ANSWER) {

                if (typeof idx === 'number' && answer.length > idx) {

                    if (rule.evaluate === EVALUATORS.GREATER_THAN) {
                        if (!(answer[idx] > rule.value)) {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.GREATER_OR_EQUAL_THAN) {
                        if (!(answer[idx] >= rule.value)) {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.NOT_EMPTY) {
                        if (answer[idx] === null || answer[idx] === undefined || answer[idx] === "null" || answer[idx] === "") {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.IS_ONE_OF) {
                        if (!rule.value.includes(answer[idx])) {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.SUM_IS_GREATER_THAN) {
                        if (sum(answer) <= rule.value) {
                            return false
                        }
                    } else {
                        debugger
                    }

                } else {

                    if (rule.evaluate === EVALUATORS.NOT_EMPTY || rule.evaluate === EVALUATORS.GREATER_THAN) {
                        if (answer.length == 0) {
                            return false
                        } else if (countNotNullOrUndefined(answer) == 0) {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.SUM_IS_GREATER_THAN) {
                        if (sum(answer) <= rule.value) {
                            return false
                        }
                    } else if (rule.evaluate === EVALUATORS.CHECK_TYPE) {
                        if (rule.question == 'initialdata_livestock_type') {
                            var livestockIDs = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
                                return livestock.type == rule.value
                            }))
                            if (!hasSome(answer, livestockIDs)) {
                                return false
                            }
                        } else {
                            console.log('compliesWithRules > ' + EVALUATORS.CHECK_TYPE + ', rule question different then "initialdata_livestock_type"')
                        }
                    } else if (rule.evaluate === EVALUATORS.IS_ONE_OF) {
                        if (!hasSome(rule.value, answer)) {
                            return false
                        }
                    } else {
                        debugger
                    }

                }

            } else {
                if (rule.evaluate === EVALUATORS.EQUALS) {
                    if (answer !== rule.value) {
                        return false
                    }
                } else if (rule.evaluate === EVALUATORS.GREATER_THAN) {
                    if (!(answer > rule.value)) {
                        return false
                    }
                } else if (rule.evaluate === EVALUATORS.GREATER_OR_EQUAL_THAN) {
                    if (!(answer >= rule.value)) {
                        return false
                    }
                } else if (rule.evaluate === EVALUATORS.IS_ONE_OF) {
                    if (!rule.value.includes(answer)) {
                        return false
                    }
                } else {
                    debugger
                }
            }
        }
        return true
    }

    function answered(qcode, answers, idx = null) {
        var category = categoryOf(qcode)
        var indicator = indicatorOf(qcode)
        var question = form.categories[category].indicators[indicator].questions[qcode]
        if (qcode in answers) {
            var answer = answers[qcode]
            // if answer is not empty

            if (answer !== null && answer !== undefined && answer !== "" && answer !== "null") {
                if (question.answer_type === ANSWER_TYPE.ARRAY || question.question_type === QUESTION_TYPE.MULTIPLE_ANSWER) {
                    if (Array.isArray(answer) && answer.length > 0) {
                        if (typeof idx === 'number' && answer.length > idx) {
                            var answerElement = answer[idx]
                            if (answerElement !== null && answerElement !== undefined && answerElement !== "") {
                                return true
                            }
                        } else {
                            if (countNotNullOrUndefined(answer) > 0) {
                                return true
                            }
                        }
                    }
                } else {
                    return true
                }
            }
        }

        // if no answer or answer invalid
        if (question.compulsory) {
            if ('compulsoryIf' in question) {
                if (compliesWithRules(question, answers, idx)) {
                    throw new PGTOOLError(qcode, 'missing compulsory');
                } else {
                    return false
                }
            } else {
                throw new PGTOOLError(qcode, 'missing compulsory');
            }
        } else {
            // if not compulsory, continue
            return false
        }
    }

    function get(qcode, i) {
        var category = categoryOf(qcode)
        var indicator = indicatorOf(qcode)
        var question = form.categories[category].indicators[indicator].questions[qcode]
        if ('auto_calc' in question && question.auto_calc) {
            return getAutoCalc(qcode, i)
        } else {
            return getAnswer(qcode, i)
        }
    }

    function getAutoCalc(qcode, idx=null) {
        if (qcode in PGTOOL_CALCULATIONS) {
            if (typeof idx === 'number') {
                return PGTOOL_CALCULATIONS[qcode][idx]
            } else {
                return PGTOOL_CALCULATIONS[qcode]
            }
        } else {
            var category = categoryOf(qcode)
            var indicator = indicatorOf(qcode)
            try {
                PGTOOL_CALCULATIONS[qcode] = calculations.categories[category].indicators[indicator].questions[qcode]()
            } catch(err) {
                throw new PGTOOLError(qcode, 'getAutoCalc error', err)
            }
            return PGTOOL_CALCULATIONS[qcode]
        }
    }

    function getAnswer(qcode, idx=null) {
        if (answered(qcode, PGTOOL_ANSWERS, idx)) {
            if (typeof idx === 'number') {
                return PGTOOL_ANSWERS[qcode][idx]
            } else {
                return PGTOOL_ANSWERS[qcode]
            }
        } else {
            // not compulsory, continue
            // if compulsory, throws error in answered()
            return false
        }
    }

    function categoryTotalFn() {
        var arr = []
        for (var indicator_code in this.indicators) {
            var value = this.indicators[indicator_code].total()
            PGTOOL_SCORES[indicator_code] = value
            arr.push(value)
        }
        var avgScore = avg(arr)
        return avgScore === false ? avgScore : +avgScore.toFixed(2)
    }

    function indicatorTotalFn() {
        var question_scores = []
        for (var question_code in this.questions) {
            var answer = get(question_code)
            if (answer === false) { // un-answered, but not compulsory
                // skip this in calculations
                PGTOOL_SCORES[question_code] = false
                question_scores.push(false)
            } else {
                var question_score = this.questions[question_code](answer)
                PGTOOL_SCORES[question_code] = question_score
                question_scores.push(question_score)
            }
        }
        return round(avg(question_scores))
    }

    function categoryAggregatorFn(toSilenceErrors) {
        for (var indicator in this.indicators) {
            try {
                this.indicators[indicator].aggregator(toSilenceErrors)
            } catch(err) {
                if (toSilenceErrors) {
                    continue;
                } else {
                    throw err
                }
            }
        }
    }

    function indicatorAggregatorFn(toSilenceErrors) {
        for (var benchmarkField in this.questions) {
            try {
                PGTOOL_CALCULATIONS[benchmarkField] = this.questions[benchmarkField]()
            } catch(err) {
                if (toSilenceErrors) {
                    continue;
                } else {
                    throw err
                }
            }
        }
    }

    const DATASETS = {
        SPRAYS: {
            _version: '0.1',
            wheat: {
                crop: 'Wheat',
                spraydays: 6.5,
            },
            winter_barley: {
                crop: 'Winter barley',
                spraydays: 4.8,
            },
            spring_barley: {
                crop: 'Spring barley',
                spraydays: 3.4,
            },
            oats: {
                crop: 'Oats',
                spraydays: 3.8,
            },
            rye: {
                crop: 'Rye',
                spraydays: 5.1,
            },
            triticale: {
                crop: 'Triticale',
                spraydays: 3.6,
            },
            oilseed_rape: {
                crop: 'Oilseed rape',
                spraydays: 8.4,
            },
            linseed: {
                crop: 'Linseed',
                spraydays: 5,
            },
            ware_potatoes: {
                crop: 'Ware potatoes',
                spraydays: 13.6,
            },
            seed_potatotes: {
                crop: 'Seed potatotes',
                spraydays: 11.9,
            },
            peas: {
                crop: 'Peas',
                spraydays: 5.1,
            },
            beans: {
                crop: 'Beans',
                spraydays: 5,
            },
            sugar_beet: {
                crop: 'Sugar beet',
                spraydays: 6.4,
            },
            all_crops: {
                crop: 'All crops',
                spraydays: 6.2,
            }
        },
        CROPS: {
            _version: '0.1',
            wheat_feed: {
                crop_name: 'Wheat - feed',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 10472,
                n_kg_tonne: 12.65,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.61,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 775,
                source_and_notes: 'Nix 2020 low =£570/t high = £980/t',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            wheat_milling: {
                crop_name: 'Wheat - milling',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11782,
                n_kg_tonne: 12.65,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.61,
                unit: 'ha',
                total_ghg_impact_conv: 375.96,
                total_co2_impact_conv: 155.33,
                total_ch4_impact_conv: 5.05,
                total_n2o_impact_conv: 215.58,
                total_ghg_impact_org: 309.3,
                total_co2_impact_org: 168,
                total_ch4_impact_org: 0.3,
                total_n2o_impact_org: 141,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 140,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            barley: {
                crop_name: 'Barley',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11172,
                n_kg_tonne: 17,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.53,
                unit: 'ha',
                total_ghg_impact_conv: 153.837,
                total_co2_impact_conv: 117.83,
                total_ch4_impact_conv: 4.55,
                total_n2o_impact_conv: 31.457,
                total_ghg_impact_org: 160.2,
                total_co2_impact_org: 119.6,
                total_ch4_impact_org: 3.6,
                total_n2o_impact_org: 37,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 250,
                source_and_notes: 'from Lampkin 2017',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            oats: {
                crop_name: 'Oats',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 10406,
                n_kg_tonne: 14.45,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.63,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 700,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            triticale: {
                crop_name: 'Triticale',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 17,
                p_kg_tonne: 9,
                k_kg_tonne: 6,
                unit: 'ha',
                total_ghg_impact_conv: 71.111,
                total_co2_impact_conv: 37.84,
                total_ch4_impact_conv: 1.049,
                total_n2o_impact_conv: 32.222,
                total_ghg_impact_org: 52.2,
                total_co2_impact_org: 34,
                total_ch4_impact_org: 0.2,
                total_n2o_impact_org: 18,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 450,
                source_and_notes: 'from Lampkin 2017 for white cabbage',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            rye: {
                crop_name: 'Rye',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 12.75,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.53,
                unit: 'ha',
                total_ghg_impact_conv: 71.111,
                total_co2_impact_conv: 37.84,
                total_ch4_impact_conv: 1.049,
                total_n2o_impact_conv: 32.222,
                total_ghg_impact_org: 52.2,
                total_co2_impact_org: 34,
                total_ch4_impact_org: 0.2,
                total_n2o_impact_org: 18,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 430,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            mixed_cereals_grain: {
                crop_name: 'Mixed cereals/grain',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11365.3333333333,
                n_kg_tonne: 14.4166666666667,
                p_kg_tonne: 3.955,
                k_kg_tonne: 3.985,
                unit: 'ha',
                total_ghg_impact_conv: 35.994,
                total_co2_impact_conv: 35.595,
                total_ch4_impact_conv: 2.415,
                total_n2o_impact_conv: -2.016,
                total_ghg_impact_org: 41.02,
                total_co2_impact_org: 39.8,
                total_ch4_impact_org: 0.5,
                total_n2o_impact_org: 0.72,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 390,
                source_and_notes: 'from Lampkin 2017',
                ref_energy: 'Average of cereals and grains energy content values',
                ref_npk: 'Average of cereals and grains NPK values',
            },
            peas_dry: {
                crop_name: 'Peas - dry',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11745,
                n_kg_tonne: 54,
                p_kg_tonne: 7.85,
                k_kg_tonne: 26.04,
                n_kg_ha: 75,
                ref_n_kg_ha: 'IOTA nutrient budgeting guide gives 50-100 for peas',
                unit: 'ha',
                total_ghg_impact_conv: 71.111,
                total_co2_impact_conv: 37.84,
                total_ch4_impact_conv: 1.049,
                total_n2o_impact_conv: 32.222,
                total_ghg_impact_org: 52.2,
                total_co2_impact_org: 34,
                total_ch4_impact_org: 0.2,
                total_n2o_impact_org: 18,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 400,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            field_beans: {
                crop_name: 'Field beans',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11135,
                n_kg_tonne: 55.94,
                p_kg_tonne: 3.42645133129638,
                k_kg_tonne: 27.8589211618257,
                n_kg_ha: 150,
                ref_n_kg_ha: 'IOTA nutrient budgeting guide gives 100-200 for beans',
                unit: 'ha',
                total_ghg_impact_conv: 71.111,
                total_co2_impact_conv: 37.84,
                total_ch4_impact_conv: 1.049,
                total_n2o_impact_conv: 32.222,
                total_ghg_impact_org: 52.2,
                total_co2_impact_org: 34,
                total_ch4_impact_org: 0.2,
                total_n2o_impact_org: 18,
                units: 't',
                sales_units: '£/dozen',
                weight_units: 'N/A',
                category: 'Arable crops (excl. forage)',
                standard_prices: 8.4,
                source_and_notes: 'from Lampkin 201 per dozen',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            fodder_beet: {
                crop_name: 'Fodder beet',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11340,
                n_kg_tonne: 3,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.4896265560166,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                source_and_notes: 'not in Nix or Lampkin',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            sugar_beet: {
                crop_name: 'Sugar beet',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 11000,
                n_kg_tonne: 3,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.4896265560166,
                unit: 'ha',
                total_ghg_impact_conv: 276.5,
                total_co2_impact_conv: 173.19,
                total_ch4_impact_conv: 0.35,
                total_n2o_impact_conv: 102.96,
                total_ghg_impact_org: 365,
                total_co2_impact_org: 173.9,
                total_ch4_impact_org: 0,
                total_n2o_impact_org: 191.1,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 185,
                source_and_notes: 'winter beans',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            potatoes: {
                crop_name: 'Potatoes',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 2680,
                n_kg_tonne: 2.7,
                p_kg_tonne: 0.261894369271061,
                k_kg_tonne: 4.08298755186722,
                unit: 'ha',
                total_ghg_impact_conv: 55.21,
                total_co2_impact_conv: 23.1,
                total_ch4_impact_conv: 0.6,
                total_n2o_impact_conv: 31.51,
                total_ghg_impact_org: 55.9,
                total_co2_impact_org: 31.5,
                total_ch4_impact_org: 0.4,
                total_n2o_impact_org: 24,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            oilseed_rape: {
                crop_name: 'Oilseed rape',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 10800,
                n_kg_tonne: 30,
                p_kg_tonne: 6.11086861632475,
                k_kg_tonne: 9.12863070539419,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            maize_grain: {
                crop_name: 'Maize (grain)',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 13230,
                n_kg_tonne: 40.32,
                p_kg_tonne: 8.99607158446093,
                k_kg_tonne: 9.90041493775933,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            linseed: {
                crop_name: 'Linseed',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 10472,
                n_kg_tonne: 38,
                p_kg_tonne: 5.98865124399825,
                k_kg_tonne: 6.73029045643153,
                unit: 'ha',
                total_ghg_impact_conv: 153.843,
                total_co2_impact_conv: 117.836,
                total_ch4_impact_conv: 4.55,
                total_n2o_impact_conv: 31.457,
                total_ghg_impact_org: 160.2,
                total_co2_impact_org: 119.6,
                total_ch4_impact_org: 3.6,
                total_n2o_impact_org: 37,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 1100,
                source_and_notes: 'from Lampkin 2017',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            sunflowers: {
                crop_name: 'Sunflowers',
                crop_type: 'Arable crops',
                energy_content_mj_tonne: 9600,
                n_kg_tonne: 24,
                p_kg_tonne: 7.1,
                k_kg_tonne: 1.7,
                unit: 'ha',
                total_ghg_impact_conv: 0,
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/dozen',
                weight_units: 'N/A',
                category: 'Arable crops (excl. forage)',
                standard_prices: 4.8,
                source_and_notes: 'from Lampkin 2017 per dozen',
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Schmidt, R., Kloble, U., (2009), Reference figures for organic farming inspectors, KTBL',
            },
            beetroot: {
                crop_name: 'Beetroot',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1799,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 165,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            table_swedes: {
                crop_name: 'Table swedes',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 805,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            cauliflower_: {
                crop_name: 'Cauliflower ',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1031,
                n_kg_tonne: 4,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 4.149377593361,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            calabrese: {
                crop_name: 'Calabrese',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1420,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 78,
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            lettuce: {
                crop_name: 'Lettuce',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 837,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 0,
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                standard_prices: 'N/A',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            cabbages: {
                crop_name: 'Cabbages',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1031,
                n_kg_tonne: 11,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 5.80912863070539,
                unit: 'ha',
                total_ghg_impact_conv: 350.27,
                total_co2_impact_conv: 147.3,
                total_ch4_impact_conv: 4,
                total_n2o_impact_conv: 198.97,
                total_ghg_impact_org: 366.6,
                total_co2_impact_org: 183.6,
                total_ch4_impact_org: 0,
                total_n2o_impact_org: 183,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 140,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            celery: {
                crop_name: 'Celery',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 662,
                n_kg_tonne: 2,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 893.73,
                total_co2_impact_conv: 333.65,
                total_ch4_impact_conv: 12.16,
                total_n2o_impact_conv: 547.92,
                total_ghg_impact_org: 761.9,
                total_co2_impact_org: 335.9,
                total_ch4_impact_org: 0,
                total_n2o_impact_org: 426,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 320,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            parsnips: {
                crop_name: 'Parsnips',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 3138,
                n_kg_tonne: 2.4,
                p_kg_tonne: 0.698384984722829,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 'N/A',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            carrots: {
                crop_name: 'Carrots',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1715,
                n_kg_tonne: 2,
                p_kg_tonne: 1,
                k_kg_tonne: 3,
                unit: 'ha',
                total_ghg_impact_conv: 153.843,
                total_co2_impact_conv: 117.836,
                total_ch4_impact_conv: 4.55,
                total_n2o_impact_conv: 31.457,
                total_ghg_impact_org: 160.2,
                total_co2_impact_org: 119.6,
                total_ch4_impact_org: 3.6,
                total_n2o_impact_org: 37,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 160,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            leeks: {
                crop_name: 'Leeks',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 2350,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 35.994,
                total_co2_impact_conv: 35.595,
                total_ch4_impact_conv: 2.415,
                total_n2o_impact_conv: -2.016,
                total_ghg_impact_org: 41.02,
                total_co2_impact_org: 39.8,
                total_ch4_impact_org: 0.5,
                total_n2o_impact_org: 0.72,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 390,
                source_and_notes: 'from Lampkin 2017',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            onions: {
                crop_name: 'Onions',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 1674,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 800,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            other_veg: {
                crop_name: 'Other veg',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 5423.2,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 412.56,
                total_co2_impact_conv: 161.66,
                total_ch4_impact_conv: 5.71,
                total_n2o_impact_conv: 245.19,
                total_ghg_impact_org: 303.1,
                total_co2_impact_org: 143.1,
                total_ch4_impact_org: 0,
                total_n2o_impact_org: 160,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 230,
                source_and_notes: 'Nix 2020 blue peas (marofats are 315)',
                ref_energy: 'Average of vegetables energy content values',
                ref_npk: 'Average of vegetables NPK values',
            },
            market_garden_one_third_fertility_building: {
                crop_name: 'Market garden - one third fertility building',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 4053.25,
                n_kg_tonne: 13.5225,
                p_kg_tonne: 2.1061067765168,
                k_kg_tonne: 6.81855290456432,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 'N/A',
                ref_energy: 'Average of selected vegetables energy content values',
                ref_npk: 'Average of selected vegetables NPK values',
            },
            market_garden_full_production: {
                crop_name: 'Market garden - full production',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 5423.2,
                n_kg_tonne: 13.5225,
                p_kg_tonne: 2.1061067765168,
                k_kg_tonne: 6.81855290456432,
                unit: 'ha',
                total_ghg_impact_conv: 128.16,
                total_co2_impact_conv: 85.46,
                total_ch4_impact_conv: 3.62,
                total_n2o_impact_conv: 39.08,
                total_ghg_impact_org: 134.9,
                total_co2_impact_org: 103.5,
                total_ch4_impact_org: 3.4,
                total_n2o_impact_org: 28,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 145,
                source_and_notes: 'maincrop',
                ref_energy: 'Average of vegetables energy content values',
                ref_npk: 'Average of vegetables NPK values',
            },
            glasshouses_and_polytunnels: {
                crop_name: 'Glasshouses and polytunnels',
                crop_type: 'Vegetables / Horticulture',
                energy_content_mj_tonne: 756,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 6622,
                source_and_notes: 'Nix 2020',
                ref_energy:
                    'Smith, L., Woodward, L., (2010), Environmental benchmarking and sustainability assessment for organic agriculture, ORC Bulletin',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            apples_dessert: {
                crop_name: 'Apples - dessert',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1966,
                n_kg_tonne: 0.7,
                p_kg_tonne: 0.13094718463553,
                k_kg_tonne: 1.41078838174274,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 3155,
                source_and_notes: 'Nix 2020',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            apples_culinary: {
                crop_name: 'Apples - culinary',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1966,
                n_kg_tonne: 0.5,
                p_kg_tonne: 0.218245307725884,
                k_kg_tonne: 1.2448132780083,
                unit: 'ha',
                total_ghg_impact_conv: 55.21,
                total_co2_impact_conv: 23.1,
                total_ch4_impact_conv: 0.6,
                total_n2o_impact_conv: 31.51,
                total_ghg_impact_org: 55.9,
                total_co2_impact_org: 31.5,
                total_ch4_impact_org: 0.4,
                total_n2o_impact_org: 24,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 28,
                source_and_notes: 'Nix 2020',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            pears: {
                crop_name: 'Pears',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1643,
                n_kg_tonne: 0.2,
                p_kg_tonne: 0.0872981230903536,
                k_kg_tonne: 0.995850622406639,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 'N/A',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            plums: {
                crop_name: 'Plums',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 2544,
                n_kg_tonne: 0.8,
                p_kg_tonne: 0.218245307725884,
                k_kg_tonne: 1.82572614107884,
                unit: 'ha',
                total_ghg_impact_conv: 153.837,
                total_co2_impact_conv: 117.83,
                total_ch4_impact_conv: 4.55,
                total_n2o_impact_conv: 31.457,
                total_ghg_impact_org: 160.2,
                total_co2_impact_org: 119.6,
                total_ch4_impact_org: 3.6,
                total_n2o_impact_org: 37,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 250,
                source_and_notes: 'from Lampkin 2017',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            cherries: {
                crop_name: 'Cherries',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 2674,
                n_kg_tonne: 0.8,
                p_kg_tonne: 0.218245307725884,
                k_kg_tonne: 2.40663900414938,
                unit: 'ha',
                total_ghg_impact_conv: 515.29,
                total_co2_impact_conv: 208.6,
                total_ch4_impact_conv: 6.7,
                total_n2o_impact_conv: 299.99,
                total_ghg_impact_org: 275.33,
                total_co2_impact_org: 135.5,
                total_ch4_impact_org: 0.5,
                total_n2o_impact_org: 139.33,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 145,
                source_and_notes: 'Nix 2020',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            strawberries: {
                crop_name: 'Strawberries',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1328,
                n_kg_tonne: 1.6,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 1.90871369294606,
                unit: 'ha',
                total_ghg_impact_conv: 387.7,
                total_co2_impact_conv: 147.3,
                total_ch4_impact_conv: 5.4,
                total_n2o_impact_conv: 235,
                total_ghg_impact_org: 275.33,
                total_co2_impact_org: 135.5,
                total_ch4_impact_org: 0.5,
                total_n2o_impact_org: 139.33,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 150,
                source_and_notes: 'Nix 2020',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            raspberries: {
                crop_name: 'Raspberries',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 3306,
                n_kg_tonne: 1.4,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 2.24066390041494,
                unit: 'ha',
                total_ghg_impact_conv: 420.9,
                total_co2_impact_conv: 157.8,
                total_ch4_impact_conv: 6.1,
                total_n2o_impact_conv: 257,
                total_ghg_impact_org: 326.45,
                total_co2_impact_org: 154.5,
                total_ch4_impact_org: 0.36,
                total_n2o_impact_org: 171.59,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Arable crops (excl. forage)',
                standard_prices: 160,
                source_and_notes: 'Nix 2020',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            blackcurrants: {
                crop_name: 'Blackcurrants',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1046,
                n_kg_tonne: 1.5,
                p_kg_tonne: 0.392841553906591,
                k_kg_tonne: 3.7344398340249,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 'N/A',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            gooseberries: {
                crop_name: 'Gooseberries',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1841,
                n_kg_tonne: 1.8,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 2.0746887966805,
                unit: 'ha',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 'N/A',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            other_fruit: {
                crop_name: 'Other fruit',
                crop_type: 'Fruit',
                energy_content_mj_tonne: 1880.25,
                n_kg_tonne: 1,
                p_kg_tonne: 0.218245307725884,
                k_kg_tonne: 2.0746887966805,
                unit: 'ha',
                total_ghg_impact_conv: 465.947666666667,
                total_co2_impact_conv: 199.595333333333,
                total_ch4_impact_conv: 6.90333333333333,
                total_n2o_impact_conv: 259.449,
                total_ghg_impact_org: 429.566666666667,
                total_co2_impact_org: 213.033333333333,
                total_ch4_impact_org: 1.2,
                total_n2o_impact_org: 215.333333333333,
                units: 't',
                sales_units: '£/t',
                weight_units: 't',
                category: 'Vegetables / horticulture',
                standard_prices: 'N/A',
                ref_energy: 'Average of fruits energy content values',
                ref_npk: 'Average of fruits NPK values',
            },
            miscanthus: {
                crop_name: 'Miscanthus',
                crop_type: 'Energy crops',
                energy_content_mj_tonne: 13000,
                n_kg_tonne: 4.5,
                p_kg_tonne: 0.327367961588826,
                k_kg_tonne: 5.29045643153527,
                unit: 'ha',
                ref_energy:
                    'Energy content figure based on Miscanthus bale at 25% Moisture Content',
                ref_npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            short_rotation_coppice: {
                crop_name: 'Short Rotation Coppice',
                crop_type: 'Energy crops',
                energy_content_mj_tonne: 12500,
                n_kg_tonne: 2.1,
                p_kg_tonne: 0.549978175469227,
                k_kg_tonne: 1.39419087136929,
                unit: 'ha',
                ref_energy:
                    'Energy content figure based on 1 tonne of wood chips at 30% Moisture Content',
                ref_npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            other_crop: {
                crop_name: 'Other crop',
                crop_type: 'Other crops',
                energy_content_mj_tonne: 5881.6,
                n_kg_tonne: 10.3,
                p_kg_tonne: 2,
                k_kg_tonne: 4.7,
                unit: 'ha',
            }
        },
        LIVESTOCK: {
            _version: '0.1',
            dairy_cow: {
                livestock_name: 'Dairy Cow',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 12.38,
                p_kg_tonne: 3.91095591444784,
                k_kg_tonne: 1.04564315352697,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.2793285,
                total_ghg_impact_conv: 4197.748698,
                total_co2_impact_conv: 678.209598,
                total_ch4_impact_conv: 2067.8688855,
                total_n2o_impact_conv: 1451.6702145,
                total_ghg_impact_org: 1474.85448,
                total_co2_impact_org: 803.6280945,
                total_ch4_impact_org: 24.8602365,
                total_n2o_impact_org: 646.366149,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_dairy',
                standard_prices: 400,
                source_and_notes: 'cull value Nix 2020 pg 50',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 1,
            },
            dairy_heifer_in_calf: {
                livestock_name: 'Dairy Heifer (in calf)',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 11.25,
                p_kg_tonne: 3.55739851593191,
                k_kg_tonne: 0.954356846473029,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.24948,
                total_ghg_impact_conv: 3749.18544,
                total_co2_impact_conv: 605.73744,
                total_ch4_impact_conv: 1846.90044,
                total_n2o_impact_conv: 1296.54756,
                total_ghg_impact_org: 1317.2544,
                total_co2_impact_org: 717.75396,
                total_ch4_impact_org: 22.20372,
                total_n2o_impact_org: 577.29672,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_dairy',
                standard_prices: 1080,
                source_and_notes:
                    'purchase value of heifer autumn/spring calving (all year round = 1260) Nix 2020 pg 56',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 1,
            },
            'dairy_cull_calf_0-3_months': {
                livestock_name: 'Dairy cull calf 0-3 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 1.28,
                p_kg_tonne: 0.139676996944566,
                k_kg_tonne: 0.0663900414937759,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.01782,
                total_ghg_impact_conv: 267.79896,
                total_co2_impact_conv: 43.26696,
                total_ch4_impact_conv: 131.92146,
                total_n2o_impact_conv: 92.61054,
                total_ghg_impact_org: 94.0896,
                total_co2_impact_org: 51.26814,
                total_ch4_impact_org: 1.58598,
                total_n2o_impact_org: 41.23548,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_dairy',
                standard_prices: 50,
                source_and_notes:
                    'for dairy bull calf at 10-20 days old; 130 for heifer calf and 160/120 for cross bred bull/heifer (beef x dairy)',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'dairy_calf_0-6_months': {
                livestock_name: 'Dairy calf 0-6 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 2.25,
                p_kg_tonne: 0.759493670886076,
                k_kg_tonne: 0.199170124481328,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.04455,
                total_ghg_impact_conv: 669.4974,
                total_co2_impact_conv: 108.1674,
                total_ch4_impact_conv: 329.80365,
                total_n2o_impact_conv: 231.52635,
                total_ghg_impact_org: 235.224,
                total_co2_impact_org: 128.17035,
                total_ch4_impact_org: 3.96495,
                total_n2o_impact_org: 103.0887,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                standard_prices: 50,
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'dairy_calf_6-12_months': {
                livestock_name: 'Dairy calf 6-12 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 4.05,
                p_kg_tonne: 1.27891750327368,
                k_kg_tonne: 0.340248962655602,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.08019,
                total_ghg_impact_conv: 1205.09532,
                total_co2_impact_conv: 194.70132,
                total_ch4_impact_conv: 593.64657,
                total_n2o_impact_conv: 416.74743,
                total_ghg_impact_org: 423.4032,
                total_co2_impact_org: 230.70663,
                total_ch4_impact_org: 7.13691,
                total_n2o_impact_org: 185.55966,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                standard_prices: 50,
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'dairy_cattle_12-24_months': {
                livestock_name: 'Dairy cattle 12-24 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 9,
                p_kg_tonne: 2.84591881274553,
                k_kg_tonne: 0.763485477178423,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.1782,
                total_ghg_impact_conv: 2677.9896,
                total_co2_impact_conv: 432.6696,
                total_ch4_impact_conv: 1319.2146,
                total_n2o_impact_conv: 926.1054,
                total_ghg_impact_org: 940.896,
                total_co2_impact_org: 512.6814,
                total_ch4_impact_org: 15.8598,
                total_n2o_impact_org: 412.3548,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                standard_prices: 50,
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            dairy_cattle_over_24_months: {
                livestock_name: 'Dairy cattle over 24 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 22.5,
                p_kg_tonne: 7.11479703186382,
                k_kg_tonne: 1.90871369294606,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.22275,
                total_ghg_impact_conv: 3347.487,
                total_co2_impact_conv: 540.837,
                total_ch4_impact_conv: 1649.01825,
                total_n2o_impact_conv: 1157.63175,
                total_ghg_impact_org: 1176.12,
                total_co2_impact_org: 640.85175,
                total_ch4_impact_org: 19.82475,
                total_n2o_impact_org: 515.4435,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                standard_prices: 1080,
                source_and_notes:
                    'purchase value of heifer autumn/spring calving (all year round = 1260) Nix 2020 pg 56',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            suckler_cow: {
                livestock_name: 'Suckler cow',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 11.25,
                p_kg_tonne: 3.55739851593191,
                k_kg_tonne: 0.954356846473029,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.22275,
                total_ghg_impact_conv: 3347.487,
                total_co2_impact_conv: 540.837,
                total_ch4_impact_conv: 1649.01825,
                total_n2o_impact_conv: 1157.63175,
                total_ghg_impact_org: 1176.12,
                total_co2_impact_org: 640.85175,
                total_ch4_impact_org: 19.82475,
                total_n2o_impact_org: 515.4435,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 500,
                source_and_notes: 'cull price for suckler cow Nix 2020 pg 60',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 1,
            },
            'beef_calf_0-6_months': {
                livestock_name: 'Beef calf 0-6 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 2.25,
                p_kg_tonne: 0.759493670886076,
                k_kg_tonne: 0.199170124481328,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.04455,
                total_ghg_impact_conv: 669.4974,
                total_co2_impact_conv: 108.1674,
                total_ch4_impact_conv: 329.80365,
                total_n2o_impact_conv: 231.52635,
                total_ghg_impact_org: 235.224,
                total_co2_impact_org: 128.17035,
                total_ch4_impact_org: 3.96495,
                total_n2o_impact_org: 103.0887,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 450,
                source_and_notes:
                    'calf value at 6 months. 245kg at 6 months (=£1.84/kg) Nix 2020 pg 59',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'beef_calf_6-12_months': {
                livestock_name: 'Beef calf 6-12 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 4.05,
                p_kg_tonne: 1.27891750327368,
                k_kg_tonne: 0.340248962655602,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.08019,
                total_ghg_impact_conv: 1205.09532,
                total_co2_impact_conv: 194.70132,
                total_ch4_impact_conv: 593.64657,
                total_n2o_impact_conv: 416.74743,
                total_ghg_impact_org: 423.4032,
                total_co2_impact_org: 230.70663,
                total_ch4_impact_org: 7.13691,
                total_n2o_impact_org: 185.55966,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 740,
                source_and_notes:
                    'store cattle 6-12  months sales at 402-398kg liveweight, at £1.85/kg = £740/animal Nix 2020 pg 64',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.6,
            },
            'beef_cattle_12-24_months': {
                livestock_name: 'Beef cattle 12-24 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 9,
                p_kg_tonne: 2.84591881274553,
                k_kg_tonne: 0.763485477178423,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.1782,
                total_ghg_impact_conv: 2677.9896,
                total_co2_impact_conv: 432.6696,
                total_ch4_impact_conv: 1319.2146,
                total_n2o_impact_conv: 926.1054,
                total_ghg_impact_org: 940.896,
                total_co2_impact_org: 512.6814,
                total_ch4_impact_org: 15.8598,
                total_n2o_impact_org: 412.3548,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 1080,
                source_and_notes:
                    'finished sale liveweights of 598-604kg - sale price of £1.80/kg = 600kg@£1.80/kg = £1080 Nix 2020 pg 65',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.6,
            },
            beef_cattle_over_24_months: {
                livestock_name: 'Beef cattle over 24 months',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 22.5,
                p_kg_tonne: 7.11479703186382,
                k_kg_tonne: 1.90871369294606,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.22275,
                total_ghg_impact_conv: 3347.487,
                total_co2_impact_conv: 540.837,
                total_ch4_impact_conv: 1649.01825,
                total_n2o_impact_conv: 1157.63175,
                total_ghg_impact_org: 1176.12,
                total_co2_impact_org: 640.85175,
                total_ch4_impact_org: 19.82475,
                total_n2o_impact_org: 515.4435,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 1080,
                source_and_notes:
                    'finished sale liveweights of 598-604kg - sale price of £1.80/kg = 600kg@£1.80/kg = £1080 Nix 2020 pg 66',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 1,
            },
            breeding_bull: {
                livestock_name: 'Breeding bull',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 30.38,
                p_kg_tonne: 9.60279353993889,
                k_kg_tonne: 2.57261410788382,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.601425,
                total_ghg_impact_conv: 9038.2149,
                total_co2_impact_conv: 1460.2599,
                total_ch4_impact_conv: 4452.349275,
                total_n2o_impact_conv: 3125.605725,
                total_ghg_impact_org: 3175.524,
                total_co2_impact_org: 1730.299725,
                total_ch4_impact_org: 53.526825,
                total_n2o_impact_org: 1391.69745,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'cattle_meat',
                standard_prices: 800,
                source_and_notes: 'cull value Nix 2020 pg 50',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            ewes: {
                livestock_name: 'Ewes',
                energy_content_mj_tonne: 10120,
                n_kg_tonne: 1.5,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 0.0912863070539419,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.021714,
                total_ghg_impact_conv: 428.873214,
                total_co2_impact_conv: 35.328678,
                total_ch4_impact_conv: 305.472552,
                total_n2o_impact_conv: 88.071984,
                total_ghg_impact_org: 424.226418,
                total_co2_impact_org: 19.911738,
                total_ch4_impact_org: 316.242696,
                total_n2o_impact_org: 88.071984,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'sheep',
                standard_prices: 65,
                source_and_notes: 'cull value is £65 (pg 70) purchase price is £140',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.12,
            },
            lambs: {
                livestock_name: 'Lambs',
                energy_content_mj_tonne: 10120,
                n_kg_tonne: 0.42,
                p_kg_tonne: 0.0872981230903536,
                k_kg_tonne: 0.024896265560166,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.007238,
                total_ghg_impact_conv: 142.957738,
                total_co2_impact_conv: 11.776226,
                total_ch4_impact_conv: 101.824184,
                total_n2o_impact_conv: 29.357328,
                total_ghg_impact_org: 141.408806,
                total_co2_impact_org: 6.637246,
                total_ch4_impact_org: 105.414232,
                total_n2o_impact_org: 29.357328,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'sheep',
                standard_prices: 68,
                source_and_notes:
                    'spring lambing flocks - lamb sales - prices for lambs sold for slaughter are based on the projection for the 2020 season: average sale liveweight of 40kg averaging £1.70/kg making £68/average lamb. For finishing store lambs, sale price is £90/lamb finished',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.12,
            },
            hoggets: {
                livestock_name: 'Hoggets',
                energy_content_mj_tonne: 10120,
                n_kg_tonne: 1.5,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 0.0912863070539419,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.021714,
                total_ghg_impact_conv: 428.873214,
                total_co2_impact_conv: 35.328678,
                total_ch4_impact_conv: 305.472552,
                total_n2o_impact_conv: 88.071984,
                total_ghg_impact_org: 424.226418,
                total_co2_impact_org: 19.911738,
                total_ch4_impact_org: 316.242696,
                total_n2o_impact_org: 88.071984,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'sheep',
                standard_prices: 'N/A',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            rams: {
                livestock_name: 'Rams',
                energy_content_mj_tonne: 10120,
                n_kg_tonne: 1.5,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 0.0912863070539419,
                eo_category: 'BSH',
                't_dw_head_adjusted_for_meat_bone_%': 0.021714,
                total_ghg_impact_conv: 428.873214,
                total_co2_impact_conv: 35.328678,
                total_ch4_impact_conv: 305.472552,
                total_n2o_impact_conv: 88.071984,
                total_ghg_impact_org: 424.226418,
                total_co2_impact_org: 19.911738,
                total_ch4_impact_org: 316.242696,
                total_n2o_impact_org: 88.071984,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'sheep',
                standard_prices: 85,
                source_and_notes: 'cull value is £85 (pg 70) purchase price is £500',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.15,
            },
            sows: {
                livestock_name: 'Sows',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 10.8,
                p_kg_tonne: 2.2959406372763,
                k_kg_tonne: 0.672199170124481,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.135792,
                total_ghg_impact_conv: 2682.027792,
                total_co2_impact_conv: 220.933584,
                total_ch4_impact_conv: 1910.321856,
                total_n2o_impact_conv: 550.772352,
                total_ghg_impact_org: 483.691104,
                total_co2_impact_org: 187.39296,
                total_ch4_impact_org: 41.280768,
                total_n2o_impact_org: 255.017376,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 103,
                source_and_notes:
                    'cull value of £103, in-pig gilt purchase price is £250 Nix 2020 pg 94',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.44,
            },
            weaners_35_weeks: {
                livestock_name: 'Weaners 3.5 weeks',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 0.17,
                p_kg_tonne: 0.0349192492361414,
                k_kg_tonne: 0.00829875518672199,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.005904,
                total_ghg_impact_conv: 25.83,
                total_co2_impact_conv: 13.089168,
                total_ch4_impact_conv: 4.770432,
                total_n2o_impact_conv: 7.9704,
                total_ghg_impact_org: 21.030048,
                total_co2_impact_org: 8.14752,
                total_ch4_impact_org: 1.794816,
                total_n2o_impact_org: 11.087712,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 55,
                source_and_notes: 'average price to 35kg liveweight Nix 2020 pg 94',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.17,
            },
            growers_75_weeks: {
                livestock_name: 'Growers 7.5 weeks',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 0.43,
                p_kg_tonne: 0.0916630292448712,
                k_kg_tonne: 0.024896265560166,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.011808,
                total_ghg_impact_conv: 51.66,
                total_co2_impact_conv: 26.178336,
                total_ch4_impact_conv: 9.540864,
                total_n2o_impact_conv: 15.9408,
                total_ghg_impact_org: 42.060096,
                total_co2_impact_org: 16.29504,
                total_ch4_impact_org: 3.589632,
                total_n2o_impact_org: 22.175424,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 98.9,
                source_and_notes: "described as 'Pork' in Nix 2020 pg 95",
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.17,
            },
            'cutters_35-85_kg': {
                livestock_name: 'Cutters 35-85 kg',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 2.04,
                p_kg_tonne: 0.43212570929725,
                k_kg_tonne: 0.12448132780083,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.053136,
                total_ghg_impact_conv: 232.47,
                total_co2_impact_conv: 117.802512,
                total_ch4_impact_conv: 42.933888,
                total_n2o_impact_conv: 71.7336,
                total_ghg_impact_org: 189.270432,
                total_co2_impact_org: 73.32768,
                total_ch4_impact_org: 16.153344,
                total_n2o_impact_org: 99.789408,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 113.9,
                source_and_notes: 'Nix 2020 pg 95',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.17,
            },
            'baconer_35-105_kg': {
                livestock_name: 'Baconer 35-105 kg',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 2.52,
                p_kg_tonne: 0.536883457005674,
                k_kg_tonne: 0.157676348547718,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.064944,
                total_ghg_impact_conv: 284.13,
                total_co2_impact_conv: 143.980848,
                total_ch4_impact_conv: 52.474752,
                total_n2o_impact_conv: 87.6744,
                total_ghg_impact_org: 231.330528,
                total_co2_impact_org: 89.62272,
                total_ch4_impact_org: 19.742976,
                total_n2o_impact_org: 121.964832,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 126.2,
                source_and_notes: 'Nix 2020 pg 95',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.17,
            },
            gilts: {
                livestock_name: 'Gilts',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 2.16,
                p_kg_tonne: 0.458315146224356,
                k_kg_tonne: 0.132780082987552,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.064944,
                total_ghg_impact_conv: 284.13,
                total_co2_impact_conv: 143.980848,
                total_ch4_impact_conv: 52.474752,
                total_n2o_impact_conv: 87.6744,
                total_ghg_impact_org: 231.330528,
                total_co2_impact_org: 89.62272,
                total_ch4_impact_org: 19.742976,
                total_n2o_impact_org: 121.964832,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 250,
                source_and_notes: 'in-pig gilt purchase value Nix 2020 pg 94',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            boars: {
                livestock_name: 'Boars',
                energy_content_mj_tonne: 11790,
                n_kg_tonne: 6,
                p_kg_tonne: 1.27455259711916,
                k_kg_tonne: 0.37344398340249,
                eo_category: 'PIG',
                't_dw_head_adjusted_for_meat_bone_%': 0.1476,
                total_ghg_impact_conv: 645.75,
                total_co2_impact_conv: 327.2292,
                total_ch4_impact_conv: 119.2608,
                total_n2o_impact_conv: 199.26,
                total_ghg_impact_org: 525.7512,
                total_co2_impact_org: 203.688,
                total_ch4_impact_org: 44.8704,
                total_n2o_impact_org: 277.1928,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'pigs',
                standard_prices: 90,
                source_and_notes: 'cull value. purchase value is £1250. Nx 2020 pg 94',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.35,
            },
            pullets_to_18_weeks: {
                livestock_name: 'Pullets to 18 weeks',
                energy_content_mj_tonne: 7890,
                n_kg_tonne: 0.00043,
                p_kg_tonne: 0.000192055870798778,
                k_kg_tonne: 0.0000912863070539419,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.00021168,
                total_ghg_impact_conv: 0.95658192,
                total_co2_impact_conv: 0.64922256,
                total_ch4_impact_conv: 0.01968624,
                total_n2o_impact_conv: 0.28767312,
                total_ghg_impact_org: 1.1176704,
                total_co2_impact_org: 0.60900336,
                total_ch4_impact_org: 0.01883952,
                total_n2o_impact_org: 0.48982752,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_meat',
                standard_prices: 4.3,
                source_and_notes: 'rearing pullets sale price £/bird Nix 2020 pg 100',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            laying_hens: {
                livestock_name: 'Laying hens',
                energy_content_mj_tonne: 7890,
                n_kg_tonne: 0.048,
                p_kg_tonne: 0.0117852466171977,
                k_kg_tonne: 0.00497925311203319,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.011088,
                total_ghg_impact_conv: 50.106672,
                total_co2_impact_conv: 34.006896,
                total_ch4_impact_conv: 1.031184,
                total_n2o_impact_conv: 15.068592,
                total_ghg_impact_org: 58.54464,
                total_co2_impact_org: 31.900176,
                total_ch4_impact_org: 0.986832,
                total_n2o_impact_org: 25.657632,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_eggs',
                standard_prices: 'N/A',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.017,
            },
            table_birds: {
                livestock_name: 'Table birds',
                energy_content_mj_tonne: 7890,
                n_kg_tonne: 0.064,
                p_kg_tonne: 0.0100392841553907,
                k_kg_tonne: 0.00497925311203319,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.011088,
                total_ghg_impact_conv: 50.106672,
                total_co2_impact_conv: 34.006896,
                total_ch4_impact_conv: 1.031184,
                total_n2o_impact_conv: 15.068592,
                total_ghg_impact_org: 58.54464,
                total_co2_impact_org: 31.900176,
                total_ch4_impact_org: 0.986832,
                total_n2o_impact_org: 25.657632,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_meat',
                standard_prices: 2.11,
                source_and_notes:
                    'broilers sale pice £/bird. Sale weight is 2.2kg and sale price is £0.96/kg L.Wt. Nix 2020 pg 100',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.017,
            },
            turkeys_males: {
                livestock_name: 'Turkeys males',
                energy_content_mj_tonne: 8690,
                n_kg_tonne: 0.138,
                p_kg_tonne: 0.060235704932344,
                k_kg_tonne: 0.029045643153527,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.007056,
                total_ghg_impact_conv: 31.886064,
                total_co2_impact_conv: 21.640752,
                total_ch4_impact_conv: 0.656208,
                total_n2o_impact_conv: 9.589104,
                total_ghg_impact_org: 37.25568,
                total_co2_impact_org: 20.300112,
                total_ch4_impact_org: 0.627984,
                total_n2o_impact_org: 16.327584,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_meat',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.017,
            },
            turkeys_females: {
                livestock_name: 'Turkeys females',
                energy_content_mj_tonne: 8690,
                n_kg_tonne: 0.066,
                p_kg_tonne: 0.0296813618507202,
                k_kg_tonne: 0.0141078838174274,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.007056,
                total_ghg_impact_conv: 31.886064,
                total_co2_impact_conv: 21.640752,
                total_ch4_impact_conv: 0.656208,
                total_n2o_impact_conv: 9.589104,
                total_ghg_impact_org: 37.25568,
                total_co2_impact_org: 20.300112,
                total_ch4_impact_org: 0.627984,
                total_n2o_impact_org: 16.327584,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_meat',
                standard_prices: 38.22,
                source_and_notes:
                    'all year turkey sale price £/bird. Sale wweight is 14kg and sale price is £2.73/kg L.Wt. Nix 2020 pg 100',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.017,
            },
            ducks: {
                livestock_name: 'Ducks',
                energy_content_mj_tonne: 13160,
                n_kg_tonne: 0.035,
                p_kg_tonne: 0.0157136621562636,
                k_kg_tonne: 0.00746887966804979,
                eo_category: 'PLT',
                't_dw_head_adjusted_for_meat_bone_%': 0.001512,
                total_ghg_impact_conv: 6.832728,
                total_co2_impact_conv: 4.637304,
                total_ch4_impact_conv: 0.140616,
                total_n2o_impact_conv: 2.054808,
                total_ghg_impact_org: 7.98336,
                total_co2_impact_org: 4.350024,
                total_ch4_impact_org: 0.134568,
                total_n2o_impact_org: 3.498768,
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'poultry_meat',
                standard_prices: 8.97,
                source_and_notes:
                    'pekin duck. Sale weight 2.3kg, sale price £3.90/kg L.Wt. Nix 2020 pg 100',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 0.017,
            },
            horses: {
                livestock_name: 'Horses',
                energy_content_mj_tonne: 14640,
                n_kg_tonne: 10,
                p_kg_tonne: 3.20384111741598,
                k_kg_tonne: 0.863070539419087,
                eo_category: 'N/A',
                't_dw_head_adjusted_for_meat_bone_%': 0.4,
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'other',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
                lu: 1,
            },
            other: {
                livestock_name: 'Other',
                energy_content_mj_tonne: 12328.3870967742,
                n_kg_tonne: 5.85585258064516,
                p_kg_tonne: 1.74923529660241,
                k_kg_tonne: 0.475253915138536,
                eo_category: 'N/A',
                't_dw_head_adjusted_for_meat_bone_%': 0.065945,
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 'number',
                sales_units: '£/animal',
                weight_units: 'number',
                type: 'other',
                ref_energy: 'EASI data',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            }
        },
        LIVESTOCK_PRODUCTS: {
            _version: '0.1',
            eggs_dozens: {
                livestock_product_name: 'Eggs (dozens)',
                energy_content_mj_tonne: 3.88,
                n_kg_tonne: 0.012,
                p_kg_tonne: 0.000804,
                k_kg_tonne: 0.001236,
                type: 'poultry_eggs',
                't_dw_head_adjusted_for_meat_bone_%': 'N/A',
                total_ghg_impact_conv: 19.803,
                total_co2_impact_conv: 11.312,
                total_ch4_impact_conv: 5.439,
                total_n2o_impact_conv: 3.052,
                total_ghg_impact_org: 21.966,
                total_co2_impact_org: 12.096,
                total_ch4_impact_org: 5.404,
                total_n2o_impact_org: 4.466,
                units: 'dozen',
                sales_units: '£/dozen',
                weight_units: '£/dozen',
                category: 'Birds',
                standard_prices: 0.7,
                source_and_notes:
                    'enriched cages (£1/dozen for free range) Nix 2020 pg 98',
                ref_energy:
                    'MJ/doz eggs Source: FSA (Food Standards Agency) (2002) McCance and Widdowson’s The Composition of Foods, Sixth summary edition. Cambridge: Royal Society of Chemistry',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            milk_1000s_of_litres: {
                livestock_product_name: 'Milk (1000s of litres)',
                energy_content_mj_tonne: 1820,
                n_kg_tonne: 5.45,
                p_kg_tonne: 0.95,
                k_kg_tonne: 1.5,
                type: 'cattle_dairy',
                't_dw_head_adjusted_for_meat_bone_%': 'N/A',
                total_ghg_impact_conv: 1068,
                total_co2_impact_conv: 210,
                total_ch4_impact_conv: 637,
                total_n2o_impact_conv: 221,
                total_ghg_impact_org: 957,
                total_co2_impact_org: 168,
                total_ch4_impact_org: 711,
                total_n2o_impact_org: 77,
                units: '000s litres',
                sales_units: "£/'000 litres",
                weight_units: "£/'000 litres",
                category: 'Cattle - dairy',
                standard_prices: 290,
                source_and_notes:
                    '0.29/litre average milk price for 2020 Nix 2020 pg 45',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            wool_tonnes: {
                livestock_product_name: 'Wool (tonnes)',
                energy_content_mj_tonne: 13490,
                n_kg_tonne: 146,
                p_kg_tonne: 1.45,
                k_kg_tonne: 1.6,
                type: 'sheep',
                't_dw_head_adjusted_for_meat_bone_%': 'N/A',
                total_ghg_impact_conv: 'N/A',
                total_co2_impact_conv: 'N/A',
                total_ch4_impact_conv: 'N/A',
                total_n2o_impact_conv: 'N/A',
                total_ghg_impact_org: 'N/A',
                total_co2_impact_org: 'N/A',
                total_ch4_impact_org: 'N/A',
                total_n2o_impact_org: 'N/A',
                units: 't',
                sales_units: '£/t',
                weight_units: '£/t',
                category: 'Sheep',
                standard_prices: 600,
                source_and_notes: '£0.60/kg',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            other: {
                livestock_product_name: 'Other',
            }
        },
        FEEDS: {
            _version: '0.1',
            hay: {
                feed_name: 'Hay',
                energy_content_mj_tonne: 7820,
                n_kg_tonne: 14.9,
                p_kg_tonne: 2.2,
                k_kg_tonne: 17.9,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            dried_grass: {
                feed_name: 'Dried grass',
                energy_content_mj_tonne: 9844,
                n_kg_tonne: 28,
                p_kg_tonne: 3.2,
                k_kg_tonne: 24.2,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            grass_and_clover_silage: {
                feed_name: 'Grass and clover silage',
                energy_content_mj_tonne: 2254,
                n_kg_tonne: 6.9,
                p_kg_tonne: 0.8,
                k_kg_tonne: 6.6,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            grass_silage: {
                feed_name: 'Grass silage',
                energy_content_mj_tonne: 2750,
                n_kg_tonne: 6.9,
                p_kg_tonne: 0.8,
                k_kg_tonne: 6.6,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            clover_silage: {
                feed_name: 'Clover silage',
                energy_content_mj_tonne: 2472,
                n_kg_tonne: 5.5,
                p_kg_tonne: 0.6,
                k_kg_tonne: 5,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Schmidt, R., Kloble, U., (2009), Reference figures for organic farming inspectors, KTBL',
            },
            lucerne_silage: {
                feed_name: 'Lucerne silage',
                energy_content_mj_tonne: 2720,
                n_kg_tonne: 6.2,
                p_kg_tonne: 0.6,
                k_kg_tonne: 5,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Schmidt, R., Kloble, U., (2009), Reference figures for organic farming inspectors, KTBL',
            },
            whole_crop_cereal: {
                feed_name: 'Whole crop - cereal',
                energy_content_mj_tonne: 4260,
                n_kg_tonne: 6,
                p_kg_tonne: 0.654735923177652,
                k_kg_tonne: 4.149377593361,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    "Based on 'Forage other' figure from ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3",
            },
            whole_crop_pulse: {
                feed_name: 'Whole crop - pulse',
                energy_content_mj_tonne: 2509,
                n_kg_tonne: 6,
                p_kg_tonne: 0.654735923177652,
                k_kg_tonne: 4.149377593361,
                ref_energy: 'MAFF feeding tables',
                ref_npk:
                    "Based on 'Forage other' figure from ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3",
            },
            whole_crop_cereal_pulse: {
                feed_name: 'Whole crop - cereal/pulse',
                energy_content_mj_tonne: 3045,
                n_kg_tonne: 6,
                p_kg_tonne: 0.654735923177652,
                k_kg_tonne: 4.149377593361,
                ref_energy: 'Martinsson 2010',
                ref_npk:
                    "Based on 'Forage other' figure from ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3",
            },
            maize_silage: {
                feed_name: 'Maize silage',
                energy_content_mj_tonne: 3277,
                n_kg_tonne: 3.4,
                p_kg_tonne: 0.7,
                k_kg_tonne: 4,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Schmidt, R., Kloble, U., (2009), Reference figures for organic farming inspectors, KTBL',
            },
            wheat: {
                feed_name: 'Wheat',
                energy_content_mj_tonne: 11782,
                n_kg_tonne: 12.65,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.61,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            barley: {
                feed_name: 'Barley',
                energy_content_mj_tonne: 11172,
                n_kg_tonne: 17,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.53,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            oats: {
                feed_name: 'Oats',
                energy_content_mj_tonne: 10406,
                n_kg_tonne: 14.45,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.63,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            triticale: {
                feed_name: 'Triticale',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 17,
                p_kg_tonne: 9,
                k_kg_tonne: 6,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            rye: {
                feed_name: 'Rye',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 12.75,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.53,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            mixed_cereals_grain: {
                feed_name: 'Mixed cereals/grain',
                energy_content_mj_tonne: 4547,
                n_kg_tonne: 14.77,
                p_kg_tonne: 4.16,
                k_kg_tonne: 4.06,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk: 'Average of cereals and grains values',
            },
            peas_dry: {
                feed_name: 'Peas - dry',
                energy_content_mj_tonne: 11745,
                n_kg_tonne: 54,
                p_kg_tonne: 7.85,
                k_kg_tonne: 26.04,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            field_beans: {
                feed_name: 'Field beans',
                energy_content_mj_tonne: 11135,
                n_kg_tonne: 55.94,
                p_kg_tonne: 3.42645133129638,
                k_kg_tonne: 27.8589211618257,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            fodder_beet: {
                feed_name: 'Fodder beet',
                energy_content_mj_tonne: 11340,
                n_kg_tonne: 3,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.4896265560166,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            sugar_beet: {
                feed_name: 'Sugar beet',
                energy_content_mj_tonne: 11000,
                n_kg_tonne: 3,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.4896265560166,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            potatoes: {
                feed_name: 'Potatoes',
                energy_content_mj_tonne: 2680,
                n_kg_tonne: 2.7,
                p_kg_tonne: 0.261894369271061,
                k_kg_tonne: 4.08298755186722,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            soya_bean_meal_or_cake: {
                feed_name: 'Soya bean meal or cake',
                energy_content_mj_tonne: 12150,
                n_kg_tonne: 69.9,
                p_kg_tonne: 6.6,
                k_kg_tonne: 22.2,
                ref_energy: 'Interfood feed values',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            rapeseed_meal_or_cake: {
                feed_name: 'Rapeseed meal or cake',
                energy_content_mj_tonne: 10800,
                n_kg_tonne: 57.7,
                p_kg_tonne: 10.2,
                k_kg_tonne: 12.9,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            fishmeal: {
                feed_name: 'Fishmeal',
                energy_content_mj_tonne: 13206,
                n_kg_tonne: 105,
                p_kg_tonne: 33.3,
                k_kg_tonne: 8.5,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'other_compound_cakes_18%_protein': {
                feed_name: 'Other compound cakes 18% protein',
                energy_content_mj_tonne: 11440,
                n_kg_tonne: 28.8,
                p_kg_tonne: 3.6,
                k_kg_tonne: 7.2,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            milk_powder: {
                feed_name: 'Milk powder',
                energy_content_mj_tonne: 14900,
                n_kg_tonne: 40,
                p_kg_tonne: 7.3,
                k_kg_tonne: 10.96,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk: 'Based on 95% DM content. NPK values taken from raw milk.',
            },
            bran_and_other_offals_of_wheat: {
                feed_name: 'Bran and other offals of wheat',
                energy_content_mj_tonne: 9612,
                n_kg_tonne: 25.4,
                p_kg_tonne: 10.3,
                k_kg_tonne: 12.4,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            'maize_gluten_60%': {
                feed_name: 'Maize gluten (60%)',
                energy_content_mj_tonne: 11303,
                n_kg_tonne: 96.8,
                p_kg_tonne: 2.5,
                k_kg_tonne: 1,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            brewers_and_distillers_grains_wet: {
                feed_name: 'Brewers and distillers grains (wet)',
                energy_content_mj_tonne: 3276,
                n_kg_tonne: 10.7,
                p_kg_tonne: 1,
                k_kg_tonne: 0.2,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            brewers_and_distillers_grains_dry: {
                feed_name: 'Brewers and distillers grains (dry)',
                energy_content_mj_tonne: 11115,
                n_kg_tonne: 34.2,
                p_kg_tonne: 4.5,
                k_kg_tonne: 0.5,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            dried_sugar_beet_pulp_molasses: {
                feed_name: 'Dried sugar beet pulp (molasses)',
                energy_content_mj_tonne: 11000,
                n_kg_tonne: 15.5,
                p_kg_tonne: 0.7,
                k_kg_tonne: 15.9,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            pot_ale_syrup: {
                feed_name: 'Pot ale syrup',
                energy_content_mj_tonne: 7392,
                n_kg_tonne: 25.2,
                p_kg_tonne: 9.9,
                k_kg_tonne: 10.4,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            molasses_sugar_cane: {
                feed_name: 'Molasses (sugar cane)',
                energy_content_mj_tonne: 9525,
                n_kg_tonne: 6.5,
                p_kg_tonne: 0.9,
                k_kg_tonne: 28.4,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            other_animal_feeds_forage: {
                feed_name: 'Other animal feeds - forage',
                energy_content_mj_tonne: 4095.1,
                n_kg_tonne: 8.98,
                p_kg_tonne: 1.0864207769533,
                k_kg_tonne: 8.1748132780083,
                ref_energy: 'Average of forage feeds values',
            },
            'other_animal_feeds_protein_approx_45%_protein': {
                feed_name: 'Other animal feeds - protein (approx. 45% protein)',
                energy_content_mj_tonne: 12052,
                n_kg_tonne: 77.5333333333333,
                p_kg_tonne: 16.7,
                k_kg_tonne: 14.5333333333333,
                ref_energy: 'Average of protein feeds values',
            },
            other_animal_feeds_energy: {
                feed_name: 'Other animal feeds - energy',
                energy_content_mj_tonne: 9766.4,
                n_kg_tonne: 33.88,
                p_kg_tonne: 4.86,
                k_kg_tonne: 13.62,
                ref_energy: 'Average of energy feeds values',
            }
        },
        STRAW: {
            _version: '0.1',
            straw: {
                feed_name: 'Straw',
                n_kg_tonne: 4.37,
                p_kg_tonne: 1.06,
                k_kg_tonne: 9.27,
            },
        },
        FERTILISERS: {
            _version: '0.1',
            dairy_cattle_slurry: {
                fertiliser_name: 'Dairy cattle slurry',
                fertiliser_type: 'Organic manures and slurries',
                unit: 'm³',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 3,
                p_kg_tonne: 0.523788738542121,
                k_kg_tonne: 2.9045643153527,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            beef_cattle_slurry: {
                fertiliser_name: 'Beef cattle slurry',
                fertiliser_type: 'Organic manures and slurries',
                unit: 'm³',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 2.3,
                p_kg_tonne: 0.523788738542121,
                k_kg_tonne: 2.24066390041494,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            pig_slurry: {
                fertiliser_name: 'Pig slurry',
                fertiliser_type: 'Organic manures and slurries',
                unit: 'm³',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 4,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.0746887966805,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            dirty_water: {
                fertiliser_name: 'Dirty water',
                fertiliser_type: 'Organic manures and slurries',
                unit: 'm³',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 0.3,
                p_kg_tonne: 0,
                k_kg_tonne: 0.24896265560166,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            cattle_fym: {
                fertiliser_name: 'Cattle FYM',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 5.9,
                p_kg_tonne: 1.35312090790048,
                k_kg_tonne: 5.47717842323651,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            pig_fym: {
                fertiliser_name: 'Pig FYM',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 6.5,
                p_kg_tonne: 2.66259275425578,
                k_kg_tonne: 5.39419087136929,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            sheep_fym: {
                fertiliser_name: 'Sheep FYM',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 6,
                p_kg_tonne: 0.872981230903536,
                k_kg_tonne: 2.4896265560166,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            broiler_litter: {
                fertiliser_name: 'Broiler litter',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 30,
                p_kg_tonne: 10.9122653862942,
                k_kg_tonne: 14.9377593360996,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            layer_litter: {
                fertiliser_name: 'Layer litter',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 16,
                p_kg_tonne: 5.67437800087298,
                k_kg_tonne: 7.46887966804979,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            duck_fym: {
                fertiliser_name: 'Duck FYM',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 6.5,
                p_kg_tonne: 2.40069838498472,
                k_kg_tonne: 6.22406639004149,
                npk: 'ADAS and Organic Research Centre (2002), Managing Manure on Organic Farms, DEFRA',
            },
            waste_food: {
                fertiliser_name: 'Waste food',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 1.6,
                p_kg_tonne: 0.305543430816237,
                k_kg_tonne: 0.16597510373444,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            green_waste_compost: {
                fertiliser_name: 'Green waste compost',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 7,
                p_kg_tonne: 1.22217372326495,
                k_kg_tonne: 4.39834024896266,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            other_organic_fertiliser: {
                fertiliser_name: 'Other organic fertiliser',
                fertiliser_type: 'Organic manures and slurries',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 1.5,
                p_kg_tonne: 0.218245307725884,
                k_kg_tonne: 0.4149377593361,
            },
            digested_liquid: {
                fertiliser_name: 'Digested liquid',
                fertiliser_type: 'Sewage sludge / biosolids',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 2,
                p_kg_tonne: 1.3094718463553,
                k_kg_tonne: 0.0829875518672199,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            digested_cake: {
                fertiliser_name: 'Digested cake',
                fertiliser_type: 'Sewage sludge / biosolids',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 11,
                p_kg_tonne: 7.85683107813182,
                k_kg_tonne: 0.497925311203319,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            thermally_dried: {
                fertiliser_name: 'Thermally dried',
                fertiliser_type: 'Sewage sludge / biosolids',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 40,
                p_kg_tonne: 30.5543430816237,
                k_kg_tonne: 1.6597510373444,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            lime_stabilised: {
                fertiliser_name: 'Lime stabilised',
                fertiliser_type: 'Sewage sludge / biosolids',
                unit: 't',
                organic_fertilisers: true,
                inorganic_fertilisers: false,
                n_kg_tonne: 8.5,
                p_kg_tonne: 11.348756001746,
                k_kg_tonne: 0.663900414937759,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            ammonium_nitrate: {
                fertiliser_name: 'Ammonium Nitrate (34% N)',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 340,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            ammonium_sulphate: {
                fertiliser_name: 'Ammonium Sulphate (21% N)',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 210,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            liquid_n: {
                fertiliser_name: 'Liquid N (24% N)',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 240,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            calcium_ammonium_nitrate: {
                fertiliser_name: 'Calcium ammonium nitrate',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 270,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            calcium_nitrate: {
                fertiliser_name: 'Calcium nitrate',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 155,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            urea: {
                fertiliser_name: 'Urea',
                fertiliser_type: 'Inorganic fertilisers - nitrogen',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 460,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            triple_superphosphate_tsp: {
                fertiliser_name: 'Triple superphosphate (TSP)',
                fertiliser_type: 'Inorganic fertilisers - phosphate',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 198,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            diammonium_phosphate_dap: {
                fertiliser_name: 'Di-ammonium phosphate (DAP)',
                fertiliser_type: 'Inorganic fertilisers - phosphate',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 180,
                p_kg_tonne: 200.7,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            monoammonium_phosphate_map: {
                fertiliser_name: 'Mono-ammonium phosphate (MAP)',
                fertiliser_type: 'Inorganic fertilisers - phosphate',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 120,
                p_kg_tonne: 226.9,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            rock_phosphate: {
                fertiliser_name: 'Rock phosphate',
                fertiliser_type: 'Inorganic fertilisers - phosphate',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 117.8,
                k_kg_tonne: 0,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            muriate_of_potash_mop: {
                fertiliser_name: 'Muriate of potash (MOP)',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 497.925311203319,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            sulphate_of_potash_sop: {
                fertiliser_name: 'Sulphate of potash (SOP)',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 414.9377593361,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            potassium_nitrate: {
                fertiliser_name: 'Potassium nitrate',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 373.44398340249,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            rock_potash: {
                fertiliser_name: 'Rock potash',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 83,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            kainit: {
                fertiliser_name: 'Kainit',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 91.2863070539419,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            sylvinite: {
                fertiliser_name: 'Sylvinite',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 29,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            msl_k: {
                fertiliser_name: 'MSL - K',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 66.4,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            cumulus_k: {
                fertiliser_name: 'Cumulus K',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 215.8,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            kali_vinasse: {
                fertiliser_name: 'Kali Vinasse',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 332,
                npk: 'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            patent_kali: {
                fertiliser_name: 'Patent Kali',
                fertiliser_type: 'Inorganic fertilisers - potassium',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 252,
                npk: 'BASF, Fertiliser Product Manual',
            },
            steelmaking_slag: {
                fertiliser_name: 'Steelmaking slag',
                fertiliser_type: 'Other inorganic fertilisers',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 210,
                k_kg_tonne: 0,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            ashed_poultry_manure: {
                fertiliser_name: 'Ashed poultry manure',
                fertiliser_type: 'Other inorganic fertilisers',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 87.2981230903536,
                k_kg_tonne: 82.9875518672199,
                npk: 'DEFRA (2010), RB209 Fertiliser Manual',
            },
            lime___other_applications_to_affect_soil_ph: {
                fertiliser_name: 'Lime / other applications to affect soil ph',
                fertiliser_type: 'Other inorganic fertilisers',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
                npk: 'Lime is a calcium and therefore has no N,P,K content.',
            },
            other_inorganic_fertiliser: {
                fertiliser_name: 'Other inorganic fertiliser',
                fertiliser_type: 'Other inorganic fertilisers',
                unit: 't',
                organic_fertilisers: false,
                inorganic_fertilisers: true,
                n_kg_tonne: 0,
                p_kg_tonne: 0,
                k_kg_tonne: 0,
            },
        },
        SEEDS: {
            _version: '0.1',
            wheat_feed: {
                seed_name: 'Wheat - feed',
                energy_content_mj_tonne: 10472,
                n_kg_tonne: 12.65,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.61,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            wheat_milling: {
                seed_name: 'Wheat - milling',
                energy_content_mj_tonne: 11782,
                n_kg_tonne: 12.65,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.61,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            barley: {
                seed_name: 'Barley',
                energy_content_mj_tonne: 11172,
                n_kg_tonne: 17,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.53,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            oats: {
                seed_name: 'Oats',
                energy_content_mj_tonne: 10406,
                n_kg_tonne: 14.45,
                p_kg_tonne: 2.97,
                k_kg_tonne: 3.63,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            rye: {
                seed_name: 'Rye',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 12.75,
                p_kg_tonne: 2.93,
                k_kg_tonne: 3.53,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            triticale: {
                seed_name: 'Triticale',
                energy_content_mj_tonne: 12180,
                n_kg_tonne: 17,
                p_kg_tonne: 9,
                k_kg_tonne: 6,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            peas: {
                seed_name: 'Peas',
                energy_content_mj_tonne: 11745,
                n_kg_tonne: 54,
                p_kg_tonne: 7.85,
                k_kg_tonne: 26.04,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            field_beans: {
                seed_name: 'Field beans',
                energy_content_mj_tonne: 11135,
                n_kg_tonne: 55.94,
                p_kg_tonne: 7.85,
                k_kg_tonne: 33.57,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            grass_clover: {
                seed_name: 'Grass/clover',
                energy_content_mj_tonne: 'no data',
                n_kg_tonne: 3,
                p_kg_tonne: 2,
                k_kg_tonne: 8,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            potatoes: {
                seed_name: 'Potatoes',
                energy_content_mj_tonne: 2680,
                n_kg_tonne: 2.7,
                p_kg_tonne: 0.261894369271061,
                k_kg_tonne: 4.08298755186722,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            vegetable_seeds: {
                seed_name: 'Vegetable seeds',
                energy_content_mj_tonne: 'no data',
                n_kg_tonne: 1,
                p_kg_tonne: 2,
                k_kg_tonne: 8,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            onion_sets: {
                seed_name: 'Onion sets',
                energy_content_mj_tonne: 1674,
                n_kg_tonne: 3,
                p_kg_tonne: 0.436490615451768,
                k_kg_tonne: 3.3195020746888,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'ADAS (2008), PLANET: Planning Land Applications of Nutrients for Efficiency and the Environment, version 2 and version 3',
            },
            forage_green_manure_leys: {
                seed_name: 'Forage/green manure/leys',
                energy_content_mj_tonne: 'no data',
                n_kg_tonne: 3,
                p_kg_tonne: 2,
                k_kg_tonne: 8,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
            other_seeds: {
                seed_name: 'Other seeds',
                energy_content_mj_tonne: 9542.6,
                n_kg_tonne: 9.01818181818182,
                p_kg_tonne: 2.76621681679298,
                k_kg_tonne: 5.02840814786873,
                ref_energy:
                    'Chamberlain, A.T., Wilkinson, J.M., (1996), Feeding the Dairy Cow, Chalcombe Publications',
                ref_npk:
                    'Watson, C., Topp, K., Stockdale, L.,  (2010), A Guide to Nutrient Budgeting on Organic Farms, Institute of Organic Training and Advice',
            },
        },
        PERMANENT_PASTURE: {
            _version: '0.1',
            permanent_pasture_high_clover_content: {
                crop_name: 'Permanent pasture (high clover content)',
                n_kg_ha: 60,
                ref_n_kg_ha: '60 per personal message from Christine Watson (SRUC).',
                unit: 'ha',
            },
            permanent_pasture_medium_clover_content: {
                crop_name: 'Permanent pasture (medium clover content)',
                n_kg_ha: 40,
                unit: 'ha',
            },
            permanent_pasture_low_clover_content: {
                crop_name: 'Permanent pasture (low clover content)',
                n_kg_ha: 20,
                unit: 'ha',
            },
            permanent_pasture_zero_clover_content: {
                crop_name: 'Permanent pasture (zero clover content)',
                n_kg_ha: 0,
                unit: 'ha',
            },
            pp_low_input_rough_grazing_high_clover_content: {
                crop_name: 'PP low input/rough grazing (high clover content)',
                n_kg_ha: 60,
                ref_n_kg_ha: '60 per personal message from Christine Watson (SRUC).',
                unit: 'ha',
            },
            pp_low_input_rough_grazing_medium_clover_content: {
                crop_name: 'PP low input/rough grazing (medium clover content)',
                n_kg_ha: 40,
                unit: 'ha',
            },
            pp_low_input_rough_grazing_low_clover_content: {
                crop_name: 'PP low input/rough grazing (low clover content)',
                n_kg_ha: 20,
                unit: 'ha',
            },
            pp_low_input_rough_grazing_zero_clover_content: {
                crop_name: 'PP low input/rough grazing (zero clover content)',
                n_kg_ha: 0,
                unit: 'ha',
            },
        },
        FORAGE_CROPS: {
            _version: '0.1',
            lucerne: {
                crop_name: 'Lucerne',
                n_kg_ha: 250,
                ref_n_kg_ha: '<500 per IOTA nutrient budgeting',
                unit: 'ha',
            },
            red_clover_ley: {
                crop_name: 'Red clover ley',
                n_kg_ha: 250,
                ref_n_kg_ha:
                    ' IOTA Nutrient budgeting guide gives 200-300 for a grass/red clover ley (grazed) and 300-400 for a grass/red-clover ley for silage',
                unit: 'ha',
            },
            temporary_pasture_1st_year_zero_clover_lucerne_content: {
                crop_name: 'Temporary pasture 1st year (zero clover/lucerne content)',
                n_kg_ha: 0,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_2nd_year_zero_clover_lucerne_content: {
                crop_name: 'Temporary pasture 2nd year (zero clover/lucerne content)',
                n_kg_ha: 0,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_3_years_zero_clover_lucerne_content: {
                crop_name: 'Temporary pasture 3 years (zero clover/lucerne content)',
                n_kg_ha: 0,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_1st_year_low_clover_lucerne_content: {
                crop_name: 'Temporary pasture 1st year (low clover/lucerne content)',
                n_kg_ha: 75,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_2nd_year_low_clover_lucerne_content: {
                crop_name: 'Temporary pasture 2nd year (low clover/lucerne content)',
                n_kg_ha: 112,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_3_years_low_clover_lucerne_content: {
                crop_name: 'Temporary pasture 3 years + (low clover/lucerne content)',
                n_kg_ha: 112,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_1st_year_medium_clover_lucerne_content: {
                crop_name: 'Temporary pasture 1st year (medium clover/lucerne content)',
                n_kg_ha: 75,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_2nd_year_medium_clover_lucerne_content: {
                crop_name: 'Temporary pasture 2nd year (medium clover/lucerne content)',
                n_kg_ha: 150,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_3_years_medium_clover_lucerne_content: {
                crop_name:
                    'Temporary pasture 3 years + (medium clover/lucerne content)',
                n_kg_ha: 150,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_1st_year_high_clover_lucerne_content: {
                crop_name: 'Temporary pasture 1st year (high clover/lucerne content)',
                n_kg_ha: 125,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_2nd_year_high_clover_lucerne_content: {
                crop_name: 'Temporary pasture 2nd year (high clover/lucerne content)',
                n_kg_ha: 187,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            temporary_pasture_3_years_high_clover_lucerne_content: {
                crop_name: 'Temporary pasture 3 years + (high clover/lucerne content)',
                n_kg_ha: 187,
                ref_n_kg_ha:
                    'IOTA nutrient budgeting guide gives 100-200 for grass/white clover ley.',
                unit: 'ha',
            },
            other_forage_crops: {
                crop_name: 'Other forage crop(s)',
                n_kg_ha: 120,
                ref_n_kg_ha:
                    'Average of the other dataset forage crops N kg/ha values.',
                unit: 'ha',
            }
        },
        FUELS: {
            _version: '0.1',red_diesel: {
                fuel_name: 'Red diesel',
                units: 'litres',
                energy_content_mj_per_unit: 38,
                co2_emissions: 2.63,
            },
            petrol: {
                fuel_name: 'Petrol',
                units: 'litres',
                energy_content_mj_per_unit: 36,
                co2_emissions: 2.315,
            },
            derv_diesel: {
                fuel_name: 'DERV diesel',
                units: 'litres',
                energy_content_mj_per_unit: 38,
                co2_emissions: 2.63,
            },
            lpg: {
                fuel_name: 'LPG',
                units: 'kg',
                energy_content_mj_per_unit: 50,
                co2_emissions: 1.51,
            },
            heating_oil: {
                fuel_name: 'Heating Oil',
                units: 'litres',
                energy_content_mj_per_unit: 38,
                co2_emissions: 2.52,
            },
            electricity: {
                fuel_name: 'Electricity',
                units: 'kWh',
                energy_content_mj_per_unit: 3.5997,
                co2_emissions: 0.537,
            },
            electricity_renewable: {
                fuel_name: 'Electricity - renewable',
                units: 'kWh',
                energy_content_mj_per_unit: 3.5997,
                co2_emissions: 0,
            },
            mains_gas: {
                fuel_name: 'Mains gas',
                units: 'm3',
                energy_content_mj_per_unit: 39.22,
                co2_emissions: 39.22,
            },
            woodfuel: {
                fuel_name: 'Woodfuel',
                units: 'kWh',
                energy_content_mj_per_unit: 3.5997,
                co2_emissions: 0,
            },
        },
        CONTRACTS: {
            _version: '0.1',
            contractor_operations_under_100hp: {
                contract_name: 'Contractor operations - under 100HP',
                units: 'hours',
                co2_emissions: 39.5,
            },
            contractor_operations_100_150_hp: {
                contract_name: 'Contractor operations - 100-150 HP',
                units: 'hours',
                co2_emissions: 60.5,
            },
            contractor_operations_150_200_hp: {
                contract_name: 'Contractor operations - 150-200 HP',
                units: 'hours',
                co2_emissions: 84.2,
            },
            contractor_operations_200_250_hp: {
                contract_name: 'Contractor operations - 200-250 HP',
                units: 'hours',
                co2_emissions: 107.8,
            },
            contractor_operations_over_250_hp: {
                contract_name: 'Contractor operations - over 250 HP',
                units: 'hours',
                co2_emissions: 139.4,
            },
            whole_crop_stubble_to_stubble: {
                contract_name: 'Whole crop - stubble to stubble',
                units: 'ha',
                co2_emissions: 2.63,
            },
            contractor_combine_harvesting: {
                contract_name: 'Contractor - Combine harvesting',
                units: 'ha',
                co2_emissions: 2.63,
            },
        },
        BENCHMARKING: {
            _version: '0.1',
            _reference:
                'J. M. Wilkinson. Re-defining efficiency of feed use by livestock. Animal (2011), 5:7, pp 1014–1022, doi:10.1017/S175173111100005X; FBS data',
            ARB: {
                name: 'Arable',
                total_energy: {
                    less_250: {
                        min: 0,
                        max: 250,
                        value: 6836,
                        unit: 'ha',
                    },
                    '250_400': {
                        min: 250,
                        max: 400,
                        value: 9546,
                        unit: 'ha',
                    },
                    greater_400: {
                        min: 400,
                        max: 1e300,
                        value: 9546,
                        unit: 'ha',
                    },
                },
            },
            BSH: {
                name: 'Beef and Sheep',
                edible_mj_mj_in_animal_product: 3.4,
                total_energy: {
                    per_head: {
                        value: 546,
                        unit: 'head',
                    },
                },
            },
            DAR: {
                name: 'Dairy',
                edible_mj_mj_in_animal_product: 0.5,
                total_energy: {
                    less_88: {
                        min: 0,
                        max: 88,
                        value: 4205,
                        unit: 'head',
                    },
                    '88_140': {
                        min: 88,
                        max: 140,
                        value: 3721,
                        unit: 'head',
                    },
                    greater_140: {
                        min: 140,
                        max: 1e300,
                        value: 3498,
                        unit: 'head',
                    },
                },
            },
            PIG: {
                name: 'Pigs',
                edible_mj_mj_in_animal_product: 6.3,
                vet_and_med_expenditure_cost_per_head: 71.9247215794439,
                total_energy: {
                    less_88: {
                        min: 0,
                        max: 1200,
                        value: 1298,
                        unit: 'head',
                    },
                    '88_140': {
                        min: 1200,
                        max: 2100,
                        value: 234,
                        unit: 'head',
                    },
                    greater_140: {
                        min: 2100,
                        max: 1e300,
                        value: 239,
                        unit: 'head',
                    },
                },
            },
            PLT: {
                name: 'Poultry - Meat',
                edible_mj_mj_in_animal_product: 3.3,
                vet_and_med_expenditure_cost_per_head: 0.54,
                total_energy: {
                    less_200000: {
                        min: 0,
                        max: 20000,
                        value: 5,
                        unit: 'head',
                    },
                    greater_200000: {
                        min: 20000,
                        max: 1e300,
                        value: 1,
                        unit: 'head',
                    },
                },
            },
            PEG: {
                name: 'Poultry - Eggs',
                edible_mj_mj_in_animal_product: 3.6,
                vet_and_med_expenditure_cost_per_head: 0.115,
                total_energy: {
                    less_75000: {
                        min: 0,
                        max: 75000,
                        value: 12,
                        unit: 'head',
                    },
                    greater_75000: {
                        min: 75000,
                        max: 1e300,
                        value: 10,
                        unit: 'head',
                    },
                },
            },
            BEF: {
                name: 'Beef cows',
                vet_and_med_expenditure_cost_per_head: 30.8441950031197,
            },
            SHP: {
                name: 'Sheep',
                vet_and_med_expenditure_cost_per_head: 7.82177983431453,
            },
        },
    }

    var form = {
        categories: {
            initialdata: {
                title: "Initial data",
                heading: {
                    html: true,
                    content: '<p>The data input on this sheet are input on a farm-gate basis. i.e if  wheat is grown for feed and used on the farm then it is not added to the export column or the import column although it is shown in the hectare and yield columns.</p><p>Where weights are required these are fresh weights.</p><p>Imports/exports are for a 12 month period.</p>'
                },
                indicators: {
                    initialdata_farminfo: {
                        title: "Farm information",
                        question_groups: {
                            initialdata_prodmodegroup: {
                                heading: {
                                    html: false,
                                    content: "Time since organic conversion started"
                                },
                                helper: {
                                    html: false,
                                    content: "If you haven't started your conversion leave it as zero"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    columns: [
                                        'Years',
                                        'Months'
                                    ]
                                },
                                question_codes: [
                                    [ 'initialdata_farminfo_prodmodeyears' ],
                                    [ 'initialdata_farminfo_prodmodemonths' ]
                                ]
                            },
                            initialdata_fullyorggroup: {
                                heading: {
                                    html: false,
                                    content: "Time since fully organic"
                                },
                                helper: {
                                    html: false,
                                    content: "If you aren't fully organic leave it as zero"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    columns: [
                                        'Years',
                                        'Months'
                                    ]
                                },
                                question_codes: [
                                    [ 'initialdata_farminfo_fullyorgyears' ],
                                    [ 'initialdata_farminfo_fullyorgmonths' ]
                                ]
                            }
                        },
                        questions: {
                            initialdata_farminfo_farmname: {
                                question_name: "Farm name",
                                compulsory: true,
                                question_type: QUESTION_TYPE.TEXT
                            },
                            initialdata_farminfo_dates: {
                                question_name: "Dates covered",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "Insert start date considering this should be a 12 month period"
                                },
                                question_type: QUESTION_TYPE.DATE
                            },
                            initialdata_farminfo_ownership: {
                                question_name: "Own farm or tenant farmer?",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If both, give one which is predominant",
                                },
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Owner occupier", answer_code: 0 },
                                    { answer_name: "Successional tenant", answer_code: 1 },
                                    { answer_name: "Farm Business Tenancy <= 5 years", answer_code: 2 },
                                    { answer_name: "Farm Business Tenancy > 5 years", answer_code: 3 },
                                    { answer_name: "Short term let (< 12 months)", answer_code: 4 },
                                    { answer_name: "Other (please specify)", answer_code: 5 }
                                ]
                            },
                            initialdata_farminfo_ownershipother: {
                                question_name: "Other type of ownership",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_farminfo_ownership",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 5
                                    }
                                ],
                                question_type: QUESTION_TYPE.TEXT,
                            },
                            initialdata_farminfo_soiltype: {
                                question_name: "Dominant soil type",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Sandy and light soil", answer_code: 0 },
                                    { answer_name: "Medium soil", answer_code: 1 },
                                    { answer_name: "Heavy soil", answer_code: 2 },
                                    { answer_name: "Chalk and limestone soil", answer_code: 3 },
                                    { answer_name: "Peaty soil", answer_code: 4 }
                                ]
                            },
                            initialdata_farminfo_rainfall: {
                                question_name: "Annual rainfall",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: 'mm'
                            },
                            initialdata_farminfo_altitude: {
                                question_name: "Altitude",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: 'metres above sea level'
                            },
                            initialdata_farminfo_prodmodeyears: {
                                question_name: "Number of years since organic conversion started",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If you haven't started your conversion or if your conversion started less than a year ago, leave it as zero"
                                },
                                question_group: 'initialdata_prodmodegroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "years",
                            },
                            initialdata_farminfo_prodmodemonths: {
                                question_name: "Number of months since organic conversion started",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If you haven't started your conversion or if your conversion started less than a year ago, leave it as zero"
                                },
                                question_group: 'initialdata_prodmodegroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "months",
                            },
                            initialdata_farminfo_fullyorgyears: {
                                question_name: "Number of years fully organic",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If you aren't fully organic, leave it as zero"
                                },
                                question_group: 'initialdata_fullyorggroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "years",
                            },
                            initialdata_farminfo_fullyorgmonths: {
                                question_name: "Number of months fully organic",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If you aren't fully organic, leave it as zero"
                                },
                                question_group: 'initialdata_fullyorggroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "months",
                            },
                            initialdata_farminfo_agrienvscheme: {
                                question_name: "What is the level of agri-environmental participation?",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Cross compliance", answer_code: 0 },
                                    { answer_name: "OELS or ELS", answer_code: 1 },
                                    { answer_name: "OELS/ELS/HLS or ESA or countryside stewardship", answer_code: 2 }
                                ]
                            },
                            initialdata_farminfo_region: {
                                question_name: "Region",
                                helper: {
                                    html: false,
                                    content: "For FBS purposes"
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "North", answer_code: 0 },
                                    { answer_name: "East", answer_code: 1 },
                                    { answer_name: "West", answer_code: 2 }
                                ]
                            },
                            initialdata_farminfo_lessfavouredarea: {
                                question_name: "Is more than 50% of your land in a less favoured area (LFA)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            initialdata_farminfo_fbsclassification: {
                                question_name: "FBS classification",
                                compulsory: false,
                                question_type: QUESTION_TYPE.TEXT,
                                auto_calc: true,
                                precedents: [],
                            },
                        }
                    },
                    initialdata_crops: {
                        title: "Crops",
                        question_groups: {
                            initialdata_crops: {
                                title: "Crops",
                                helper: {
                                    html: true,
                                    content: '<p>If you have crops on your farm, please fill a data row for each one of them. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a crop is added. If a crop is not available on the given list, please choose "Other" and describe which one is.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_cropname',
                                        'initialdata_crops_cropnameother',
                                        'initialdata_crops_croparea',
                                        'initialdata_crops_cropmarketableyield',
                                        'initialdata_crops_cropyieldexport'
                                    ]
                                ]
                            },
                            initialdata_foragecrops: {
                                title: "Forage crops",
                                helper: {
                                    html: true,
                                    content: '<p>If you grow forage crops on your farm, please fill a data row for each of them. All fields with <span style="color: red; font-weight: bold;">*</span>  are compulsory if a forage crop is added. If a forage crop is not available on the given list, please choose "Other" and describe which one it is.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_foragecropname',
                                        'initialdata_crops_foragecropnameother',
                                        'initialdata_crops_foragecroparea'
                                    ]
                                ]
                            },
                            initialdata_permanentpasture: {
                                title: "Permanent pasture and rough grazing",
                                helper: {
                                    html: true,
                                    content: '<p>If you have permanent pastures on your farm, please fill a data row for each one of them. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a permanent pasture is added. If a permanent pasture is not available on the given list, please choose "Other" and describe which one is.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_permanentpasturename',
                                        'initialdata_crops_permanentpasturenameother',
                                        'initialdata_crops_permanentpasturearea'
                                    ]
                                ]
                            }
                        },
                        questions: {
                            initialdata_crops_cropname: {
                                question_name: "Crop",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no crops selected -",
                                question_group: 'initialdata_crops',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.CROPS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return { answer_name: data[1].crop_name, answer_code: data[0] }
                                    }
                                )
                            },
                            initialdata_crops_cropnameother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_cropname",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_fruit", "other_non-woody_energy_crop", "other_veg", "other_crop" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_crops',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            initialdata_crops_croparea: {
                                question_name: "Area",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_cropname",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                question_group: 'initialdata_crops',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "ha",
                            },
                            initialdata_crops_cropmarketableyield: {
                                question_name: "Marketable yield",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_cropname",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_crops',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "t/ha",
                            },
                            initialdata_crops_cropyieldexport: {
                                question_name: "Yield Exported",
                                guidance: {
                                    html: true,
                                    content: "This is the amount leaving the farm as an export. If you grow a crop that is only used on the farm, e.g. for feed or seed, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_cropname",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_crops',
                                answer_limits: { min: 0 },
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_crops_foragecropname: {
                                question_name: "Forage crop",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no forage crops selected -",
                                question_group: 'initialdata_foragecrops',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.FORAGE_CROPS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return { answer_name: data[1].crop_name, answer_code: data[0] }
                                    }
                                )
                            },
                            initialdata_crops_foragecropnameother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_foragecropname",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_forage_crops" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_foragecrops',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            initialdata_crops_foragecroparea: {
                                question_name: "Area",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_foragecropname",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_foragecrops',
                                answer_limits: { min: 0 },
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "ha"
                            },
                            initialdata_crops_permanentpasturename: {
                                question_name: "Permanent pasture and rough grazing",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no permanent pastures selected -",
                                question_group: 'initialdata_permanentpasture',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.PERMANENT_PASTURE)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return { answer_name: data[1].crop_name, answer_code: data[0] }
                                    }
                                )
                            },
                            initialdata_crops_permanentpasturenameother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_permanentpasturename",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_permanent_pastures" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_permanentpasture',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_crops_permanentpasturearea: {
                                question_name: "Area",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_crops_permanentpasturename",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_permanentpasture',
                                answer_limits: { min: 0 },
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "ha",
                            },
                            initialdata_crops_moorland: {
                                question_name: "Moorland",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_crops_other: {
                                question_name: "Other (e.g game cover)",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_crops_ponds: {
                                question_name: "Ponds and watercourses",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_crops_noncropped: {
                                question_name: "Designated non cropped nature reserve land / agri-environmental land (e.g field margins, wild bird mixtures)",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_crops_othernonagriculturalland: {
                                question_name: "Other non agricultural land",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_crops_built: {
                                question_name: "Built up land including roads",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            }
                        }
                    },
                    initialdata_woodland: {
                        title: "Farm Woodland and Agroforestry",
                        question_groups: {
                            initialdata_woodland: {
                                title: "Farm woodland",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,question_group_headers: {
                                    rows: [
                                        'Conifer under 10 years',
                                        'Conifer 10-20 years',
                                        'Conifer over 20 years',
                                        'Broadleaved under 10 years',
                                        'Broadleaved 10-20 years',
                                        'Broadleaved over 20 years',
                                        'Mixed woodland'
                                    ],
                                    columns: [
                                        'Area',
                                        'Yield exported'
                                    ]
                                },
                                question_codes: [
                                    [
                                        'initialdata_woodland_coniferunder10area',
                                        'initialdata_woodland_coniferunder10export',
                                    ],
                                    [
                                        'initialdata_woodland_conifer1020area',
                                        'initialdata_woodland_conifer1020export'
                                    ],
                                    [
                                        'initialdata_woodland_coniferover20area',
                                        'initialdata_woodland_coniferover20export'
                                    ],
                                    [
                                        'initialdata_woodland_broadleavedunder10area',
                                        'initialdata_woodland_broadleavedunder10export'
                                    ],
                                    [
                                        'initialdata_woodland_broadleaved1020area',
                                        'initialdata_woodland_broadleaved1020export'
                                    ],
                                    [
                                        'initialdata_woodland_broadleavedover20area',
                                        'initialdata_woodland_broadleavedover20export'
                                    ],
                                    [
                                        'initialdata_woodland_mixedwoodlandarea',
                                        'initialdata_woodland_mixedwoodlandexport'
                                    ]
                                ]
                            },
                            initialdata_hedges: {
                                title: 'Hedges',
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'initialdata_woodland_hedgelength' ],
                                    [ 'initialdata_woodland_hedgefuelharvested' ],
                                    [ 'initialdata_woodland_hedgefuelyield' ],
                                    [ 'initialdata_woodland_hedgefuelyieldtotal' ],
                                    [ 'initialdata_woodland_hedgefuelexport' ]
                                ]
                            }
                        },
                        questions: {
                            initialdata_woodland_coniferunder10area: {
                                question_name: "Conifer under 10 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_coniferunder10export: {
                                question_name: "Conifer under 10 years - Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_coniferunder10area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_conifer1020area: {
                                question_name: "Conifer 10-20 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_conifer1020export: {
                                question_name: "Conifer 10-20 years - Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_conifer1020area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_coniferover20area: {
                                question_name: "Conifer over 20 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_coniferover20export: {
                                question_name: "Conifer over 20 years - Tonnes Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_coniferover20area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_broadleavedunder10area: {
                                question_name: "Broadleaved under 10 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_broadleavedunder10export: {
                                question_name: "Broadleaved under 10 years - Tonnes Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_broadleavedunder10area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_broadleaved1020area: {
                                question_name: "Broadleaved 10-20 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_broadleaved1020export: {
                                question_name: "Broadleaved 10-20 years - Tonnes Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_broadleaved1020area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_broadleavedover20area: {
                                question_name: "Broadleaved over 20 years",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_broadleavedover20export: {
                                question_name: "Broadleaved over 20 years - Tonnes Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_broadleavedover20area",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_mixedwoodlandarea: {
                                question_name: "Mixed woodland",
                                question_group: 'initialdata_woodland',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            initialdata_woodland_mixedwoodlandexport: {
                                question_name: "Mixed woodland - Tonnes Exported",
                                compulsory: false,
                                question_group: 'initialdata_woodland',
                                compulsoryIf: [
                                    {
                                        question: "initialdata_woodland_mixedwoodlandarea",
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_woodland_hedgelength: {
                                question_name: "Total hedges",
                                compulsory: false,
                                question_group: 'initialdata_hedges',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "km"
                            },
                            initialdata_woodland_hedgefuelharvested: {
                                question_name: "Total length of hedgerow managed for fuel",
                                compulsory: false,
                                question_group: 'initialdata_hedges',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "km"
                            },
                            initialdata_woodland_hedgefuelyield: {
                                question_name: "Woodfuel yield (tonnes per km of hedgerow)",
                                compulsory: false,
                                question_group: 'initialdata_hedges',
                                guidance: {
                                    html: false,
                                    content: "Assuming that 1km of hedgerow at correct stage to coppice will produce approximately 100 tonnes of woodchip at 30% mc. with a 15 year coppice cycle, this gives 6.67 tonnes/km/year."
                                },
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_default: 6.67,
                                answer_unit: "t/km"
                            },
                            initialdata_woodland_hedgefuelyieldtotal: {
                                question_name: "Total woodfuel yield",
                                compulsory: false,
                                question_group: 'initialdata_hedges',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                                auto_calc: true,
                                precedents: [ 'initialdata_woodland_hedgefuelharvested', 'initialdata_woodland_hedgefuelyield' ]
                            },
                            initialdata_woodland_hedgefuelexport: {
                                question_name: "Woodfuel yield exported",
                                compulsory: false,
                                question_group: 'initialdata_hedges',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "t"
                            },
                        }
                    },
                    initialdata_landuse: {
                        title: "Land use",
                        question_groups: {
                            initialdata_summaryoflanduse: {
                                heading: {
                                    html: false,
                                    content: "Here is a summary of your land use based on your previous answers in this section. Please check to ensure that the figures add up to your total farm area."
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'initialdata_landuse_totalarea' ],
                                    [ 'initialdata_landuse_totalarablearea' ],
                                    [ 'initialdata_landuse_totalgrassarea' ],
                                    [ 'initialdata_landuse_totalUAA' ],
                                    [ 'initialdata_landuse_totalwoodland' ],
                                    [ 'initialdata_landuse_totalotherland' ],
                                    [ 'initialdata_landuse_totalbuiltupland' ]
                                ]
                            }
                        },
                        questions: {
                            initialdata_landuse_totalarablearea: {
                                question_name: "Total arable area",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_crops_croparea', 'initialdata_crops_foragecroparea' ]
                            },
                            initialdata_landuse_totalgrassarea: {
                                question_name: "Total grass (permanent) area",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_crops_permanentpasturearea', 'initialdata_crops_moorland', 'initialdata_crops_other' ]
                            },
                            initialdata_landuse_totalUAA: {
                                question_name: "Total UAA (utilisable agricultural area)",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_landuse_totalarablearea', 'initialdata_landuse_totalgrassarea' ]
                            },
                            initialdata_landuse_totalwoodland: {
                                question_name: "Total woodland area",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_woodland_coniferunder10area', 'initialdata_woodland_conifer1020area', 'initialdata_woodland_coniferover20area', 'initialdata_woodland_broadleavedunder10area', 'initialdata_woodland_broadleaved1020area', 'initialdata_woodland_broadleavedover20area', 'initialdata_woodland_mixedwoodlandarea' ]
                            },
                            initialdata_landuse_totalotherland: {
                                question_name: "Other land",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_crops_ponds', 'initialdata_crops_noncropped', 'initialdata_crops_othernonagriculturalland' ]
                            },
                            initialdata_landuse_totalbuiltupland: {
                                question_name: "Total built-up land",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_crops_built' ]
                            },
                            initialdata_landuse_totalarea: {
                                question_name: "Total area",
                                question_group: "initialdata_summaryoflanduse",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                precedents: [ 'initialdata_landuse_totalUAA', 'initialdata_landuse_totalwoodland', 'initialdata_landuse_totalotherland', 'initialdata_landuse_totalbuiltupland' ]
                            },
                        }
                    },
                    initialdata_seedsfeeds: {
                        title: "Imported Seeds and Feeds",
                        question_groups: {
                            initialdata_seeds: {
                                title: "Seeds",
                                helper: {
                                    html: true,
                                    content: '<p>If you import seeds, please fill a data row for each seed type. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a seed type is added. If some type of seeds is not available on the given list, please choose "Other" and describe it. <b>If you grow a seed crop that is then used on your farm (i.e. not imported or exported), you don\'t need to include it here.</b></p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_seedstype',
                                        'initialdata_seedsfeeds_seedstypeother',
                                        'initialdata_seedsfeeds_seedsimport',
                                        'initialdata_seedsfeeds_seedsexport'
                                    ]
                                ]
                            },
                            initialdata_feeds: {
                                title: "Feeds",
                                helper: {
                                    html: true,
                                    content: '<p>If you import feeds, please fill a data row for each feed type. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a feed type is added. If some type of feeds is not available on the given list, please choose "Other" and describe it. <b>If you grow a feed that is then used on your farm (i.e. not imported or exported), you don\'t need to include it here.</b></p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_feedstype',
                                        'initialdata_seedsfeeds_feedstypeother',
                                        'initialdata_seedsfeeds_feedsimport',
                                        'initialdata_seedsfeeds_feedsexport'
                                    ]
                                ]
                            },
                            initialdata_arablestraw: {
                                title: "Arable straw",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_arablestrawimport',
                                        'initialdata_seedsfeeds_arablestrawexport'
                                    ]
                                ]
                            },
                        },
                        questions: {
                            initialdata_seedsfeeds_seedstype: {
                                question_name: "Seed type",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no seeds selected -",
                                question_group: 'initialdata_seeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.SEEDS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return {
                                            answer_name: data[1].seed_name,
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            initialdata_seedsfeeds_seedstypeother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_seedstype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_seeds" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_seeds',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_seedsfeeds_seedsimport: {
                                question_name: "Import",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of seed imported onto the farm in the 12 month period. If there were no imports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_seedstype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_seeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_seedsfeeds_seedsexport: {
                                question_name: "Export",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of seed exported from the farm in the 12 month period. If there were no exports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_seedstype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_seeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_seedsfeeds_feedstype: {
                                question_name: "Feed type",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no feeds selected -",
                                question_group: 'initialdata_feeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.FEEDS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return {
                                            answer_name: data[1].feed_name,
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            initialdata_seedsfeeds_feedstypeother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_feedstype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_feeds',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_seedsfeeds_feedsimport: {
                                question_name: "Import",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of feed imported onto the farm in the 12 month period. If there were no imports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_feedstype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_feeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_seedsfeeds_feedsexport: {
                                question_name: "Export",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of feed exported from the farm in the 12 month period. If there were no exports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_seedsfeeds_feedstype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_feeds',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_seedsfeeds_arablestrawimport: {
                                question_name: "Arable straw - Import",
                                compulsory: false,
                                guidance: {
                                    html: false,
                                    content: "This is the amount of arable straw imported onto the farm in the 12 month period. If there were no imports, add a zero here."
                                },
                                question_group: 'initialdata_arablestraw',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "t"
                            },
                            initialdata_seedsfeeds_arablestrawexport: {
                                question_name: "Arable straw - Export",
                                compulsory: false,
                                guidance: {
                                    html: false,
                                    content: "This is the amount of arable straw exported from the farm in the 12 month period. If there were no exports, add a zero here."
                                },
                                question_group: 'initialdata_arablestraw',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "t"
                            },
                        }
                    },
                    initialdata_fertilisers: {
                        title: "Organic and inorganic fertiliser",
                        question_groups: {
                            initialdata_organicfertilisers: {
                                title: "Organic fertilisers",
                                helper: {
                                    html: true,
                                    content: '<p>If you use organic fertilisers, please fill a data row for each organic fertiliser. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if an organic fertiliser is added. If some type of organic fertiliser is not available on the given list, please choose "Other" and describe it.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_fertilisers_organictype',
                                        'initialdata_fertilisers_organictypeother',
                                        'initialdata_fertilisers_organicimport',
                                        'initialdata_fertilisers_organicexport',
                                        'initialdata_fertilisers_organicn',
                                        'initialdata_fertilisers_organicp',
                                        'initialdata_fertilisers_organick'
                                    ]
                                ]
                            },
                            initialdata_inorganicfertilisers: {
                                title: "Inorganic fertilisers",
                                helper: {
                                    html: true,
                                    content: '<p>If you use inorganic fertilisers, please fill a data row for each inorganic fertiliser. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a inorganic fertiliser is added. If some type of inorganic fertiliser is not available on the given list, please choose "Other" and describe it.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_fertilisers_inorganictype',
                                        'initialdata_fertilisers_inorganictypeother',
                                        'initialdata_fertilisers_inorganicimport',
                                        'initialdata_fertilisers_inorganicn',
                                        'initialdata_fertilisers_inorganicp',
                                        'initialdata_fertilisers_inorganick'
                                    ]
                                ]
                            },
                        },
                        questions: {
                            initialdata_fertilisers_organictype: {
                                question_name: "Organic fertiliser type",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no organic fertilisers selected -",
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.FERTILISERS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .filter(data => data[1].organic_fertilisers == true)
                                    .map(function(data) {
                                        return {
                                            answer_name: data[1].fertiliser_name,
                                            answer_code: data[0]
                                        }
                                    })
                            },
                            initialdata_fertilisers_organictypeother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_organic_fertiliser" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_fertilisers_organicimport: {
                                question_name: "Import",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_fertilisers_organicexport: {
                                question_name: "Export",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "t",
                            },
                            initialdata_fertilisers_organicn: {
                                question_name: "New fertiliser - N",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_organic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 14 kg nitrogen. Multiply that value per ten to have the N kg/t, i.e., 140 N kg/t."
                                }
                            },
                            initialdata_fertilisers_organicp: {
                                question_name: "New fertiliser - P",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_organic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 12.7 kg phosphorus. Multiply that value per ten to have the P kg/t, i.e., 127 P kg/t."
                                }
                            },
                            initialdata_fertilisers_organick: {
                                question_name: "New fertiliser - K",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_organictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_organic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_organicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 8 kg potassium. Multiply that value per ten to have the K kg/t, i.e., 80 K kg/t."
                                }
                            },
                            initialdata_fertilisers_inorganictype: {
                                question_name: "Inorganic fertiliser type",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no inorganic fertilisers selected -",
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.FERTILISERS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .filter(data => data[1].inorganic_fertilisers == true)
                                    .map(function(data) {
                                        return {
                                            answer_name: data[1].fertiliser_name,
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            initialdata_fertilisers_inorganictypeother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_inorganictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_inorganic_fertiliser" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_fertilisers_inorganicimport: {
                                question_name: "Import",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_inorganictype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "t",
                            },
                            initialdata_fertilisers_inorganicn: {
                                question_name: "New fertiliser - N",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_inorganictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_inorganic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 14 kg nitrogen. Multiply that value per ten to have the N kg/t, i.e., 140 N kg/t."
                                }
                            },
                            initialdata_fertilisers_inorganicp: {
                                question_name: "New fertiliser - P",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_inorganictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_inorganic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 12.7 kg phosphorus. Multiply that value per ten to have the P kg/t, i.e., 127 P kg/t."
                                }
                            },
                            initialdata_fertilisers_inorganick: {
                                question_name: "New fertiliser - K",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_fertilisers_inorganictype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other_inorganic_fertiliser" ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_inorganicfertilisers',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "kg/t",
                                guidance: {
                                    html: false,
                                    content: "Fertilisers contain different amounts of nutrients, affecting the amount of the fertiliser you need. The nutrients are often written on the bag or packing slip as percentages, or as N:P:K (nitrogen:phosphorus:potassium). 14:12.7:8 means that in 100 kg, there is 8 kg potassium. Multiply that value per ten to have the K kg/t, i.e., 80 K kg/t."
                                }
                            },
                        }
                    },
                    initialdata_livestock: {
                        title: "Livestock",
                        question_groups: {
                            initialdata_livestock: {
                                title: "Livestock (including tack grazing cattle/ flying flocks)",
                                helper: {
                                    html: true,
                                    content: '<p>If you have livestock on your farm, please fill a data row for each livestock type. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a livestock type is added. If some type of livestock is not available on the given list, please choose "Other" and describe it.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_livestock_type',
                                        'initialdata_livestock_typeother',
                                        'initialdata_livestock_nranimals',
                                        'initialdata_livestock_import',
                                        'initialdata_livestock_export'
                                    ]
                                ]
                            },
                            initialdata_livestockproducts: {
                                title: "Livestock products",
                                helper: {
                                    html: true,
                                    content: '<p>If you produce some livestock product on your farm, please fill a data row for each. All fields with <span style="color: red; font-weight: bold;">*</span> are compulsory if a livestock product is added. If some type of livestock product is not available on the given list, please choose "Other" and describe it. Also, indicate its quantity measuring unit (e.g. tonnes, liters).</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_livestock_producttype',
                                        'initialdata_livestock_producttypeother',
                                        'initialdata_livestock_productimport',
                                        'initialdata_livestock_productexport'
                                    ]
                                ]
                            },
                        },
                        questions: {
                            initialdata_livestock_type: {
                                question_name: "Livestock",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no livestock selected -",
                                question_group: 'initialdata_livestock',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.LIVESTOCK)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return {
                                            answer_name: data[1].livestock_name,
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            initialdata_livestock_typeother: {
                                question_name: "If you selected 'Other' please describe which one",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_type",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_livestock',
                                answer_type: ANSWER_TYPE.ARRAY
                            },
                            initialdata_livestock_nranimals: {
                                question_name: "Average no. of animals held on farm over 12 month period",
                                guidance: {
                                    html: false,
                                    content: "Livestock numbers on a farm can vary throughout the year. If numbers of livestock change considerably, the easiest way to work out the average is to list how many of each livestock type are present in each month and then work out the average (add all 12 months together and divide by 12)."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_type",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_livestock',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "no.",
                            },
                            initialdata_livestock_import: {
                                question_name: "Import",
                                guidance: {
                                    html: false,
                                    content: "This is the number of animals imported onto the farm in the 12 month period. Animals born on the farm should not be included. If there were no imports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_type",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_livestock',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "no.",
                            },
                            initialdata_livestock_export: {
                                question_name: "Export (including deaths)",
                                guidance: {
                                    html: false,
                                    content: "This is the number of animals exported from the farm in the 12 month period. If there were no exports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_type",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_livestock',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "no.",
                            },
                            initialdata_livestock_producttype: {
                                question_name: "Livestock product",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_placeholder: "- no livestock products selected -",
                                question_group: 'initialdata_livestockproducts',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.LIVESTOCK_PRODUCTS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return {
                                            answer_name: data[1].livestock_product_name,
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            initialdata_livestock_producttypeother: {
                                question_name: "If you selected 'Other' describe which one and its quantity measuring unit",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_producttype",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ "other" ]
                                    }
                                ],
                                toSpecifyWhich: true,
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'initialdata_livestockproducts',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            initialdata_livestock_productimport: {
                                question_name: "Import",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of livestock product imported onto the farm in the 12 month period. If there were no imports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_producttype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_livestockproducts',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_limits: { min: 0 },
                                answer_unit: "no.",
                            },
                            initialdata_livestock_productexport: {
                                question_name: "Export",
                                guidance: {
                                    html: false,
                                    content: "This is the amount of livestock product exported from the farm in the 12 month period. If there were no exports, add a zero here."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_producttype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'initialdata_livestockproducts',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                        }
                    },
                }
            },
            soilmanagement: {
                title: "Soil Management",
                /*heading: {
                    html: false,
                    content: "Questions are based on the following references: MAFF (1993), Davis and Smith (2009), DEFRA (2009), University of Hertfordshire (2006)",
                },*/
                indicators: {
                    soilmanagement_analysis: {
                        title: "Soil analysis",
                        questions: {
                            soilmanagement_analysis_often: {
                                question_name: "How often do you undertake soil analysis?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Never", answer_code: 0 },
                                    { answer_name: "I test every 5+ years", answer_code: 1 },
                                    { answer_name: "I test a few fields every few years", answer_code: 2 },
                                    { answer_name: "I test some fields every two years, or on grassland test every 5 years", answer_code: 3 },
                                    { answer_name: "I test some fields every year to monitor long-term change", answer_code: 4 }
                                ]
                            },
                            soilmanagement_analysis_somlevels: {
                                question_name: "Are you increasing, decreasing or maintaining Soil Organic Matter levels?",
                                helper: {
                                    html: false,
                                    content: "If no testing is carried out then the \"Don't know\" option should be used here."
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Don't know", answer_code: 0 },
                                    { answer_name: "Heavy loss", answer_code: 1 },
                                    { answer_name: "Slight loss", answer_code: 2 },
                                    { answer_name: "Maintaining levels", answer_code: 3 },
                                    { answer_name: "Slight gain", answer_code: 4 },
                                    { answer_name: "Large gain", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    soilmanagement_management: {
                        title: "Soil management",
                        questions: {
                            soilmanagement_management_barearableland: {
                                question_name: "What % of arable land is left bare over the winter?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0%", answer_code: 1 },
                                    { answer_name: "1-25%", answer_code: 2 },
                                    { answer_name: "25-50%", answer_code: 3 },
                                    { answer_name: "50-75%", answer_code: 4 },
                                    { answer_name: "75-100%", answer_code: 5 }
                                ]
                            },
                            soilmanagement_management_harvestedbeforewinter: {
                                question_name: "What % of cropped arable land (not including pasture) is harvested before the 1st of October?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0-20%", answer_code: 1 },
                                    { answer_name: "21-40%", answer_code: 2 },
                                    { answer_name: "41-60%", answer_code: 3 },
                                    { answer_name: "61-80%", answer_code: 4 },
                                    { answer_name: "81-100%", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    soilmanagement_wintergrazing: {
                        title: "Winter grazing",
                        compulsoryIf: [
                            {
                                question: 'initialdata_livestock_type',
                                evaluate: EVALUATORS.NOT_EMPTY
                            }
                        ],
                        questions: {
                            soilmanagement_wintergrazing_outwinterlivestock: {
                                question_name: "Do you out-winter livestock?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Yes, pigs", answer_code: 1 },
                                    { answer_name: "Yes, cattle/horses", answer_code: 2 },
                                    { answer_name: "Yes, sheep/goats", answer_code: 3 },
                                    { answer_name: "Yes, hens", answer_code: 4 },
                                    { answer_name: "No", answer_code: 5 }
                                ]
                            },
                            soilmanagement_wintergrazing_poaching: {
                                question_name: "Is there any poaching over winter?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Large amount", answer_code: 1 },
                                    { answer_name: "Significant amount", answer_code: 2 },
                                    { answer_name: "Partial damage spread over a wide area of land", answer_code: 3 },
                                    { answer_name: "Little damage", answer_code: 4 },
                                    { answer_name: "None", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    soilmanagement_erosion: {
                        title: "Soil erosion",
                        question_groups: {
                            soilmanagement_landaffectederosion: {
                                title: "Please report % of land affected by the following:",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'soilmanagement_erosion_sheet' ],
                                    [ 'soilmanagement_erosion_rill' ],
                                    [ 'soilmanagement_erosion_gully' ],
                                    [ 'soilmanagement_erosion_ponding' ],
                                    [ 'soilmanagement_erosion_capping' ],
                                    [ 'soilmanagement_erosion_wind' ],
                                    [ 'soilmanagement_erosion_other' ]
                                ]
                            },
                        },
                        questions: {
                            soilmanagement_erosion_sheet: {
                                question_name: "Sheet erosion",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_rill: {
                                question_name: "Rill erosion",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_gully: {
                                question_name: "Gully erosion",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_ponding: {
                                question_name: "Ponding",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_capping: {
                                question_name: "Capping of soil surface",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_wind: {
                                question_name: "Wind erosion",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                            soilmanagement_erosion_other: {
                                question_name: "Other soil damage/erosion",
                                compulsory: true,
                                question_group: "soilmanagement_landaffectederosion",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "40-50%", answer_code: 0 },
                                    { answer_name: "20-30%", answer_code: 1 },
                                    { answer_name: "10-20%", answer_code: 2 },
                                    { answer_name: "1-10%", answer_code: 3 },
                                    { answer_name: "0%", answer_code: 4 }
                                ]
                            },
                        }
                    },
                    soilmanagement_measureserosion: {
                        title: "Measures taken to reduce the risk of erosion",
                        questions: {
                            soilmanagement_measureserosion_cultivation: {
                                question_name: "On what % of your cultivated land are you implementing cultivation that reduces risk of erosion (e.g. minimum tillage and contour ploughing)?",
                                helper: {
                                    html: false,
                                    content: "Use the \"N/A\" option if you land is not subject to erosion."
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "None", answer_code: 1 },
                                    { answer_name: "1-25%", answer_code: 2 },
                                    { answer_name: "25-50%", answer_code: 3 },
                                    { answer_name: "50% plus", answer_code: 4 }
                                ]
                            },
                            soilmanagement_measureserosion_reducerisk: {
                                question_name: "Are you implementing measures to reduce the risk of erosion and run off?",
                                helper: {
                                    html: false,
                                    content: "Use the \"N/A\" option if you land is not subject to erosion."
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No action being taken", answer_code: 1 },
                                    { answer_name: "Low intensity measures (e.g. unploughed stubble left over winter)", answer_code: 2 },
                                    { answer_name: "Low-medium intensity measures (e.g. undersowing crops)", answer_code: 3 },
                                    { answer_name: "Medium intensity measures (e.g. planting grass strips and shelterbelts)", answer_code: 4 },
                                    { answer_name: "High intensity measures (e.g. converting arable back to permanent pasture)", answer_code: 5 }
                                ]
                            },
                        }
                    }
                }
            },
            agrienvironmentalmanagement: {
                title: "Agri-environmental management",
                indicators: {
                    agrienvironmentalmanagement_participation: {
                        title: "Agri-environmental participation",
                        questions: {
                            agrienvironmentalmanagement_participation_howmanyoptions: {
                                question_name: "How many environmental management options do you undertake on your farm?",
                                compulsory: true,
                                helper: {
                                    html: true,
                                    content: "<p><strong>GENERAL OPTIONS</strong></p><p><strong>Hedgerow management</strong></p><p>• Hedge height kept above 1.5 m (except when laid or coppiced)<br>• No cultivation or application of manures or agrochemicals within 2m of the centre of the hedge<br>• Cut no more than once every 2 years<br>• Do not cut all hedges in same year<br>• No cutting during bird-breeding season (March to August)<br>• Hedges with over 10% gap planted up with locally native shrubs</p><p><strong>Ditch management</strong></p><p>• Do not cultivate or apply fertilisers or pesticides to land within 2 m of centre of ditch<br>• Bank vegetation cut once every two years during winter moths, cutting no more than half of total length of ditches<br>• Cleaned between September & January using only mechanical means (including hand tools)<br>• Do not move, re-profile or increase the width or depth of the ditch</p><p><strong>Establishment of hedgerow trees</strong></p><p>• Select locally native tree species<br>• Trees established at irregular spacing at least 20m apart</p><p><strong>Management of woodland edges</strong></p><p>• Do not cultivate or apply fertilisers or manures within 6 m of the woodland edge<br>• Do not feed livestock or locate water troughs near the woodland edge<br>• Only apply herbicides to  control of injurious weeds or invasive non-native species</p><p><strong>Buffering in-field ponds</strong></p><p>• Leave at least 10m between the pond edge & field<br>• Cut no more than once every 5 years<br>• Do not apply fertilisers or manures<br>• Only apply herbicides to control of injurious weeds or invasive non-native species<br>• Limit livestock access</p><p><strong>ARABLE OPTIONS</strong></p><p><strong>Field corner management</strong></p><p>• Establish or maintain a field corner by sowing or natural regeneration<br>• Do not use field corners for regular vehicular access, turning or storage<br>• Only apply herbicides to control of injurious weeds or invasive non-native species<br>• Cut no more than once every 5 years<br>• Do not cut between March & August<br>• Do not apply fertilisers or manure</p><p><strong>Un-harvested cereal headlands</strong></p><p>• 3m+ wide cereal headland along the edge of arable crop<br>• Left unharvest until following spring (March)<br>• Do not apply insecticides between March & following harvest</p><p><strong>Uncropped, cultivated margins for rare plants</strong></p><p>• 3m+ wide margins managed according to the requirements of target species<br>• Do not apply any fertilisers or manures</p><p><strong>Uncropped, cultivated areas for birds</strong></p><p>• A cultivated area (at least 1 ha) retained until end of July<br>• Do not apply any fertilisers or manures</p><p><strong>Over-wintered stubbles</strong></p><p>• Do not apply any pesticides, fertilisers, manures or lime to the stubble<br>• Do not apply pre-harvest desiccants or post-harvest herbicides<br>• Stubble kept until February</p><p><strong>Beetle banks</strong></p><p>• Create or maintain an earth ridge 2m-4m wide sown with a mixture of perennial grasses<br>• Do not apply any pesticides, fertilisers or manures</p><p><strong>Skylark plots</strong></p><p>• Plots created either by leaving an unsown plot or by spraying out the plots by December with a herbicide<br>• Plots should be at least 3m wide and have a minimum area of 16m² and at least 50 m into the field from edge</p><p><strong>Undersow spring cereal</strong></p><p>• Undersow spring cereal crop (not maize) with a grass ley<br>• Keep Undersow plant growth until the cereal crop is harvested<br>• Do not destroy grass ley before July of the following year</p><p><strong>Winter cover crop</strong></p><p>• Establish a cover crop by September to provide a dense cover and protect from soil erosion<br>• Do not apply any fertilisers or manures</p><p><strong>Buffer strips for watercourses</strong></p><p>• Establish or maintain a grassy strip 6m+ wide<br>• Do not apply any fertilisers or manures<br>• Do not use for regular vehicular access, turning or storage<br>• Do not graze the buffer strip<br></p><p><strong>LIVESTOCK OPTIONS</strong></p><p><strong>Maintenance of woodland fences</strong></p><p>• Fences are in a stock-proof condition</p><p><strong>Low input permanent grassland</strong></p><p>• Do not plough, cultivate or re-seed<br>• Total rate of nitrogen must not exceed 100 kg/ha nitrogen per year of which a maximum of 50kg/ha can be inorganic</p><p><strong>Maintenance of watercourse fences</strong></p><p>• Fences in a stock-proof condition to exclude livestock</p>"
                                },
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "1 to 2", answer_code: 1 },
                                    { answer_name: "3", answer_code: 2 },
                                    { answer_name: "4", answer_code: 3 },
                                    { answer_name: "5 or more", answer_code: 4 },
                                    { answer_name: "N/A", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    agrienvironmentalmanagement_rarespecies: {
                        title: "Rare species",
                        questions: {
                            agrienvironmentalmanagement_rarespecies_monitorflorafauna: {
                                question_name: "Do you survey/monitor flora and fauna species on your farm?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, and take action to increase numbers of species", answer_code: 0 },
                                    { answer_name: "Yes, monitor but don't take action", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 }
                                ]
                            },
                            agrienvironmentalmanagement_rarespecies_rarespecies: {
                                question_name: "How many of the rare/red list species (some of which are listed below) do you have evidence of on your farm?",
                                compulsory: true,
                                helper: {
                                    html: true,
                                    content: "<table><tbody><tr><th style=\"width: 33%;\">Birds</th><th style=\"width: 33%;\">Butterflies</th><th style=\"width: 33%;\">Mammals</th></tr><tr style=\"vertical-align: top;\"><td>Aquatic warbler<br>Bittern<br>Black grouse<br>Black-tailed godwit<br>Black throated Diver<br>Bullfinch<br>Capercaillie<br>Cirl bunting<br>Common Scoter<br>Corn bunting<br>Corncrake<br>Grasshopper warbler<br>Grey partridge<br>Egyptian Geese<br>European Greater White fronted Goose<br>Fish eagle<br>Hedge Accentor<br>Hen harrier<br>Herring Gull<br>House sparrow<br>Lesser Redpoll<br>Lesser spotted woodpecker<br>Linnet<br>Marsh tit<br>Marsh warbler<br>Nightjar<br>Northern Lapwing<br>Oyster catchers<br>Red-backed shrike<br>Red grouse<br>Red-necked phalarope<br>Reed bunting<br>Ring ouzel<br>Roseate tern<br>Savi's warbler<br>Scottish Crossbill<br>Shell duck<br>Skylark<br>Song thrush<br>Spotted flycatcher<br>Starling<br>Stone Curlew<br>Swallows<br>Swifts<br>Tree pipit<br>Tree sparrow<br>Turtle dove<br>Twite<br>White-tailed eagle<br>Willow tit<br>Woodlark<br>Woodpecker greater spotted<br>Wryneck<br>Yellowhammer<br>Yellow wagtail<br></td><td>Large tortoiseshell<br>Heath fritillary<br>High Brown fritillary<br>Swallowtail<br>Glanville fritillary<br>Silver spotted skipper<br>Grayling<br>Silver studded blue<br>Black hairstreak<br>Chequered skipper<br>Adonis blue<br>Brown hairstreak<br>Duke of Burgundy<br>Lulworth skipper<br>Marsh fritillary<br>Mountain ringlet<br>Northern brown argus<br>Pearl bordered fritillary<br>Purple emperor<br>Silver-studded blue<br>White-letter hairstreak<br>Wood white<br>Large blue<br>Large heath<br>Scotch argus<br>Large Copper Butterfly<br></td><td>Water vole<br>Barbastelle Bat<br>Brown hare<br>Dormouse<br>Bechsteins bat<br>Otter<br>Pine marten<br>Pole cat<br>Greater mouse-eared bat<br>Pipistrelle bat<br>Greater Horseshoe bat<br>Red squirrel<br></td></tr></tbody></table>"
                                },
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_rarespecies_monitorflorafauna",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "0 to 3", answer_code: 0 },
                                    { answer_name: "4 to 5", answer_code: 1 },
                                    { answer_name: "6 to 7", answer_code: 2 },
                                    { answer_name: "8 to 9", answer_code: 3 },
                                    { answer_name: "10 or more", answer_code: 4 }
                                ]
                            },
                        }
                    },
                    agrienvironmentalmanagement_conservationplan: {
                        title: "Conservation plan",
                        questions: {
                            agrienvironmentalmanagement_conservationplan_writtenplan: {
                                question_name: "Do you have a written voluntary conservation plan?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "LEAF", answer_code: 1 },
                                    { answer_name: "Whole farm plan developed", answer_code: 2 },
                                    { answer_name: "Whole farm conservation plan and acted on /revised regularly", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    agrienvironmentalmanagement_thirdpartyendorsement: {
                        title: "3rd party endorsement",
                        questions: {
                            agrienvironmentalmanagement_thirdpartyendorsement_havereceived: {
                                question_name: "Have you received any 3rd party endorsement for your biodiversity activities (including awards but excluding certifications such as organic or LEAF)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Yes, local 3rd party endorsement(s)", answer_code: 1 },
                                    { answer_name: "Yes, regional 3rd party endorsement(s)", answer_code: 2 },
                                    { answer_name: "Yes, national 3rd party endorsement(s)", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    agrienvironmentalmanagement_habitat: {
                        title: "Habitat",
                        questions: {
                            agrienvironmentalmanagement_habitat_percpp: {
                                question_name: "Percentage of land which is permanent pasture",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "%",
                                answer_limits: { min: 0, max: 100 },
                                precedents: [ 'initialdata_crops_permanentpasturearea', 'initialdata_landuse_totalarea' ]
                            },
                            agrienvironmentalmanagement_habitat_perclowinputpp: {
                                question_name: "Percentage of permanent pasture which is managed as \"low input\" or \"very low input\"",
                                helper: {
                                    html: true,
                                    content: "<p>As defined on pages 107-8 of the <a href=\"http://publications.naturalengland.org.uk/publication/2810267\" target=\"_blank\">OELS handbook</a> and pages 95-96 of the <a href=\"http://publications.naturalengland.org.uk/publication/2798159\" target=\"_blank\">ELS handbook</a></p>"
                                },
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "%",
                                answer_limits: { min: 0, max: 100 },
                                precedents: [ 'initialdata_crops_permanentpasturearea' ]
                            },
                            agrienvironmentalmanagement_habitat_bufferstrips: {
                                question_name: "What percentage of your arable area contains buffer strips / field margins?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0%", answer_code: 1 },
                                    { answer_name: "1-25%", answer_code: 2 },
                                    { answer_name: "26-50%", answer_code: 3 },
                                    { answer_name: "51-75%", answer_code: 4 },
                                    { answer_name: "76-100%", answer_code: 5 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_wintercover: {
                                question_name: "What percentage of your arable land is left as over-wintered stubble or as wild bird cover (wild bird seed mixtures)?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0%", answer_code: 1 },
                                    { answer_name: "1-25%", answer_code: 2 },
                                    { answer_name: "26-50%", answer_code: 3 },
                                    { answer_name: "51-75%", answer_code: 4 },
                                    { answer_name: "76-100%", answer_code: 5 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_nativewoodland: {
                                question_name: "What is the amount of land that is woodland consisting of native species - broadleaved, mixed or coniferous?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_unit: "ha",
                                answer_limits: { min: 0 },
                                precedents: [ 'initialdata_landuse_totalarea' ]
                            },
                            agrienvironmentalmanagement_habitat_woodlandmanagement: {
                                question_name: "To what extent do you manage farm woodland?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Not at all", answer_code: 1 },
                                    { answer_name: "Manage some woodland edges", answer_code: 2 },
                                    { answer_name: "Manage all woodland edges", answer_code: 3 },
                                    { answer_name: "Woodland management for conservation/biodiversity", answer_code: 4 },
                                    { answer_name: "Very active woodland management for conservation/biodiversity", answer_code: 5 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_excludelivestock: {
                                question_name: "Do you exclude livestock from woodland?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 },
                                    { answer_name: "No, but graze as part of wood pasture management", answer_code: 2 },
                                    { answer_name: "No", answer_code: 3 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_protecttrees: {
                                question_name: "Do you protect in-field trees?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_wildlifehabitat: {
                                question_name: "Do you have wildlife habitats (e.g. wet grassland) or are you restoring and/or establishing wildlife habitats on your land? If so, how much land is a wildlife habitat as a percentage of total land area?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "0-5%", answer_code: 0 },
                                    { answer_name: "6-10%", answer_code: 1 },
                                    { answer_name: "11-15%", answer_code: 2 },
                                    { answer_name: "16-20%", answer_code: 3 },
                                    { answer_name: ">20%", answer_code: 4 }
                                ]
                            },
                            agrienvironmentalmanagement_habitat_monitor: {
                                question_name: "Do you monitor habitats and maintain them as necessary to ensure that they are in good condition, if so how regularly?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Not monitored", answer_code: 1 },
                                    { answer_name: "Monitored rarely (5+ years)", answer_code: 2 },
                                    { answer_name: "Monitored infrequently (3 years) and maintained if necessary or carry out standard maintenance without monitoring", answer_code: 3 },
                                    { answer_name: "Monitored frequently (2 years) and maintained if necessary", answer_code: 4 },
                                    { answer_name: "Monitored regularly (yearly) and maintained if necessary", answer_code: 5 }
                                ]
                            },
                        }
                    },
                    agrienvironmentalmanagement_pesticides: {
                        title: "Herbicide and other pesticide use",
                        helper: {
                            html: true,
                            content: "<p>These questions are derived from the <a href=\"www.voluntaryinitiative.org.uk\" target=\"_blank\">Voluntary Initiative</a>, the DEFRA booklet on <a href=\"http://adlib.everysite.co.uk/adlib/defra/content.aspx?id=000IL3890W.197YTQKKNYWEFG\" target=\"_blank\">\"Pesticides and Integrated Farm Management\"</a>, and the DEFRA, HSC and Welsh government booklet <a href=\"http://adlib.everysite.co.uk/adlib/defra/content.aspx?id=000HK277ZX.0D4VT736AL655T\" target=\"_blank\">\"Pesticides: Code of practice for using plant protection products\"</a></p>"
                        },
                        questions: {
                            agrienvironmentalmanagement_pesticides_use: {
                                question_name: "Do you use herbicides, insecticides, fungicides or other products (e.g. straw shorteners)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, on a field scale", answer_code: 0 },
                                    { answer_name: "Yes, but only spot treatment", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_avoid: {
                                question_name: "When using such products do you avoid ponds, hedgerows, woodland, rough grazing and species-rich grassland?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes", answer_code: 0 },
                                    { answer_name: "Mostly", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 },
                                    { answer_name: "N/A", answer_code: 3 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_impact: {
                                question_name: "When using pesticides/other control measures do you consider impact on beneficial species?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, and target applications to minimise environmental impact", answer_code: 0 },
                                    { answer_name: "Yes, monitor impact and act on results", answer_code: 1 },
                                    { answer_name: "Yes, monitor impact", answer_code: 2 },
                                    { answer_name: "No", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_amount: {
                                question_name: "When using pesticides/other control measures, how do you decide on amounts to use?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Use same amount each year / estimate amount", answer_code: 0 },
                                    { answer_name: "Based on advice on label of product", answer_code: 1 },
                                    { answer_name: "Evaluation of risk from pests and dosing to reduce it to a non-damaging level", answer_code: 2 },
                                    { answer_name: "Using advice from a BASIS qualified advisor", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_sprayer: {
                                question_name: "How often do you calibrate and maintain the sprayer?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Don't do so", answer_code: 0 },
                                    { answer_name: "Only if there's an issue", answer_code: 1 },
                                    { answer_name: "Every two years", answer_code: 2 },
                                    { answer_name: "Annually", answer_code: 3 },
                                    { answer_name: "Every time the sprayer is used", answer_code: 4 },
                                    { answer_name: "N/A", answer_code: 5 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_watercontamination: {
                                question_name: "Do you take action to prevent contamination of water courses, lakes and ponds?",
                                helper: {
                                    html: false,
                                    content: "Considering not just sprays but also granular products such as metaldehyde."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, I carry out 3 or more of the precautions listed here: store away from drains and water courses, use low drift techniques when spraying (avoid windy conditions, reduce boom height, change nozzles, use buffer zones)", answer_code: 0 },
                                    { answer_name: "Yes, I carry out 1 or 2 of the precautions listed here: store away from drains and water courses, use low drift techniques when spraying (avoid windy conditions, reduce boom height, change nozzles, use buffer zones)", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 },
                                    { answer_name: "N/A", answer_code: 3 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_beessafety: {
                                question_name: "Do you consider the safety of bees when selecting which pesticides to use?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "N/A", answer_code: 2 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_beessafetyspray: {
                                question_name: "Do you consider the safety of bees by spraying late in the evening when they are not working and by not spraying flowering plants?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "N/A", answer_code: 2 }
                                ]
                            },
                            agrienvironmentalmanagement_pesticides_birdssafety: {
                                question_name: "Do you consider the safety of birds when using dressed seeds or pesticides in granular/pellet form by ensuring that they do not remain on the soil surface but are fully incorporated?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "agrienvironmentalmanagement_pesticides_use",
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "N/A", answer_code: 2 }
                                ]
                            },
                        }
                    }
                }
            },
            landscapeheritage: {
                title: "Landscape and Heritage Features",
                indicators: {
                    landscapeheritage_historicfeatures: {
                        title: "Historic features",
                        helper: {
                            html: true,
                            content: "Based on Farm Environment Plan Manual 3rd Edition (Natural England, 2010)"
                        },
                        questions: {
                            landscapeheritage_historicfeatures_present: {
                                question_name: "Are there historic features present on the farm (including archaeological features, traditional buildings, listed monuments)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            landscapeheritage_historicfeatures_maintenance: {
                                question_name: "How much maintenance/care do you give them?",
                                helper: {
                                    html: false,
                                    content: "In the case of archaeological features a high level of care may involve keeping them buried and not ploughing/cultivating in the areas where they exist."
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'landscapeheritage_historicfeatures_present',
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Little", answer_code: 1 },
                                    { answer_name: "Some", answer_code: 2 },
                                    { answer_name: "Much", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    landscapeheritage_landscapefeatures: {
                        title: "JCA and landscape features",
                        helper: {
                            html: true,
                            content: "Based on Nature on the Map (Natural England, 2010)"
                        },
                        questions: {
                            landscapeheritage_landscapefeatures_characteristicfarm: {
                                question_name: "How characteristic is the farm compared to traditional farms in your area?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Not at all", answer_code: 0 },
                                    { answer_name: "Little", answer_code: 1 },
                                    { answer_name: "Partially", answer_code: 2 },
                                    { answer_name: "Mostly", answer_code: 3 },
                                    { answer_name: "Fully", answer_code: 4 }
                                ]
                            },
                        }
                    },
                    landscapeheritage_boundaries: {
                        title: "Management of boundaries",
                        helper: {
                            html: true,
                            content: "Based on Farm Environment Plan Manual 3rd Edition (Natural England, 2010)"
                        },
                        questions: {
                            landscapeheritage_boundaries_hev: {
                                question_name: "Do you have High Environmental Value (HEV) boundaries on your farm?",
                                compulsory: true,
                                helper: {
                                    html: true,
                                    content: "These include stone walls, stone-faced banks, earth banks, hedges, hedgebanks, lines of trees, ditches, relics of boundaries of historic importance (see <a href=\"http://naturalengland.etraderstores.com/NaturalEnglandShop/NE264\" target=\"_blank\">FEP manual p47-54</a> for definition of boundaries)"
                                },
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Less than 100m", answer_code: 1 },
                                    { answer_name: "100-2500m", answer_code: 2 },
                                    { answer_name: "Greater than 5% of all boundaries", answer_code: 3 },
                                    { answer_name: "Greater than 10% of all boundaries", answer_code: 4 }
                                ]
                            },
                            landscapeheritage_boundaries_hedgerowtrees: {
                                question_name: "How many hedgerow trees per 100m do you have on the farm?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'landscapeheritage_boundaries_hev',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 1, 2, 3, 4 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Less than 1", answer_code: 0 },
                                    { answer_name: "1 to 2", answer_code: 1 },
                                    { answer_name: "3 to 4", answer_code: 2 },
                                    { answer_name: "5 to 10", answer_code: 3 },
                                    { answer_name: "Greater than 10", answer_code: 4 }
                                ]
                            },
                            landscapeheritage_boundaries_restore: {
                                question_name: "Are you taking action to restore/manage appropriate boundary features (e.g hedges, hedge banks, earth banks, stone faced banks, stone walls, ditches)?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'landscapeheritage_boundaries_hev',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 1, 2, 3, 4 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Partly / Infrequently", answer_code: 1 },
                                    { answer_name: "Regularly / Frequently", answer_code: 2 }
                                ]
                            },
                        }
                    },
                    landscapeheritage_geneticheritage: {
                        title: "Genetic heritage",
                        questions: {
                            landscapeheritage_geneticheritage_rarebreeds: {
                                question_name: "Do you farm any Rare Breeds Survival Trust watchlist breeds?",
                                helper: {
                                    html: true,
                                    content: "<a href=\"http://www.rbst.org.uk/\" target=\"_blank\">http://www.rbst.org.uk/</a>"
                                },
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes, one", answer_code: 1 },
                                    { answer_name: "Yes, more than one", answer_code: 2 }
                                ]
                            },
                            landscapeheritage_geneticheritage_crops: {
                                question_name: "Do you farm using heritage varieties of crops?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes, one", answer_code: 1 },
                                    { answer_name: "Yes, more than one", answer_code: 2 }
                                ]
                            },
                        }
                    }
                }
            },
            water: {
                title: "Water Management",
                indicators: {
                    water_protection: {
                        title: "Implementation of measures to minimise water pollution and maximise water efficiency",
                        questions: {
                            water_protection_actions: {
                                question_name: "What intensity of action(s) is/are being taken for water resource protection?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No action being taken", answer_code: 0 },
                                    { answer_name: "Low intensity actions being taken, eg: selecting suitable stock types and levels", answer_code: 1 },
                                    { answer_name: "Medium intensity actions being taken, eg: non inversion tillage or contour ploughing", answer_code: 2 },
                                    { answer_name: "High intensity actions being taken, eg: planting and maintaining riparian/buffer strips", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            }
                        }
                    },
                    water_flood: {
                        title: "Flood defence and runoff prevention",
                        questions: {
                            water_flood_mitigationsystem: {
                                question_name: "What is the condition of your flood defense or water runoff mitigation system?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Non-existent / Don't know", answer_code: 0 },
                                    { answer_name: "Poor", answer_code: 1 },
                                    { answer_name: "Average", answer_code: 2 },
                                    { answer_name: "Above average", answer_code: 3 },
                                    { answer_name: "Very good", answer_code: 4 },
                                    { answer_name: "N/A", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    water_plan: {
                        title: "Water audit and management plan",
                        questions: {
                            water_plan_completed: {
                                question_name: "Have you completed a water audit/management plan and if so are you acting on it?",
                                compulsory: true,
                                helper: {
                                    html: false,
                                    content: "If you abstract water or irrigate you should (and from 2012 you must) draw up and implement a water management plan to assess and minimise your impact on the local water resources."
                                },
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes but not acting on yet", answer_code: 1 },
                                    { answer_name: "Yes and acting on partly", answer_code: 2 },
                                    { answer_name: "Yes and acting on mostly", answer_code: 3 },
                                    { answer_name: "Yes and acting on fully", answer_code: 4 },
                                    { answer_name: "N/A", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    water_harvesting: {
                        title: "Water harvesting",
                        questions: {
                            water_harvesting_recycled: {
                                question_name: "How much of the water you use on farm is recycled?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Little", answer_code: 1 },
                                    { answer_name: "More than half", answer_code: 2 },
                                    { answer_name: "Most", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            },
                            water_harvesting_raingroundwater: {
                                question_name: "How much rainwater or groundwater do you harvest for use on farm?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Little", answer_code: 1 },
                                    { answer_name: "A significant amount", answer_code: 2 },
                                    { answer_name: "A large amount", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            }
                        }
                    },
                    water_irrigation: {
                        title: "Irrigation",
                        helper: {
                            html: false,
                            content: "Based on Improving irrigation efficiency checklist (Cranfield University at Silsoe, 2007)"
                        },
                        questions: {
                            water_irrigation_crops: {
                                question_name: "Do you irrigate crops?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_landuse_totalUAA',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 },
                                    { answer_name: "N/A", answer_code: 2 }
                                ]
                            },
                            water_irrigation_uaairrigated: {
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    },
                                    {
                                        question: 'initialdata_landuse_totalUAA',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_name: "What % of Utilised Agricultural Area (UAA) is irrigated using mains or abstracted water?",
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0-20%", answer_code: 1 },
                                    { answer_name: "21-40%", answer_code: 2 },
                                    { answer_name: "41-60%", answer_code: 3 },
                                    { answer_name: "61-80%", answer_code: 4 },
                                    { answer_name: "81-100%", answer_code: 5 }
                                ]
                            },
                            water_irrigation_appsystem: {
                                question_name: "What application system do you use?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Rain Gun", answer_code: 1 },
                                    { answer_name: "Boom", answer_code: 2 },
                                    { answer_name: "Trickle", answer_code: 3 },
                                    { answer_name: "Mix of the above", answer_code: 4 }
                                ]
                            },
                            water_irrigation_rate: {
                                question_name: "Do you know the rate of water (e.g. cubic metres per hour) applied by your system?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "Based on manufacturers recommendation", answer_code: 2 },
                                    { answer_name: "Measured a long time ago", answer_code: 3 },
                                    { answer_name: "Measured infrequently", answer_code: 4 },
                                    { answer_name: "Measured routinely", answer_code: 5 }
                                ]
                            },
                            water_irrigation_pressure: {
                                question_name: "Does your irrigation system operate at its design pressure in each field?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "Don't know", answer_code: 2 },
                                    { answer_name: "Yes in some fields", answer_code: 3 },
                                    { answer_name: "Yes in most fields", answer_code: 4 },
                                    { answer_name: "Yes in all fields", answer_code: 5 }
                                ]
                            },
                            water_irrigation_uniformity: {
                                question_name: "How uniformly does your system apply water within each field?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Don't know", answer_code: 1 },
                                    { answer_name: "Major variation", answer_code: 2 },
                                    { answer_name: "Some variation", answer_code: 3 },
                                    { answer_name: "Minor variation", answer_code: 4 },
                                    { answer_name: "Very little variation", answer_code: 5 }
                                ]
                            },
                            water_irrigation_weatherconditions: {
                                question_name: "Do you modify your irrigation applications in response to forecast/weather conditions?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "Yes infrequently", answer_code: 2 },
                                    { answer_name: "Yes regularly", answer_code: 3 },
                                    { answer_name: "Yes often", answer_code: 4 },
                                    { answer_name: "Yes always", answer_code: 5 }
                                ]
                            },
                            water_irrigation_summerirri: {
                                question_name: "Do you summer irrigate from mains/abstracted water or collect/store water over winter and extract when necessary?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Summer irrigate from mains/abstracted water", answer_code: 1 },
                                    { answer_name: "Summer irrigate from stored/collected water", answer_code: 2 }
                                ]
                            },
                            water_irrigation_system: {
                                question_name: "What is the physical condition of your pumping, distribution and application system?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "water_irrigation_crops",
                                        evaluate: EVALUATORS.EQUALS,
                                        value: 1
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Don't know", answer_code: 1 },
                                    { answer_name: "Poor", answer_code: 2 },
                                    { answer_name: "Average", answer_code: 3 },
                                    { answer_name: "Above average", answer_code: 4 },
                                    { answer_name: "Very good condition", answer_code: 5 }
                                ]
                            },
                        }
                    }
                }
            },
            npkbudget: {
                title: "NPK budget",
                indicators: {
                    npkbudget_nutrientbalance: {
                        title: "Nutrient balance",
                        helper: {
                            html: true,
                            content: `<table border="0">
                            <tr>
                            <th style="width: 20%; ">Nitrogen kg/ha</th>
                            <th style="width: 20%">Sustainability</th>
                            <th style="width: 45%">Phosporus and Potassium kg/ha</th>
                            <th style="width: 15%">Sustainability</th>
                            </tr>
                            <tr>
                            <td>0-50 kg/ha</td>
                            <td>Excellent - Very Good</td>
                            <td>Surplus/defecit less than 5 kg/ha</td>
                            <td>Very good - Excellent</td>
                            </tr>
                            <tr>
                            <td>50-70 kg/ha</td>
                            <td>Very Good - Good</td>
                            <td>Surplus/defecit of greater than 5kg/ha, less than 10kg/ha</td>
                            <td>Average - Good</td>
                            </tr>
                            <tr>
                            <td>70-90 kg/ha</td>
                            <td>Good - Average</td>
                            <td>Surplus/defecit of greater than 10 kg/ha</td>
                            <td>Poor - very poor</td>
                            </tr>
                            <tr>
                            <td>90-110 kg/ha</td>
                            <td>Average - Poor</td>
                            <td></td>
                            <td></td>
                            </tr>
                            <tr>
                            <td>110-130 kg/ha plus+</td>
                            <td>Poor - very poor</td>
                            <td></td>
                            <td></td>
                            </tr>
                            </table>`
                        },
                        question_groups: {
                            npkbudget_nutrientbalance_farmgatebudget: {
                                title: "Farm gate NPK budget in kg",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [
                                        'IN',
                                        'OUT',
                                        'Balance',
                                        'Ratio OUT:IN',
                                        'Balance per ha',
                                        'Sustainability'
                                    ],
                                    rows: [
                                        'N',
                                        'P',
                                        'K'
                                    ]
                                },
                                question_codes: [
                                    [
                                        'npkbudget_nutrientbalance_nin',
                                        'npkbudget_nutrientbalance_nout',
                                        'npkbudget_nutrientbalance_nbalance',
                                        'npkbudget_nutrientbalance_nratiooutin',
                                        'npkbudget_nutrientbalance_nbalanceha',
                                        'npkbudget_nutrientbalance_nbalancehasustainability'
                                    ],
                                    [
                                        'npkbudget_nutrientbalance_pin',
                                        'npkbudget_nutrientbalance_pout',
                                        'npkbudget_nutrientbalance_pbalance',
                                        'npkbudget_nutrientbalance_pratiooutin',
                                        'npkbudget_nutrientbalance_pbalanceha',
                                        'npkbudget_nutrientbalance_pbalancehasustainability'
                                    ],
                                    [
                                        'npkbudget_nutrientbalance_kin',
                                        'npkbudget_nutrientbalance_kout',
                                        'npkbudget_nutrientbalance_kbalance',
                                        'npkbudget_nutrientbalance_kratiooutin',
                                        'npkbudget_nutrientbalance_kbalanceha',
                                        'npkbudget_nutrientbalance_kbalancehasustainability'
                                    ],
                                ]
                            },
                        },
                        questions: {
                            npkbudget_nutrientbalance_nin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_pin: {
                                question_name: "P - IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_kin: {
                                question_name: "K - IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_nout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_pout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_kout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_nratiooutin: {
                                question_name: "N Ratio OUT:IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: " : 1"
                            },
                            npkbudget_nutrientbalance_pratiooutin: {
                                question_name: "P Ratio OUT:IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: " : 1"
                            },
                            npkbudget_nutrientbalance_kratiooutin: {
                                question_name: "K Ratio OUT:IN",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: " : 1"
                            },
                            npkbudget_nutrientbalance_nbalance: {
                                question_name: "N Balance",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_pbalance: {
                                question_name: "P Balance",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_kbalance: {
                                question_name: "K Balance",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_nutrientbalance_nbalanceha: {
                                question_name: "N Balance per ha",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg/ha",
                            },
                            npkbudget_nutrientbalance_nbalancehasustainability: {
                                question_name: "N Sustainability",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.TEXT,
                                auto_calc: true,
                            },
                            npkbudget_nutrientbalance_pbalanceha: {
                                question_name: "P Balance per ha",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg/ha",
                            },
                            npkbudget_nutrientbalance_pbalancehasustainability: {
                                question_name: "P Sustainability",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.TEXT,
                                auto_calc: true
                            },
                            npkbudget_nutrientbalance_kbalanceha: {
                                question_name: "K Balance per ha",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                answer_unit: "kg/ha",
                            },
                            npkbudget_nutrientbalance_kbalancehasustainability: {
                                question_name: "K Sustainability",
                                compulsory: false,
                                question_group: "npkbudget_nutrientbalance_farmgatebudget",
                                question_type: QUESTION_TYPE.TEXT,
                                auto_calc: true,
                            },
                        }
                    },
                    npkbudget_inputsandoutputs: {
                        title: "Inputs and Outputs",
                        question_groups: {
                            npkbudget_inputsandoutputs_arable: {
                                title: "Arable crops and field vegetables - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of crops and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_cropname',
                                        'initialdata_crops_cropyieldexport',
                                        'npkbudget_inputsandoutputs_arablenin',
                                        'npkbudget_inputsandoutputs_arablepin',
                                        'npkbudget_inputsandoutputs_arablekin',
                                        'npkbudget_inputsandoutputs_arablenout',
                                        'npkbudget_inputsandoutputs_arablepout',
                                        'npkbudget_inputsandoutputs_arablekout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        'npkbudget_inputsandoutputs_arablenintotal',
                                        'npkbudget_inputsandoutputs_arablepintotal',
                                        'npkbudget_inputsandoutputs_arablekintotal',
                                        'npkbudget_inputsandoutputs_arablenouttotal',
                                        'npkbudget_inputsandoutputs_arablepouttotal',
                                        'npkbudget_inputsandoutputs_arablekouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_livestock: {
                                title: "Livestock - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of livestock and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_livestock_type',
                                        'initialdata_livestock_import',
                                        'initialdata_livestock_export',
                                        'npkbudget_inputsandoutputs_livestocknin',
                                        'npkbudget_inputsandoutputs_livestockpin',
                                        'npkbudget_inputsandoutputs_livestockkin',
                                        'npkbudget_inputsandoutputs_livestocknout',
                                        'npkbudget_inputsandoutputs_livestockpout',
                                        'npkbudget_inputsandoutputs_livestockkout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        null,
                                        'npkbudget_inputsandoutputs_livestocknintotal',
                                        'npkbudget_inputsandoutputs_livestockpintotal',
                                        'npkbudget_inputsandoutputs_livestockkintotal',
                                        'npkbudget_inputsandoutputs_livestocknouttotal',
                                        'npkbudget_inputsandoutputs_livestockpouttotal',
                                        'npkbudget_inputsandoutputs_livestockkouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_livestockprod: {
                                title: "Livestock products - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of livestock products and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_livestock_producttype',
                                        'initialdata_livestock_productimport',
                                        'initialdata_livestock_productexport',
                                        'npkbudget_inputsandoutputs_livestockprodnin',
                                        'npkbudget_inputsandoutputs_livestockprodpin',
                                        'npkbudget_inputsandoutputs_livestockprodkin',
                                        'npkbudget_inputsandoutputs_livestockprodnout',
                                        'npkbudget_inputsandoutputs_livestockprodpout',
                                        'npkbudget_inputsandoutputs_livestockprodkout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        null,
                                        'npkbudget_inputsandoutputs_livestockprodnintotal',
                                        'npkbudget_inputsandoutputs_livestockprodpintotal',
                                        'npkbudget_inputsandoutputs_livestockprodkintotal',
                                        'npkbudget_inputsandoutputs_livestockprodnouttotal',
                                        'npkbudget_inputsandoutputs_livestockprodpouttotal',
                                        'npkbudget_inputsandoutputs_livestockprodkouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_seeds: {
                                title: "Imported seeds - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of seeds and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_seedstype',
                                        'initialdata_seedsfeeds_seedsimport',
                                        'initialdata_seedsfeeds_seedsexport',
                                        'npkbudget_inputsandoutputs_seedsnin',
                                        'npkbudget_inputsandoutputs_seedspin',
                                        'npkbudget_inputsandoutputs_seedskin',
                                        'npkbudget_inputsandoutputs_seedsnout',
                                        'npkbudget_inputsandoutputs_seedspout',
                                        'npkbudget_inputsandoutputs_seedskout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        null,
                                        'npkbudget_inputsandoutputs_seedsnintotal',
                                        'npkbudget_inputsandoutputs_seedspintotal',
                                        'npkbudget_inputsandoutputs_seedskintotal',
                                        'npkbudget_inputsandoutputs_seedsnouttotal',
                                        'npkbudget_inputsandoutputs_seedspouttotal',
                                        'npkbudget_inputsandoutputs_seedskouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_feeds: {
                                title: "Imported feeds - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of feeds and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_feedstype',
                                        'initialdata_seedsfeeds_feedsimport',
                                        'initialdata_seedsfeeds_feedsexport',
                                        'npkbudget_inputsandoutputs_feedsnin',
                                        'npkbudget_inputsandoutputs_feedspin',
                                        'npkbudget_inputsandoutputs_feedskin',
                                        'npkbudget_inputsandoutputs_feedsnout',
                                        'npkbudget_inputsandoutputs_feedspout',
                                        'npkbudget_inputsandoutputs_feedskout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        null,
                                        'npkbudget_inputsandoutputs_feedsnintotal',
                                        'npkbudget_inputsandoutputs_feedspintotal',
                                        'npkbudget_inputsandoutputs_feedskintotal',
                                        'npkbudget_inputsandoutputs_feedsnouttotal',
                                        'npkbudget_inputsandoutputs_feedspouttotal',
                                        'npkbudget_inputsandoutputs_feedskouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_arablestraw: {
                                title: "Arable straw - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of arable straw and its NPK content."
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [
                                        'Yield Imported',
                                        'Yield Exported',
                                        'N - IN',
                                        'P - IN',
                                        'K - IN',
                                        'N - OUT',
                                        'P - OUT',
                                        'K - OUT'
                                    ],
                                    rows: [
                                        'Arable straw',
                                    ]
                                },
                                question_codes: [
                                    [
                                        'initialdata_seedsfeeds_arablestrawimport',
                                        'initialdata_seedsfeeds_arablestrawexport',
                                        'npkbudget_inputsandoutputs_arablestrawnin',
                                        'npkbudget_inputsandoutputs_arablestrawpin',
                                        'npkbudget_inputsandoutputs_arablestrawkin',
                                        'npkbudget_inputsandoutputs_arablestrawnout',
                                        'npkbudget_inputsandoutputs_arablestrawpout',
                                        'npkbudget_inputsandoutputs_arablestrawkout'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_organicfertiliser: {
                                title: "Organic fertilisers - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of organic fertilisers and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_fertilisers_organictype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_fertilisers_organictype',
                                        'initialdata_fertilisers_organicimport',
                                        'initialdata_fertilisers_organicexport',
                                        'npkbudget_inputsandoutputs_organicfertilisernin',
                                        'npkbudget_inputsandoutputs_organicfertiliserpin',
                                        'npkbudget_inputsandoutputs_organicfertiliserkin',
                                        'npkbudget_inputsandoutputs_organicfertilisernout',
                                        'npkbudget_inputsandoutputs_organicfertiliserpout',
                                        'npkbudget_inputsandoutputs_organicfertiliserkout'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        null,
                                        'npkbudget_inputsandoutputs_organicfertilisernintotal',
                                        'npkbudget_inputsandoutputs_organicfertiliserpintotal',
                                        'npkbudget_inputsandoutputs_organicfertiliserkintotal',
                                        'npkbudget_inputsandoutputs_organicfertilisernouttotal',
                                        'npkbudget_inputsandoutputs_organicfertiliserpouttotal',
                                        'npkbudget_inputsandoutputs_organicfertiliserkouttotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliser: {
                                title: "Inorganic fertilisers - NPK Balance in kg",
                                guidance: {
                                    html: false,
                                    content: "This is calculated from the imports and exports of inorganic fertilisers and their NPK contents."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_fertilisers_inorganictype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_fertilisers_inorganictype',
                                        'initialdata_fertilisers_inorganicimport',
                                        'npkbudget_inputsandoutputs_inorganicfertilisernin',
                                        'npkbudget_inputsandoutputs_inorganicfertiliserpin',
                                        'npkbudget_inputsandoutputs_inorganicfertiliserkin'
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        null,
                                        'npkbudget_inputsandoutputs_inorganicfertilisernintotal',
                                        'npkbudget_inputsandoutputs_inorganicfertiliserpintotal',
                                        'npkbudget_inputsandoutputs_inorganicfertiliserkintotal'
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_cropnfixation: {
                                title: "Crops - Nitrogen fixation",
                                guidance: {
                                    html: false,
                                    content: "The N-IN (tonnes) total indicates the amount of nitrogen your peas or beans fix each year."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 'peas_dry', 'field_beans' ]
                                    },
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [
                                        "N - IN"
                                    ],
                                    rows: [
                                        "Peas",
                                        "Beans"
                                    ]
                                },
                                question_codes: [
                                    [ 'npkbudget_inputsandoutputs_peasnfixation' ],
                                    [ 'npkbudget_inputsandoutputs_beansnfixation' ]
                                ]
                            },
                            npkbudget_inputsandoutputs_foragecrop: {
                                title: "Forage crop - Nitrogen fixation",
                                guidance: {
                                    html: false,
                                    content: "The N-IN (tonnes) total indicates the amount of nitrogen your forage crop fixes each year."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_foragecropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_foragecropname',
                                        'npkbudget_inputsandoutputs_foragecropnin',
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        'npkbudget_inputsandoutputs_foragecropnintotal',
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_permanentpasture: {
                                title: "Permanent pasture and rough grazing - Nitrogen fixation",
                                guidance: {
                                    html: false,
                                    content: "The N-IN (tonnes) total indicates the amount of nitrogen the legumes (e.g. clover) in your permanent pasture and rough grazing crop fixes each year."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_permanentpasturename',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_TOP,
                                question_codes: [
                                    [
                                        'initialdata_crops_permanentpasturename',
                                        'npkbudget_inputsandoutputs_permanentpasturenin',
                                    ],
                                    [
                                        'npkbudget_inputsandoutputs_total',
                                        'npkbudget_inputsandoutputs_permanentpasturenintotal',
                                    ]
                                ]
                            },
                            npkbudget_inputsandoutputs_atmosphericdeposition: {
                                title: "Atmospheric deposition",
                                guidance: {
                                    html: false,
                                    content: "Nitrogen input to the farm also comes from rainfall and dry deposition from the atmosphere. These vary across the UK and may also be increased in close proximity to intensive animal production units due to increased deposition of ammonia."
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [
                                        'N - IN',
                                    ],
                                    rows: [
                                        'Atmospheric deposition',
                                    ]
                                },
                                question_codes: [
                                    [
                                        'npkbudget_inputsandoutputs_atmosphericdepositionnin',
                                    ]
                                ]
                            },
                        },
                        questions: {
                            npkbudget_inputsandoutputs_total: {
                                question_name: "Total",
                                compulsory: false,
                                question_placeholder: 'Total',
                                question_type: QUESTION_TYPE.TEXT,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablenin: {
                                question_name: "N - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablenintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablepin: {
                                question_name: "P - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablepintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablekin: {
                                question_name: "K - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablekintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablenout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablenouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablepout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablepouttotal: {
                                question_name: "P - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablekout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablekouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_crops_cropname',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arable',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestocknin: {
                                question_name: "N - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestocknintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockpin: {
                                question_name: "P - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockpintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockkin: {
                                question_name: "K - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockkintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestocknout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestocknouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockpout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockpouttotal: {
                                question_name: "P - OUT Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockkout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockkouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestock',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodnin: {
                                question_name: "N - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodnintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodpin: {
                                question_name: "P - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodpintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodkin: {
                                question_name: "K - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodkintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodnout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodnouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodpout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodpouttotal: {
                                question_name: "P - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodkout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_livestockprodkouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_producttype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_livestockprod',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedsnin: {
                                question_name: "N - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedsnintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedspin: {
                                question_name: "P - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedspintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedskin: {
                                question_name: "K - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedskintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedsnout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedsnouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedspout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedspouttotal: {
                                question_name: "P - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedskout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_seedskouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_seedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_seeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedsnin: {
                                question_name: "N - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedsnintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedspin: {
                                question_name: "P - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedspintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedskin: {
                                question_name: "K - IN",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedskintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedsnout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedsnouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedspout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedspouttotal: {
                                question_name: "P - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedskout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_feedskouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_seedsfeeds_feedstype',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_feeds',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawnin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                question_ascendancies: [
                                    'initialdata_seedsfeeds_arablestrawimport'
                                ],
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawpin: {
                                question_name: "P - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawkin: {
                                question_name: "K - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawnout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                question_ascendancies: [
                                    'initialdata_seedsfeeds_arablestrawexport'
                                ],
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawpout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_arablestrawkout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_arablestraw',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertilisernin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                question_ascendancies: [
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicimport'
                                ],
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertilisernintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpin: {
                                question_name: "P - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkin: {
                                question_name: "K - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertilisernout: {
                                question_name: "N - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                question_ascendancies: [
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicexport'
                                ],
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertilisernouttotal: {
                                question_name: "N - OUT - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpout: {
                                question_name: "P - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpouttotal: {
                                question_name: "P - OUT - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkout: {
                                question_name: "K - OUT",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkouttotal: {
                                question_name: "K - OUT - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_organicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertilisernin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                question_ascendancies: [
                                    'initialdata_fertilisers_inorganictype',
                                    'initialdata_fertilisers_inorganicimport'
                                ],
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertilisernintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserpin: {
                                question_name: "P - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserpintotal: {
                                question_name: "P - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserkin: {
                                question_name: "K - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserkintotal: {
                                question_name: "K - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_inorganicfertiliser',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_peasnfixation: {
                                question_name: "Peas - N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_cropnfixation',
                                auto_calc: true,
                                answer_unit: "kg",
                                question_ascendancies: [
                                    'initialdata_crops_cropname',
                                    'initialdata_crops_croparea'
                                ]
                            },
                            npkbudget_inputsandoutputs_beansnfixation: {
                                question_name: "Beans - N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_cropnfixation',
                                auto_calc: true,
                                answer_unit: "kg",
                                question_ascendancies: [
                                    'initialdata_crops_cropname',
                                    'initialdata_crops_croparea'
                                ]
                            },
                            npkbudget_inputsandoutputs_foragecropnin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_foragecrop',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                                question_ascendancies: [
                                    'initialdata_crops_foragecropname',
                                    'initialdata_crops_foragecroparea'
                                ]
                            },
                            npkbudget_inputsandoutputs_foragecropnintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_foragecrop',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
							npkbudget_inputsandoutputs_permanentpasturenin: {
                                question_name: "N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_permanentpasture',
                                auto_calc: true,
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_unit: "kg",
                                question_ascendancies: [
                                    'initialdata_crops_permanentpasturename',
                                    'initialdata_crops_permanentpasturearea'
                                ]
                            },
                            npkbudget_inputsandoutputs_permanentpasturenintotal: {
                                question_name: "N - IN - Total",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_permanentpasture',
                                auto_calc: true,
                                answer_unit: "kg",
                            },
                            npkbudget_inputsandoutputs_atmosphericdepositionnin: {
                                question_name: "Atmospheric deposition N - IN",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'npkbudget_inputsandoutputs_atmosphericdeposition',
                                question_ascendancies: [
                                    "initialdata_crops_croparea",
                                    "initialdata_crops_foragecroparea",
                                    "initialdata_crops_permanentpasturearea"
                                ],
                                auto_calc: true,
                                answer_unit: "kg"
                            },
                        },
                    },
                }
            },
            fertiliserman: {
                title: "Fertiliser management",
                indicators: {
                    fertiliserman_fertiliser: {
                        title: "Fertiliser management and application",
                        questions: {
                            fertiliserman_fertiliser_spreaders: {
                                question_name: "How often are fertiliser spreaders inspected and maintained?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Never", answer_code: 1 },
                                    { answer_name: "Every year", answer_code: 2 },
                                    { answer_name: "Every six months", answer_code: 3 },
                                    { answer_name: "Every 2-3 months", answer_code: 4 },
                                    { answer_name: "Each time the spreader(s) is/are used", answer_code: 5 }
                                ]
                            },
                            fertiliserman_fertiliser_rates: {
                                question_name: "How regularly are fertiliser application rates checked during the growing / spreading season?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Every 3+ months / Rarely tested", answer_code: 1 },
                                    { answer_name: "Every 2-3 months", answer_code: 2 },
                                    { answer_name: "Every month", answer_code: 3 },
                                    { answer_name: "Every week", answer_code: 4 },
                                    { answer_name: "Every day / Before each application", answer_code: 5 }
                                ]
                            },
                            fertiliserman_fertiliser_nfertilisers: {
                                question_name: "At what time(s) of year do you spread manufactured nitrogen fertilisers?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Autumn/winter only", answer_code: 1 },
                                    { answer_name: "Part autumn/winter, part spring", answer_code: 2 },
                                    { answer_name: "Spring/summer only", answer_code: 3 }
                                ]
                            },
                        }
                    },
                    fertiliserman_nutrientplanning: {
                        title: "Nutrient planning",
                        questions: {
                            fertiliserman_nutrientplanning_levelapplication: {
                                question_name: "How do you determine the level of nutrient application for crops?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Ad-hoc basis", answer_code: 1 },
                                    { answer_name: "NVZ compliance limit", answer_code: 2 },
                                    { answer_name: "Limit set by organic standards", answer_code: 3 },
                                    { answer_name: "Using a nutrient budget software/manual", answer_code: 4 },
                                    { answer_name: "Through advice from a FACTS qualified advisor", answer_code: 5 }
                                ]
                            },
                            fertiliserman_nutrientplanning_monitornutrientlevels: {
                                question_name: "How regularly do you monitor/record levels of major nutrients (e.g. P, K, Mg, C, S) in the soil?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Never", answer_code: 1 },
                                    { answer_name: "I test every 5+ years", answer_code: 2 },
                                    { answer_name: "I test a few fields every few years", answer_code: 3 },
                                    { answer_name: "I test some fields every two years", answer_code: 4 },
                                    { answer_name: "I test some fields every year to monitor long-term change", answer_code: 5 }
                                ]
                            },
                            fertiliserman_nutrientplanning_stafftraining: {
                                question_name: "To what extent are staff trained in the accurate/efficient application of nutrients to crops?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No training provided", answer_code: 1 },
                                    { answer_name: "Some internal training provided", answer_code: 2 },
                                    { answer_name: "Full training / external certification provided", answer_code: 3 }
                                ]
                            },
                            fertiliserman_nutrientplanning_organiccompostscontent: {
                                question_name: "Do you know the N, P, K content of organic manures/composts applied?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "No", answer_code: 1 },
                                    { answer_name: "Some limited information", answer_code: 2 },
                                    { answer_name: "Yes - use data from literature", answer_code: 3 },
                                    { answer_name: "Yes - analysed", answer_code: 4 }
                                ]
                            }
                        }
                    },
                    fertiliserman_manureman: {
                        title: "Manure management",
                        question_groups: {
                            fertiliserman_manuremanstorage: {
                                title: "Manure storage",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'fertiliserman_manureman_storemanure' ],
                                    [ 'fertiliserman_manureman_storeslurry' ],
                                    [ 'fertiliserman_manureman_storeslurryfloor' ],
                                    [ 'fertiliserman_manureman_storeslurrycapacity' ],
                                    [ 'fertiliserman_manureman_storeslurryinspect' ]
                                ]
                            },
                            fertiliserman_manuremanapplication: {
                                title: "Manure application",
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'fertiliserman_manureman_spreadslurry' ],
                                    [ 'fertiliserman_manureman_slurryapplications' ],
                                    [ 'fertiliserman_manureman_timespread' ],
                                    [ 'fertiliserman_manureman_incorporateslurry' ],
                                    [ 'fertiliserman_manureman_incorporatemanure' ]
                                ]
                            }
                        },
                        questions: {
                            fertiliserman_manureman_storemanure: {
                                question_name: "How do you predominantly store/manage manure on farm?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanstorage',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Unmanaged stacked", answer_code: 1 },
                                    { answer_name: "Windrows/composting on field", answer_code: 2 },
                                    { answer_name: "Managed and stacked - composted on hard standing without impermeable cover", answer_code: 3 },
                                    { answer_name: "Windrows/composting on field with impermeable cover", answer_code: 4 },
                                    { answer_name: "Windrows/composting with impermeable cover on hard standing", answer_code: 5 },
                                    { answer_name: "Windrows/composting with impermeable cover and on hard standing with run-off collection system", answer_code: 6 }
                                ]
                            },
                            fertiliserman_manureman_storeslurry: {
                                question_name: "How do you predominantly store slurry?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanstorage',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Uncovered lagoon or tank", answer_code: 1 },
                                    { answer_name: "Covered lagoon or tank", answer_code: 2 },
                                    { answer_name: "Covered and aerated lagoon or tank", answer_code: 3 }
                                ]
                            },
                            fertiliserman_manureman_storeslurryfloor: {
                                question_name: "What is the condition of the floor for your slurry storage system?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanstorage',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Entire floor area is not impermeable", answer_code: 1 },
                                    { answer_name: "Some of floor area is impermeable", answer_code: 2 },
                                    { answer_name: "Entire floor area is impermeable", answer_code: 3 }
                                ]
                            },
                            fertiliserman_manureman_storeslurrycapacity: {
                                question_name: "How many months storage capacity do you have for slurry/dirty water?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanstorage',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "0 to 2", answer_code: 1 },
                                    { answer_name: "2 to 4", answer_code: 2 },
                                    { answer_name: "4 or more", answer_code: 3 }
                                ]
                            },
                            fertiliserman_manureman_storeslurryinspect: {
                                question_name: "How often do you completely empty and inspect manure/slurry storage facilities?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanstorage',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Rarely", answer_code: 1 },
                                    { answer_name: "Every 2 years", answer_code: 2 },
                                    { answer_name: "Annually", answer_code: 3 }
                                ]
                            },
                            fertiliserman_manureman_spreadslurry: {
                                question_name: "How do you spread slurry?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanapplication',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Plate spreader", answer_code: 1 },
                                    { answer_name: "Band spreader", answer_code: 2 },
                                    { answer_name: "Trailing shoe", answer_code: 3 },
                                    { answer_name: "Slurry injector", answer_code: 4 },
                                    { answer_name: "Other (please specify)", answer_code: 5 }
                                ]
                            },
                            fertiliserman_manureman_slurryapplications: {
                                question_name: "What time period do you leave between FYM and/or slurry applications?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanapplication',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "1-2 weeks", answer_code: 1 },
                                    { answer_name: "2-3 weeks", answer_code: 2 },
                                    { answer_name: "4-5 weeks", answer_code: 3 },
                                    { answer_name: "6 weeks or more", answer_code: 4 }
                                ]
                            },
                            fertiliserman_manureman_timespread: {
                                question_name: "At what time of year do you spread manures/slurries?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanapplication',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Autumn only", answer_code: 1 },
                                    { answer_name: "Part autumn/part spring", answer_code: 2 },
                                    { answer_name: "Spring/summer only", answer_code: 3 }
                                ]
                            },
                            fertiliserman_manureman_incorporateslurry: {
                                question_name: "How many hours after spreading do you incorporate slurries?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanapplication',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "More than 6 hours after spreading", answer_code: 1 },
                                    { answer_name: "Within 6 hours of spreading", answer_code: 2 },
                                    { answer_name: "Within 4 hours of spreading", answer_code: 3 },
                                    { answer_name: "Within 2 hours of spreading", answer_code: 4 },
                                    { answer_name: "Immediate incorporation", answer_code: 5 }
                                ]
                            },
                            fertiliserman_manureman_incorporatemanure: {
                                question_name: "How many hours after spreading do you incorporate solid manures?",
                                compulsory: true,
                                question_group: 'fertiliserman_manuremanapplication',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "More than 24 hours after spreading", answer_code: 1 },
                                    { answer_name: "Within 24 hours of spreading", answer_code: 2 },
                                    { answer_name: "Within 12 hours of spreading", answer_code: 3 },
                                    { answer_name: "Immediately after spreading", answer_code: 4 }
                                ]
                            },
                        }
                    },
                    fertiliserman_farmwaste: {
                        title: "Farm waste disposal",
                        questions: {
                            fertiliserman_farmwaste_recycled: {
                                question_name: "What percentage of farm waste (e.g. plastics, metals, timber etc) is recycled?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "0-15%", answer_code: 0 },
                                    { answer_name: "15-30%", answer_code: 1 },
                                    { answer_name: "30-45%", answer_code: 2 },
                                    { answer_name: "45-60%", answer_code: 3 },
                                    { answer_name: "60%+", answer_code: 4 }
                                ]
                            },
                            fertiliserman_farmwaste_medicinedisposal: {
                                question_name: "How do you dispose of unused/unwanted medicines?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Flush down sink,  drain or sewer", answer_code: 1 },
                                    { answer_name: "Landfill site", answer_code: 2 },
                                    { answer_name: "Return to supplier - unsure how they dispose of the medicine", answer_code: 3 },
                                    { answer_name: "Return to supplier (e.g. vet) - they carry out clinical incineration", answer_code: 4 },
                                    { answer_name: "On-farm incineration", answer_code: 5 },
                                    { answer_name: "Clinical incineration", answer_code: 6 }
                                ]
                            },
                            fertiliserman_farmwaste_wastestrategy: {
                                question_name: "Does the farm have a written waste strategy (i.e. detailing waste avoidance strategies, waste disposal, etc)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Have a written plan", answer_code: 1 },
                                    { answer_name: "Have a written plan which is updated regularly", answer_code: 2 }
                                ]
                            },
                        }
                    }
                }
            },
            energycarbon: {
                title: "Energy and Carbon",
                indicators: {
                    energycarbon_fueluse: {
                        title: "Fuel use",
                        question_groups: {
                            energycarbon_fueluse_ownfuel: {
                                title: "Own fuel use",
                                helper: {
                                    html: true,
                                    content:`
                                    <p>Please select fuel type and enter amount used for production of each product over the last 12 months. If multiple fuel types are used, please record by adding an extra column using the bottom right button. When a fuel has been used for more than one of your enterprises, allocate the share for each enterprise as a percentage. "Arable" includes all energy / fuel for forage / feed  production on the farm. "Biomass production" includes work carried out to manage and harvest hedgerows for fuel, SRC and woodland for fuel.</p>
                                    <p><b>Regarding 'Electricity':</b></p>
                                    <p>* If the farm electricity meter includes domestic property(s) then please use the guidelines below to estimate domestic use and subtract from the total figure:</p>
                                    <p><b>Average household electricity consumption:</b></br>
                                    1. Working Couple - 4,117 kWh electricity/year</br>
                                    2. Single Person - 3,084 kWh electricity/year</br>
                                    3. Family with two children - 5,480 kWh electricity/year</p>
                                    <p>Source: <a href="http://www.esru.strath.ac.uk/EandE/Web_sites/01-02/RE_info/hec.htm" target="_blank">http://www.esru.strath.ac.uk/EandE/Web_sites/01-02/RE_info/hec.htm</a></p>
                                    <p>Alternatively, using an electricity bill, estimate the average annual consumption eg:</br>
                                    Electricity bill states that 1,068 kWh were used over 92 day period.</br>
                                    1.  Calculate % of the year 92 / 365 = 25.2% (365 days in the year)</br>
                                    2.  Calculate yearly total 1,068 kWh x (100/25.2) = 4238 kWh annual consumption</p>`
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    ['energycarbon_fueluse_ownfueltype'],
                                    ['energycarbon_fueluse_ownfuelamount'],
                                    ['energycarbon_fueluse_ownfuelpercarable'],
                                    ['energycarbon_fueluse_ownfuelpercbeefsheep'],
                                    ['energycarbon_fueluse_ownfuelpercdairy'],
                                    ['energycarbon_fueluse_ownfuelperchorticulture'],
                                    ['energycarbon_fueluse_ownfuelpercpig'],
                                    ['energycarbon_fueluse_ownfuelpercpoultrymeat'],
                                    ['energycarbon_fueluse_ownfuelpercpoultryeggs'],
                                    ['energycarbon_fueluse_ownfuelpercbiomassprod']
                                ]
                            },
                            energycarbon_fueluse_contractor: {
                                title: "Contractor's fuel use",
                                helper: {
                                    html: true,
                                    content: `<p>Please enter the type of contractor operation (based on HP of machinery used) and total amount of hours over the last 12 months, and divide between your enterprises as a percentage. If there are multiple contractor types, please record by adding an extra column using the bottom right button. Operations carried out using a two-stroke engine (e.g. chainsaws) should be entered by entering the petrol use above (even where the work was carried out by a contractor). If the contractor is paid by the job and the farmer is unaware of the hours and horsepower used the following data taken from Nix (2011) can be used to provide an estimate:</p>
                                    <table border="0">
                                        <tr><th>Crops/livestock</th><th>Tractor hours per hectare (average)</th></tr>
                                        <tr><td>Cereals</td><td>9</td></tr>
                                        <tr><td>Straw harvesting</td><td>3.5</td></tr>
                                        <tr><td>Potatoes</td><td>20</td></tr>
                                        <tr><td>Sugar beet</td><td>20</td></tr>
                                        <tr><td>Vining peas</td><td>20</td></tr>
                                        <tr><td>Dried peas</td><td>10</td></tr>
                                        <tr><td>Field beans</td><td>9</td></tr>
                                        <tr><td>Oilseed rape</td><td>9</td></tr>
                                        <tr><td>Kale(grazed)</td><td>8</td></tr>
                                        <tr><td>Turnips/Swedes: folded/lifted</td><td>12/35</td></tr>
                                        <tr><td>Fallow</td><td>12</td></tr>
                                        <tr><td>Ley establishment (undersown)</td><td>2</td></tr>
                                        <tr><td>Ley establishment (direct seed)</td><td>7</td></tr>
                                        <tr><td>Making hay</td><td>12</td></tr>
                                        <tr><td>Making silage 1st cut</td><td>12</td></tr>
                                        <tr><td>Making silage 2nd cut</td><td>9</td></tr>
                                        <tr><td>Grazing temporary grass</td><td>3</td></tr>
                                        <tr><td>Grazing permanent grass</td><td>2</td></tr>
                                        <tr><td>Dairy cows</td><td>6</td></tr>
                                        <tr><td>Other cattle > 2 years</td><td>5</td></tr>
                                        <tr><td>Other cattle 1-2 years</td><td>4</td></tr>
                                        <tr><td>Other cattle 1/2-1year</td><td>2.25</td></tr>
                                        <tr><td>Calves 0-1/2 year</td><td>2.25</td></tr>
                                        <tr><td>Housed bullocks</td><td>3</td></tr>
                                        <tr><td>Sheep per ewe</td><td>1.25</td></tr>
                                        <tr><td>Store sheep</td><td>0.8</td></tr>
                                        <tr><td>Sows</td><td>1.75</td></tr>
                                        <tr><td>Other pigs >2 months</td><td>1</td></tr>
                                        <tr><td>Laying birds </td><td>0.04</td></tr>
                                    </table>            
                                    <p></p>                     
                                    <p><b>Tractor power requirements:</b></p>
                                    <table border="0">
                                    <tr><td>Combinable crops: heavy land</td><td>1.85 hp per ha</td></tr>
                                    <tr><td>Combinable crops: light land</td><td>1.25 hp per ha</td></tr>
                                    <tr><td>Mixed cropping: heavy land</td><td>2.5 hp per ha</td></tr>
                                    <tr><td>Mixed cropping: light land</td><td>1.75 hp per ha</td></tr>
                                    </table><p></p>
                                    <p>Data taken from The John Nix Farm Management Pocketbook 2011" Agro Business Consultants Ltd</p>`
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    ['energycarbon_fueluse_contractortype'],
                                    ['energycarbon_fueluse_contractoramount'],
                                    ['energycarbon_fueluse_contractorpercarable'],
                                    ['energycarbon_fueluse_contractorpercbeefsheep'],
                                    ['energycarbon_fueluse_contractorpercdairy'],
                                    ['energycarbon_fueluse_contractorperchorticulture'],
                                    ['energycarbon_fueluse_contractorpercpig'],
                                    ['energycarbon_fueluse_contractorpercpoultrymeat'],
                                    ['energycarbon_fueluse_contractorpercpoultryeggs'],
                                    ['energycarbon_fueluse_contractorpercbiomassprod']
                                ]
                            },
                            energycarbon_fueluse_typicalconsumptionbenchmark: {
                                title: "Benchmark comparison",
                                guidance: {
                                    html: true,
                                    content: "<p>Please note benchmarks for fuel used are based on conventional, specialised farm data. There is no data for mixed and/or organic farms available at the moment.</p><p>Please also note that the benchmark figures come from producers that are not processing their products on-farm.</p><p>Regarding 'Beef and Sheep' benchmark data, please note that this figure is based on a wide data range for UK beef and sheep systems, including many upland units, which tend to have a low fuel fossil fuel use per head of livestock.</p>"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [ 'Total energy', 'Total energy per unit', 'Standard industry benchmark', '% of benchmark' ],
                                    rows: [
                                        'Arable, incorporating horticulture and vegetable production',
                                        'Beef and Sheep',
                                        'Dairy',
                                        'Pig',
                                        'Poultry - Layers',
                                        'Poultry - Broilers'
                                    ]
                                },
                                question_codes: [
                                    ['energycarbon_fueluse_arabletotalenergy', 'energycarbon_fueluse_arabletotalenergyperha',  'energycarbon_fueluse_arablebenchmark',  'energycarbon_fueluse_arablepercbenchmark'],
                                    ['energycarbon_fueluse_beefsheeptotalenergy', 'energycarbon_fueluse_beefsheeptotalenergyperhead', 'energycarbon_fueluse_beefbenchmark', 'energycarbon_fueluse_beefpercbenchmark'],
                                    ['energycarbon_fueluse_dairytotalenergy', 'energycarbon_fueluse_dairytotalenergyperhead', 'energycarbon_fueluse_dairybenchmark', 'energycarbon_fueluse_dairypercbenchmark'],
                                    ['energycarbon_fueluse_pigtotalenergy', 'energycarbon_fueluse_pigtotalenergyperhead', 'energycarbon_fueluse_pigbenchmark', 'energycarbon_fueluse_pigpercbenchmark'],
                                    ['energycarbon_fueluse_poultryeggstotalenergy', 'energycarbon_fueluse_poultryeggstotalenergyperhead','energycarbon_fueluse_poultryeggsbenchmark','energycarbon_fueluse_poultryeggspercbenchmark'],
                                    ['energycarbon_fueluse_poultrymeattotalenergy', 'energycarbon_fueluse_poultrymeattotalenergyperhead', 'energycarbon_fueluse_poultrymeatbenchmark', 'energycarbon_fueluse_poultrymeatpercbenchmark']
                                ]
                            },
                        },
                        questions: {
                            energycarbon_fueluse_ownfueltype: {
                                question_name: "Fuel Type",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.FUELS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(function(data) {
                                    return {
                                        answer_name: data[1].fuel_name + " (" + data[1].units + ")",
                                        answer_code: data[0]
                                    }
                                })
                            },
                            energycarbon_fueluse_ownfuelamount: {
                                question_name: "Amount",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_default: 0,
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercarable: {
                                question_name: "Arable",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercbeefsheep: {
                                question_name: "Beef and Sheep",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercdairy: {
                                question_name: "Dairy",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelperchorticulture: {
                                question_name: "Horticulture",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercpig: {
                                question_name: "Pig",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercpoultrymeat: {
                                question_name: "Poultry - Broilers",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercpoultryeggs: {
                                question_name: "Poultry - Layers",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_ownfuelpercbiomassprod: {
                                question_name: "Biomass production",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_ownfueltype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_ownfuelamount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_ownfuel',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractortype: {
                                question_name: "Contractor type",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                                answer_list: Object.entries(DATASETS.CONTRACTS)
                                    .filter(data => data[0].substring(0,1) !== '_')
                                    .map(
                                    function(data) {
                                        return {
                                            answer_name: data[1].contract_name + " (" + data[1].units + ")",
                                            answer_code: data[0]
                                        }
                                    }
                                )
                            },
                            energycarbon_fueluse_contractoramount: {
                                question_name: "Amount",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_default: 0,
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercarable: {
                                question_name: "Arable",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercbeefsheep: {
                                question_name: "Beef and Sheep",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercdairy: {
                                question_name: "Dairy",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorperchorticulture: {
                                question_name: "Horticulture",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercpig: {
                                question_name: "Pig",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercpoultrymeat: {
                                question_name: "Poultry - Broilers",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercpoultryeggs: {
                                question_name: "Poultry - Broilers",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_unit: "%",
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_contractorpercbiomassprod: {
                                question_name: "Biomass production",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: "energycarbon_fueluse_contractortype",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'energycarbon_fueluse_contractoramount',
                                        evaluate: EVALUATORS.GREATER_THAN,
                                        value: 0
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_default: 0,
                                answer_unit: "%",
                                question_group: 'energycarbon_fueluse_contractor',
                                answer_type: ANSWER_TYPE.ARRAY,
                            },
                            energycarbon_fueluse_arabletotalenergy: {
                                question_name: "Arable, incorporating horticulture and vegetable production - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_arabletotalenergyperha: {
                                question_name: "Arable, incorporating horticulture and vegetable production - farm fuel use per hectare",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/ha"
                            },
                            energycarbon_fueluse_arablebenchmark: {
                                question_name: "Arable, incorporating horticulture and vegetable production - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/ha"
                            },
                            energycarbon_fueluse_arablepercbenchmark: {
                                question_name: "Arable, incorporating horticulture and vegetable production - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_fueluse_beefsheeptotalenergy: {
                                question_name: "Beef and Sheep - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_beefsheeptotalenergyperhead: {
                                question_name: "Beef and Sheep - farm fuel use per head",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_beefbenchmark: {
                                question_name: "Beef and Sheep - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_beefpercbenchmark: {
                                question_name: "Beef and Sheep - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_fueluse_dairytotalenergy: {
                                question_name: "Dairy - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_dairytotalenergyperhead: {
                                question_name: "Dairy - farm fuel use per head",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_dairybenchmark: {
                                question_name: "Dairy - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_dairypercbenchmark: {
                                question_name: "Dairy - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_fueluse_pigtotalenergy: {
                                question_name: "Pig - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_pigtotalenergyperhead: {
                                question_name: "Pig - farm fuel use per head",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_pigbenchmark: {
                                question_name: "Pig - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_pigpercbenchmark: {
                                question_name: "Pig - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_fueluse_poultryeggstotalenergy: {
                                question_name: "Poultry - Layers - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_poultryeggstotalenergyperhead: {
                                question_name: "Poultry - Layers - farm fuel use per head",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_poultryeggsbenchmark: {
                                question_name: "Poultry - Layers - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_poultryeggspercbenchmark: {
                                question_name: "Poultry - Layers - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_fueluse_poultrymeattotalenergy: {
                                question_name: "Poultry - Broilers - total farm fuel use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_fueluse_poultrymeattotalenergyperhead: {
                                question_name: "Poultry - Broilers - farm fuel use per head",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_poultrymeatbenchmark: {
                                question_name: "Poultry - Broilers - benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "MJ/head"
                            },
                            energycarbon_fueluse_poultrymeatpercbenchmark: {
                                question_name: "Poultry - Broilers - % of benchmark",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_fueluse_typicalconsumptionbenchmark',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                        }
                    },
                    energycarbon_renewableenergy: {
                        title: "Renewable energy",
                        question_groups: {
                            energycarbon_renewableenergy_renewableenergyuse: {
                                title: "Renewable energy use",
                                guidance: {
                                    html: false,
                                    content: "This is the percentage of your energy use that comes from renewable sources (electricity from renewable sources and wood fuel)"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_codes: [
                                    [ 'energycarbon_renewableenergy_totalenergy' ],
                                    [ 'energycarbon_renewableenergy_totalrenewableenergy' ],
                                    [ 'energycarbon_renewableenergy_renewableenergyperc' ],
                                ]
                            },
                        },
                        questions: {
                            energycarbon_renewableenergy_totalenergy: {
                                question_name: "Total farm direct energy use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_renewableenergy_renewableenergyuse',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_renewableenergy_totalrenewableenergy: {
                                question_name: "Total farm renewable energy use",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_renewableenergy_renewableenergyuse',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_renewableenergy_renewableenergyperc: {
                                question_name: "Percent renewable",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_renewableenergy_renewableenergyuse',
                                auto_calc: true,
                                answer_unit: "%"
                            },
                            energycarbon_renewableenergy_percrenewableenergyonfarm: {
                                question_name: "What % of your energy use is from renewable sources? This includes 'green tariffs' for electricity consumption",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: '0%', answer_code: 0 },
                                    { answer_name: '1-20%', answer_code: 1 },
                                    { answer_name: '20-40%', answer_code: 2 },
                                    { answer_name: '40-60%', answer_code: 3 },
                                    { answer_name: '60%+', answer_code: 4 }
                                ]
                            },
                            energycarbon_renewableenergy_produceenergy: {
                                question_name: "Do you produce energy and do you export energy off farm (e.g. supplying solar energy to the grid, selling wood chip to neighbours)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: 'Don\'t produce any energy', answer_code: 0 },
                                    { answer_name: 'Produce energy and cover half own energy needs', answer_code: 1 },
                                    { answer_name: 'Produce energy and cover all own energy needs', answer_code: 2 },
                                    { answer_name: 'Export some energy occasionally', answer_code: 3 },
                                    { answer_name: 'Export energy every day', answer_code: 4 }
                                ]
                            },
                        }
                    },
                    energycarbon_energyratio: {
                        title: "Energy ratio",
                        question_groups: {
                            energycarbon_energyratiogroup: {
                                title: "Energy ratio",
                                guidance: {
                                    html: true,
                                    content: '<p>Energy values are based on "feeding the dairy cow" (Chamberlain and Wilkinson, 1996) and the EASI tool (Smith and Woodward, 2010)</p><p>Please note that dairy energy output includes only milk sales, dairy cow/heifer sales and cull calf (0-3 months) sales.<br>All other calf and cow sales are included under "beef and sheep". The appropriate fuel use for "beef and sheep" must therefore be allocated on the previous sheet if dairy calves older than 3 months are being kept and sold for beef.</p>'
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE,
                                question_group_headers: {
                                    columns: [ 'Exported energy (MJ)', 'Imported energy (MJ)', 'Energy ratio' ],
                                    rows: [
                                        'Arable, incorporating horticulture and vegetable production',
                                        'Beef and Sheep',
                                        'Dairy',
                                        'Pig',
                                        'Poultry - Layers',
                                        'Poultry - Broilers',
                                        'Biomass'
                                    ]
                                },
                                question_codes: [
                                    [ 'energycarbon_energyratio_outarable', 'energycarbon_energyratio_inarable', 'energycarbon_energyratio_ratioarable' ],
                                    [ 'energycarbon_energyratio_outbeefsheep', 'energycarbon_energyratio_inbeefsheep', 'energycarbon_energyratio_ratiobeefsheep' ],
                                    [ 'energycarbon_energyratio_outdairy', 'energycarbon_energyratio_indairy', 'energycarbon_energyratio_ratiodairy' ],
                                    [ 'energycarbon_energyratio_outpig', 'energycarbon_energyratio_inpig', 'energycarbon_energyratio_ratiopig' ],
                                    [ 'energycarbon_energyratio_outpoultryeggs', 'energycarbon_energyratio_inpoultryeggs', 'energycarbon_energyratio_ratiopoultryeggs' ],
                                    [ 'energycarbon_energyratio_outpoultrymeat', 'energycarbon_energyratio_inpoultrymeat', 'energycarbon_energyratio_ratiopoultrymeat' ],
                                    [ 'energycarbon_energyratio_outbiomass', 'energycarbon_energyratio_inbiomass', 'energycarbon_energyratio_ratiobiomass' ]
                                ]
                            },
                        },
                        questions: {
                            energycarbon_energyratio_outarable: {
                                question_name: 'Arable, incorporating horticulture and vegetable production - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inarable: {
                                question_name: 'Arable, incorporating horticulture and vegetable production - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratioarable: {
                                question_name: 'Arable, incorporating horticulture and vegetable production - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1",
                            },
                            energycarbon_energyratio_outbeefsheep: {
                                question_name: 'Beef and Sheep - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inbeefsheep: {
                                question_name: 'Beef and Sheep - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiobeefsheep: {
                                question_name: 'Beef and Sheep - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1"
                            },
                            energycarbon_energyratio_outdairy: {
                                question_name: 'Dairy - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_indairy: {
                                question_name: 'Dairy - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                question_group: 'energycarbon_energyratiogroup',
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiodairy: {
                                question_name: 'Dairy - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                auto_calc: true,
                                question_group: 'energycarbon_energyratiogroup',
                                answer_unit: ": 1"
                            },
                            energycarbon_energyratio_outpig: {
                                question_name: 'Pig - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inpig: {
                                question_name: 'Pig - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiopig: {
                                question_name: 'Pig - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1"
                            },
                            energycarbon_energyratio_outpoultrymeat: {
                                question_name: 'Poultry - Broilers - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inpoultrymeat: {
                                question_name: 'Poultry - Broilers - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiopoultrymeat: {
                                question_name: 'Poultry - Broilers - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1"
                            },
                            energycarbon_energyratio_outpoultryeggs: {
                                question_name: 'Poultry - Layers - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inpoultryeggs: {
                                question_name: 'Poultry - Layers - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiopoultryeggs: {
                                question_name: 'Poultry - Layers - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1"
                            },
                            energycarbon_energyratio_outbiomass: {
                                question_name: 'Biomass - Exported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_inbiomass: {
                                question_name: 'Biomass - Imported energy',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: "MJ"
                            },
                            energycarbon_energyratio_ratiobiomass: {
                                question_name: 'Biomass - Energy ratio',
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'energycarbon_energyratiogroup',
                                auto_calc: true,
                                answer_unit: ": 1"
                            }
                        }
                    },
                    energycarbon_energysavingoptions: {
                        title: "Energy saving options",
                        questions: {
                            energycarbon_energysavingoptions_monitor: {
                                question_name: "Do you monitor/record on-farm energy use?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Rarely", answer_code: 1 },
                                    { answer_name: "Occasionally", answer_code: 2 },
                                    { answer_name: "Often", answer_code: 3 },
                                    { answer_name: "Always", answer_code: 4 }
                                ]
                            },
                            energycarbon_energysavingoptions_energyaudit: {
                                question_name: "Have you completed an energy audit to explore efficiency options and are you acting on it?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes but not acting on yet", answer_code: 1 },
                                    { answer_name: "Yes and acting on partly", answer_code: 2 },
                                    { answer_name: "Yes and acting on mostly", answer_code: 3 },
                                    { answer_name: "Yes and acting on fully", answer_code: 4 }
                                ]
                            }
                        }
                    },
                    energycarbon_greenhousegases: {
                        title: "Greenhouse gases",
                        questions: {
                            energycarbon_greenhousegases_audit: {
                                question_name: "Have you completed a CALM audit (www.calm.cla.org.uk) or similar and are you acting on recommendations?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes but not acting on yet", answer_code: 1 },
                                    { answer_name: "Yes and acting on partly", answer_code: 2 },
                                    { answer_name: "Yes and acting on mostly", answer_code: 3 },
                                    { answer_name: "Yes and acting on fully", answer_code: 4 }
                                ]
                            },
                            energycarbon_greenhousegases_options: {
                                question_name: "How many of the options below do you have on your farm?",
                                helper: {
                                    html: true,
                                    content: "<p><strong>Establishment of hedgerow trees</strong></p><p>• Select locally native tree species<br>• Trees established at irregular spacing at least 20m apart</p><p><strong>Management of woodland edges</strong></p><p>• Do not cultivate or apply fertilisers or manures within 6 m of the woodland edge<br>• Trim no more than a third of the shrubby growth in any 1 year<br>• Do not supplementary feed or locate water troughs in such a way as to cause poaching on the woodland edge<br>• Only apply herbicides to spot-treat or weed-wipe for the control of injurious weeds or invasive non-native species<br>• Do not apply fertilisers or manures</p><p><strong>Buffer strips for watercourses</strong></p><p>• Establish or maintain a grassy strip 6m+ wide<br>• Do not apply any fertilisers or manures<br>• Do not use for regular vehicular access, turning or storage<br>• Do not graze the buffer strip</p><p><strong>Buffering in-field ponds</strong></p><p>• Leave at least 10m between the pond edge & field<br>• Cut no more than once every 5 years<br>• Do not apply fertilisers or manures<br>• Only apply herbicides to control of injurious weeds or invasive non-native species<br>• Limit livestock access</p><p><strong>Field corner management</strong></p><p>• Establish or maintain a field corner by sowing or natural regeneration<br>• Do not use field corners for regular vehicular access, turning or storage<br>• Only apply herbicides to control of injurious weeds or invasive non-native species<br>• Cut no more than once every 5 years<br>• Do not cut between March & August<br>• Do not apply fertilisers or manure</p><p><strong>Nectar Flower mixture</strong></p><p>• Mix of at least four nectar-rich plants<br>• In strips at least 6 m wide sown in early spring or late summer<br>• Do not apply pesticides, fertilisers, manures or lime<br>• Do not graze in the spring or summer</p><p><strong>Beetle banks</strong></p><p>• Create or maintain an earth ridge 2m-4m wide sown with a mixture of perennial grasses<br>• Do not apply any pesticides, fertilisers or manures</p><p><strong>Undersow spring cereal</strong></p><p>• Undersow spring cereal crop (not maize) with a grass ley<br>• Keep Undersow plant growth until the cereal crop is harvested<br>• Do not destroy grass ley before July of the following year</p><p><strong>Winter cover crop</strong></p><p>• Establish a cover crop by September to provide a dense cover and protect from soil erosion<br>• Do not apply any fertilisers or manures</p><p><strong>In-field grass areas</strong><p>• Establish or maintain a dense grassy area no less than 10 m along its entire length<br>• Cut area annually after mid-July<br>• Do not apply any fertilisers or manures<br>• Only apply herbicides to control of injurious weeds or invasive non-native species<br>• Do not use for regular vehicular access or graze</p><p><strong>Low input permanent grassland</strong></p><p>• Do not plough, cultivate or re-seed<br>• Total rate of nitrogen must not exceed 100 kg/ha nitrogen per year of which a maximum of 50kg/ha can be inorganic</p><p><strong>Management of rush pastures</strong></p><p>• Maintain as grass. Do not plough, cultivate or re-seed<br>• Cut no more than a third of the area of rushes each year<br>• Only apply farm yard manure<br>• Only apply herbicides to control of injurious weeds or invasive non-native species</p><p><strong>Hedge planting</strong></p><p>• New hedges established using native species</p>"
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "1 to 3", answer_code: 1 },
                                    { answer_name: "4 to 6", answer_code: 2 },
                                    { answer_name: "7 to 9", answer_code: 3 },
                                    { answer_name: "10 to 13", answer_code: 4 },
                                    { answer_name: "N/A", answer_code: 5 }
                                ]
                            }
                        }
                    },
                    energycarbon_landusechange: {
                        title: "Land use change",
                        questions: {
                            energycarbon_landusechange_converttoarable: {
                                question_name: "Have you converted woodland or grassland to arable in the last 20 years? If so what % of your total woodland/grassland was converted?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "None", answer_code: 1 },
                                    { answer_name: "1-15%", answer_code: 2 },
                                    { answer_name: "15-30%", answer_code: 3 },
                                    { answer_name: "30-45%", answer_code: 4 },
                                    { answer_name: "45-60%+", answer_code: 5 }
                                ]
                            },
                            energycarbon_landusechange_convertfromarable: {
                                question_name: "Have you converted arable land to permanent grassland or woodland in the last 20 years? If so what % of your total arable area was converted?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "None", answer_code: 1 },
                                    { answer_name: "1-15%", answer_code: 2 },
                                    { answer_name: "15-30%", answer_code: 3 },
                                    { answer_name: "30-45%", answer_code: 4 },
                                    { answer_name: "45-60%+", answer_code: 5 }
                                ]
                            },
                        }
                    }
                }
            },
            foodsecurity: {
                title: "Food Security",
                indicators: {
                    foodsecurity_totalprodutivity: {
                        title: "Total produtivity",
                        questions: {
                            foodsecurity_totalprodutivity_yield: {
                                question_name: "How would you describe your yield compared with average yields for similar types of farm?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Well above average", answer_code: 0 },
                                    { answer_name: "Slightly above average", answer_code: 1 },
                                    { answer_name: "Average", answer_code: 2 },
                                    { answer_name: "Slightly below average", answer_code: 3 },
                                    { answer_name: "Well below average", answer_code: 4 },
                                ]
                            },
                        }
                    },
                    foodsecurity_localfood: {
                        title: "Local food",
                        question_groups: {
                            foodsecurity_localfoodgroup: {
                                heading: {
                                    html: false,
                                    content: "Approximately what percentage of your produce (by weight) is sold to the following:"
                                },
                                helper: {
                                    html: false,
                                    content: "This is likely to be an estimate especially where middle men are used and you're unsure of the location of the final sale, therefore use your discretion in allocating these percentages."
                                },
                                guidance: {
                                    html: true,
                                    content: "Based on Lobley M., Reed M., Butler A. (2005) <a href=\"https://orgprints.org/id/eprint/10114/\" target=\"_blank\">The impact of Organic Farming on the Rural Economy in England</a>, Final report to DEFRA, CRR Research report no 11"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Local sales (<10 miles)",
                                        "County sales",
                                        "Regional sales",
                                        "National sales",
                                        "International sales"
                                    ]
                                },
                                question_codes: [
                                    [ 'foodsecurity_localfood_localsales' ],
                                    [ 'foodsecurity_localfood_countysales' ],
                                    [ 'foodsecurity_localfood_regionalsales' ],
                                    [ 'foodsecurity_localfood_nationalsales' ],
                                    [ 'foodsecurity_localfood_internationalsales' ]
                                ]
                            }
                        },
                        questions: {
                            foodsecurity_localfood_localsales: {
                                question_name: "Approximately what percentage of your produce (by weight) is sold to local sales (<10 miles)",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'foodsecurity_localfoodgroup',
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                            foodsecurity_localfood_countysales: {
                                question_name: "Approximately what percentage of your produce (by weight) is sold to county sales",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'foodsecurity_localfoodgroup',
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                            foodsecurity_localfood_regionalsales: {
                                question_name: "Approximately what percentage of your produce (by weight) is sold to regional sales",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'foodsecurity_localfoodgroup',
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                            foodsecurity_localfood_nationalsales: {
                                question_name: "Approximately what percentage of your produce (by weight) is sold to national sales",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'foodsecurity_localfoodgroup',
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                            foodsecurity_localfood_internationalsales: {
                                question_name: "Approximately what percentage of your produce (by weight) is sold to national sales",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'foodsecurity_localfoodgroup',
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                        }
                    },
                    foodsecurity_offfarmfeed: {
                        title: "Off farm feed",
                        questions: {
                            foodsecurity_offfarmfeed_feed: {
                                question_name: "What percentage of your total feed (forage and concentrate) is bought in from off-farm?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                        }
                    },
                    foodsecurity_thirdpartyendorsement: {
                        title: "3rd party endorsement",
                        questions: {
                            foodsecurity_thirdpartyendorsement_havereceived: {
                                question_name: "Have you received any 3rd party endorsement for for food quality/local food production (including awards but excluding certifications)?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Yes, local 3rd party endorsement(s)", answer_code: 1 },
                                    { answer_name: "Yes, regional 3rd party endorsement(s)", answer_code: 2 },
                                    { answer_name: "Yes, national 3rd party endorsement(s)", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    foodsecurity_foodqualitycertification: {
                        title: "Food quality certification",
                        questions: {
                            foodsecurity_foodqualitycertification_certificationlevel: {
                                question_name: "What level of food quality certification do you have?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Farm assured/red tractor", answer_code: 1 },
                                    { answer_name: "Global GAP/Europe GAP/Organic certification", answer_code: 2 }
                                ]
                            },
                        }
                    },
                    foodsecurity_freshproduce: {
                        title: "Production of fresh produce",
                        questions: {
                            foodsecurity_freshproduce_fruitrootsvegetables: {
                                question_name: "Hectares of farm used to grow fruit, roots and other vegetables",
                                helper: {
                                    html: false,
                                    content: "Leave blank if this question is not applicable"
                                },
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "ha"
                            },
                            foodsecurity_freshproduce_humanconsumption: {
                                question_name: "What percentage (by weight) of your crops would you estimate goes for human consumption rather than animal consumption?",
                                helper: {
                                    html: false,
                                    content: "Leave blank if this question is not applicable"
                                },
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0, max: 100 },
                                answer_unit: "%"
                            },
                        }
                    },
                }
            },
            agriculturalsystemsdiversity: {
                title: "Agricultural systems diversity",
                indicators: {
                    agriculturalsystemsdiversity_varietaldiversity: {
                        title: "Rotational and varietal diversity",
                        question_groups: {
                            agriculturalsystemsdiversity_speciesvarietiesgroup: {
                                heading: {
                                    html: false,
                                    content: "How many species/varieties do you grow in total for each group of crops? (include the number of species in a grass mixture)"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Arable - cereals",
                                        "Arable - fodder crops",
                                        "Grain legume and oilseeds",
                                        "Vegetables",
                                        "Forage/green manure/leys",
                                        "Other crops",
                                        "Total"
                                    ]
                                },
                                question_codes: [
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_cerealsspecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_foddercropsspecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_grainlegumeoilseedsspecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_vegetablesspecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_foragespecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_otherspecies' ],
                                    [ 'agriculturalsystemsdiversity_varietaldiversity_totalspecies' ]
                                ]
                            }
                        },
                        questions: {
                            agriculturalsystemsdiversity_varietaldiversity_croprotation: {
                                question_name: "How diverse is the crop rotation on your farm in terms of numbers of crop types?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Mono-culture/no break crops/very intensive", answer_code: 1 },
                                    { answer_name: "Minimal rotation (HGCA, NIAB matrix)", answer_code: 2 },
                                    { answer_name: "Diverse rotation including a minimum of 3 crop types", answer_code: 3 },
                                    { answer_name: "Integrated crop management with extended rotation and linked with livestock enterprises", answer_code: 4 },
                                    { answer_name: "Highly diverse mix of autumn/spring sowing with a range of roots, cereals and vegetables", answer_code: 5 }
                                ]
                            },
                            agriculturalsystemsdiversity_varietaldiversity_cerealsspecies: {
                                question_name: "How many species/varieties do you grow in total for arable - cereals?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_foddercropsspecies: {
                                question_name: "How many species/varieties do you grow in total for arable - fodder crops?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_grainlegumeoilseedsspecies: {
                                question_name: "How many species/varieties do you grow in total for grain legume and oilseeds?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_vegetablesspecies: {
                                question_name: "How many species/varieties do you grow in total for vegetables?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_foragespecies: {
                                question_name: "How many species/varieties do you grow in total for forage/green manures/leys?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_otherspecies: {
                                question_name: "How many species/varieties do you grow in total for forage/green manures/leys?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of species/varieties"
                            },
                            agriculturalsystemsdiversity_varietaldiversity_totalspecies: {
                                question_name: "How many species/varieties do you grow in total for forage/green manures/leys?",
                                compulsory: false,
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_speciesvarietiesgroup',
                                answer_limits: { min: 0 },
                                answer_unit: " species/varieties"
                            },
                        }
                    },
                    agriculturalsystemsdiversity_livestockdiversity: {
                        title: "Livestock diversity",
                        compulsoryIf: [
                            {
                                question: 'initialdata_livestock_type',
                                evaluate: EVALUATORS.NOT_EMPTY
                            }
                        ],
                        question_groups: {
                            agriculturalsystemsdiversity_breedsgroup: {
                                heading: {
                                    html: false,
                                    content: "How diverse is the livestock system on the farm with regard to numbers of breeds/crossbreeds?"
                                },
                                helper: {
                                    html: false,
                                    content: "Count each breed within a cross breed as '1', eg: a dairy herd with Holstein Friesian x Brown Swiss cows would count as 2 breeds total."
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Dairy cattle",
                                        "Beef cattle",
                                        "Sheep",
                                        "Pigs",
                                        "Poultry",
                                        "Other livestock",
                                        "Total"
                                    ]
                                },
                                question_codes: [
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_dairycattlebreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_beefcattlebreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_sheepbreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_pigsbreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_poultrybreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_otherlivestockbreeds' ],
                                    [ 'agriculturalsystemsdiversity_livestockdiversity_totalbreeds' ]
                                ]
                            }
                        },
                        questions: {
                            agriculturalsystemsdiversity_livestockdiversity_species: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of species?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Single species", answer_code: 1 },
                                    { answer_name: "2 species", answer_code: 2 },
                                    { answer_name: "3 species", answer_code: 3 },
                                    { answer_name: "4 species", answer_code: 4 },
                                    { answer_name: "5+ species", answer_code: 5 }
                                ]
                            },
                            agriculturalsystemsdiversity_livestockdiversity_dairycattlebreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of dairy cattle breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_beefcattlebreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of beef cattle breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_sheepbreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of sheep breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_pigsbreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of pigs breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_poultrybreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of poultry breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_otherlivestockbreeds: {
                                question_name: "How diverse is the livestock system on the farm with regard to numbers of other livestock breeds/crossbreeds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_default: 0,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of breeds/crossbreeds"
                            },
                            agriculturalsystemsdiversity_livestockdiversity_totalbreeds: {
                                question_name: "Total number of livestock breeds/crossbreeds",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                auto_calc: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                question_group: 'agriculturalsystemsdiversity_breedsgroup',
                                answer_limits: { min: 0 },
                                answer_unit: " breeds/crossbreeds"
                            },
                        }
                    },
                    agriculturalsystemsdiversity_marketingoutlets: {
                        title: "Marketing outlets",
                        questions: {
                            agriculturalsystemsdiversity_marketingoutlets_number: {
                                question_name: "Through how many outlets do you market your produce?",
                                guidance: {
                                    html: false,
                                    content: "Examples include: farm shops, multiple retailers (supermarkets), wholesale, public procurement (schools etc), other outlets"
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "1", answer_code: 0 },
                                    { answer_name: "2", answer_code: 1 },
                                    { answer_name: "3", answer_code: 2 },
                                    { answer_name: "4", answer_code: 3 },
                                    { answer_name: "5+", answer_code: 4 },
                                ]
                            }
                        }
                    },
                    agriculturalsystemsdiversity_onfarmprocessing: {
                        title: "On farm processing",
                        questions: {
                            agriculturalsystemsdiversity_onfarmprocessing_yesorno: {
                                question_name: "Do you process on farm products?",
                                compulsory: false,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "N/A", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 }
                                ]
                            },
                        }
                    }
                }
            },
            socialcapital: {
                title: "Social Capital",
                indicators: {
                    socialcapital_employment: {
                        title: "Employment",
                        question_groups: {
                            socialcapital_employmentgroup: {
                                heading: {
                                    html: false,
                                    content: "How many staff do you employ? (including yourself)"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Casual",
                                        "Long term (including family)",
                                        "Family labour",
                                    ]
                                },
                                question_codes: [
                                    [ 'socialcapital_employment_casual' ],
                                    [ 'socialcapital_employment_longterm' ],
                                    [ 'socialcapital_employment_familylabour' ]
                                ]
                            }
                        },
                        questions: {
                            socialcapital_employment_casual: {
                                question_name: "How many casual staff do you employ?",
                                compulsory: false,
                                question_group: 'socialcapital_employmentgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "hours per year"
                            },
                            socialcapital_employment_longterm: {
                                question_name: "How many long term (including family) staff do you employ?",
                                compulsory: false,
                                question_group: 'socialcapital_employmentgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "full time equivalent"
                            },
                            socialcapital_employment_familylabour: {
                                question_name: "How many family staff do you employ?",
                                compulsory: false,
                                question_group: 'socialcapital_employmentgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "full time equivalent"
                            }
                        }
                    },
                    socialcapital_skillsandknowledge: {
                        title: "Skills and knowledge",
                        question_groups: {
                            socialcapital_skillsandknowledge_trainingdaysgroup: {
                                heading: {
                                    html: false,
                                    content: "How many training days have staff (including the farmer) had per year in total - number of days per person"
                                },
                                guidance: {
                                    html: false,
                                    content: "Training days are days on which staff learn new skills and update their knowledge. Consider specific courses and also events/workshops where attendance has achieved this and include them."
                                },
                                helper: {
                                    html: false,
                                    content: "Leave blank if there are no casual staff. Long term should not be left blank since the farmer is included."
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Casual",
                                        "Long term (including family)"
                                    ]
                                },
                                question_codes: [
                                    [ 'socialcapital_skillsandknowledge_trainingdayscasual' ],
                                    [ 'socialcapital_skillsandknowledge_trainingdayslongterm' ]
                                ]
                            }
                        },
                        questions: {
                            socialcapital_skillsandknowledge_trainingdayscasual: {
                                question_name: "How many training days have casual staff had per year in total - number of days per person",
                                compulsory: false,
                                question_group: 'socialcapital_skillsandknowledge_trainingdaysgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "number per full time employee equivalent"
                            },
                            socialcapital_skillsandknowledge_trainingdayslongterm: {
                                question_name: "How many training days have long term staff (including the farmer) had per year in total - number of days per person",
                                compulsory: true,
                                question_group: 'socialcapital_skillsandknowledge_trainingdaysgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "number per full time employee"
                            },
                            socialcapital_skillsandknowledge_qualifications: {
                                question_name: "How well qualified are your staff (including yourself)? (by experience and/or courses/certification)",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Below average", answer_code: 0 },
                                    { answer_name: "Average (e.g. BASIS, telehandler licence)", answer_code: 1 },
                                    { answer_name: "Higher than average (e.g. FACTS/BASIS)", answer_code: 2 },
                                    { answer_name: "All staff are very highly qualified/experienced (e.g. FACTS/BASIS, agricultural degree, decades of experience)", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    socialcapital_communityengagement: {
                        title: "Community engagement",
                        questions: {
                            socialcapital_communityengagement_events: {
                                question_name: "How many visitor events do you have per year?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no."
                            },
                            socialcapital_communityengagement_commeans: {
                                question_name: "Do you use any of the means of communication listed below?",
                                question_type: QUESTION_TYPE.MULTIPLE_ANSWER,
                                answer_list: [
                                    { answer_name: "Information boards", answer_code: 0 },
                                    { answer_name: "Farm walks", answer_code: 1 },
                                    { answer_name: "Website", answer_code: 2 },
                                    { answer_name: "Farm shop", answer_code: 3 },
                                    { answer_name: "Farmers' markets", answer_code: 4 },
                                    { answer_name: "Research/demonstrating projects", answer_code: 5 },
                                    { answer_name: "Open days", answer_code: 6 }
                                ]
                            },
                            socialcapital_communityengagement_nrvisitors: {
                                question_name: "How many visitors come through the farm gate?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: 'no.'
                            },
                            socialcapital_communityengagement_awards: {
                                question_name: "Have you received any awards for staff welfare/community engagement?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Yes, local award(s)", answer_code: 1 },
                                    { answer_name: "Yes, regional award(s)", answer_code: 2 },
                                    { answer_name: "Yes, national award(s)", answer_code: 3 }
                                ]
                            }
                        }
                    },
                    socialcapital_csr: {
                        title: "Corporate Social Responsibility initiatives and accreditations",
                        questions: {
                            socialcapital_csr_accreditations: {
                                question_name: "Do you hold the 'Investors in People' award or any other similar corporate social responsibility accreditations?",
                                helper: {
                                    html: false,
                                    content: "Use N/A only for small farms only employing family"
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, hold IIP, ISO14001 or similar", answer_code: 0 },
                                    { answer_name: "Working towards IIP, ISO14001 or similar", answer_code: 1 },
                                    { answer_name: "No accreditations but have policies in place (e.g staff contracts, health & safety policy)", answer_code: 2 },
                                    { answer_name: "No", answer_code: 3 },
                                    { answer_name: "N/A (small farm only employing family)", answer_code: 4 }
                                ]
                            },
                            socialcapital_csr_ethicaltradescheme: {
                                question_name: "Are you a member of an ethical trade scheme (for example, Soil Association ethical trade, SSE, Ethical Trading Initiative)",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Member of an ethical trade scheme", answer_code: 0 },
                                    { answer_name: "Working towards such membership", answer_code: 1 },
                                    { answer_name: "Not a member", answer_code: 2 }
                                ]
                            }
                        }
                    },
                    socialcapital_publicaccess: {
                        title: "Public access",
                        questions: {
                            socialcapital_publicaccess_howmuch: {
                                question_name: "How much access do you provide?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Limited or occasional", answer_code: 1 },
                                    { answer_name: "Public", answer_code: 2 },
                                    { answer_name: "Permissive", answer_code: 3 },
                                    { answer_name: "Open", answer_code: 4 }
                                ]
                            },
                            socialcapital_publicaccess_maintainareas: {
                                compulsory: true,
                                question_name: "Do you maintain areas of public access?",
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            socialcapital_publicaccess_promotepublicaccess: {
                                compulsory: true,
                                question_name: "Do you promote public access?",
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                        }
                    },
                    socialcapital_humanhealth: {
                        title: "Human health issues",
                        questions: {
                            socialcapital_humanhealth_coshh: {
                                question_name: "Have you carried out a COSHH assessment?",
                                helper: {
                                    html: false,
                                    content: "N/A option has been made available however farms where COSHH is not applicable are likely to be rare."
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes", answer_code: 0 },
                                    { answer_name: "In the process of doing so", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 },
                                    { answer_name: "N/A", answer_code: 3 }
                                ]
                            },
                            socialcapital_humanhealth_healthsafety: {
                                question_name: "How rigorously is health and safety enforced on the farm? ie: how much training and/or risk assessment is provided",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Full attention and proper training given", answer_code: 0 },
                                    { answer_name: "Some attention and proper training given", answer_code: 1 },
                                    { answer_name: "Little attention and proper training given", answer_code: 2 }
                                ]
                            },
                            socialcapital_humanhealth_hazardoussubstances: {
                                question_name: "Are staff who handle potentially hazardous substances/machinery (e.g pesticides, heavy plant machinery) given training?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "No training provided", answer_code: 0 },
                                    { answer_name: "Training provided on first use of these", answer_code: 1 },
                                    { answer_name: "Training provided and topped up if the member of staff requests", answer_code: 2 },
                                    { answer_name: "Training provided followed by regular top-ups", answer_code: 3 },
                                    { answer_name: "N/A", answer_code: 4 }
                                ]
                            },
                            socialcapital_humanhealth_workingatmosphere: {
                                question_name: "How is the working atmosphere at your farm?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Positive", answer_code: 0 },
                                    { answer_name: "Average", answer_code: 1 },
                                    { answer_name: "Poor", answer_code: 2 },
                                    { answer_name: "N/A", answer_code: 3 }
                                ]
                            },
                        }
                    }
                }
            },
            farmbusinessresilience: {
                title: "Farm Business Resilience",
                indicators: {
                    farmbusinessresilience_financialviability: {
                        title: "Financial viability",
                        question_groups: {
                            farmbusinessresilience_pricesgroup: {
                                heading: {
                                    html: false,
                                    content: "What sort of prices are you getting at present"
                                },
                                helper: {
                                    html: false,
                                    content: "Leave blank if you do not produce the product"
                                },
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Milk",
                                        "Finished beef cattle",
                                        "Weaners",
                                        "Finished pigs",
                                        "Finished lambs - lowland",
                                        "Finished lambs - upland",
                                        "Free range eggs",
                                        "Table chicken",
                                        "Feed wheat",
                                        "Milling wheat",
                                        "Barley",
                                        "Oats",
                                        "Potatoes (maincrop)",
                                        "Potatoes (early)",
                                    ]
                                },
                                question_codes: [
                                    [ 'farmbusinessresilience_financialviability_milk' ],
                                    [ 'farmbusinessresilience_financialviability_beef' ],
                                    [ 'farmbusinessresilience_financialviability_weaners' ],
                                    [ 'farmbusinessresilience_financialviability_pigs' ],
                                    [ 'farmbusinessresilience_financialviability_lambslowland' ],
                                    [ 'farmbusinessresilience_financialviability_lambsupland' ],
                                    [ 'farmbusinessresilience_financialviability_eggs' ],
                                    [ 'farmbusinessresilience_financialviability_chicken' ],
                                    [ 'farmbusinessresilience_financialviability_feedwheat' ],
                                    [ 'farmbusinessresilience_financialviability_millingwheat' ],
                                    [ 'farmbusinessresilience_financialviability_barley' ],
                                    [ 'farmbusinessresilience_financialviability_oats' ],
                                    [ 'farmbusinessresilience_financialviability_potatoesmaincrop' ],
                                    [ 'farmbusinessresilience_financialviability_potatoesearly' ]
                                ]
                            }
                        },
                        questions: {
                            farmbusinessresilience_financialviability_milk: {
                                question_name: "What sort of prices per litre of milk are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/l"
                            },
                            farmbusinessresilience_financialviability_beef: {
                                question_name: "What sort of prices for finished beef cattle are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/kg lw"
                            },
                            farmbusinessresilience_financialviability_weaners: {
                                question_name: "What sort of prices for weaners are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/head"
                            },
                            farmbusinessresilience_financialviability_pigs: {
                                question_name: "What sort of prices for finished pigs are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/kg dw"
                            },
                            farmbusinessresilience_financialviability_lambslowland: {
                                question_name: "What sort of prices for finished lambs (lowland) are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/kg lw"
                            },
                            farmbusinessresilience_financialviability_lambsupland: {
                                question_name: "What sort of prices for finished lambs (upland) are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/kg lw"
                            },
                            farmbusinessresilience_financialviability_eggs: {
                                question_name: "What sort of prices for free range eggs are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/dozen"
                            },
                            farmbusinessresilience_financialviability_chicken: {
                                question_name: "What sort of prices for table chicken are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/kg lw"
                            },
                            farmbusinessresilience_financialviability_feedwheat: {
                                question_name: "What sort of prices per tonne of feed wheat are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_millingwheat: {
                                question_name: "What sort of prices per tonne of milling wheat are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_barley: {
                                question_name: "What sort of prices per tonne of barley are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_oats: {
                                question_name: "What sort of prices per tonne of oats are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_potatoesmaincrop: {
                                question_name: "What sort of prices per tonne of potatoes (maincrop) are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_potatoesearly: {
                                question_name: "What sort of prices per tonne of potatoes (early) are you getting at present",
                                compulsory: false,
                                question_group: 'farmbusinessresilience_pricesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£/t"
                            },
                            farmbusinessresilience_financialviability_netassets: {
                                question_name: "How have your net assets (total assets less total liabilities) changed in the last year?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Increased by over 5%", answer_code: 0 },
                                    { answer_name: "Increase of less than 5%", answer_code: 1 },
                                    { answer_name: "Not much change from previous year", answer_code: 2 },
                                    { answer_name: "Decrease of less than 5%", answer_code: 3 },
                                    { answer_name: "Decrease of more than 5%", answer_code: 4 }
                                ]
                            },
                        }
                    },
                    farmbusinessresilience_farmresilience: {
                        title: "Farm resilience",
                        questions: {
                            farmbusinessresilience_farmresilience_investment: {
                                question_name: "Have you been able to carry out the investment you would like?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None", answer_code: 0 },
                                    { answer_name: "Some", answer_code: 1 },
                                    { answer_name: "About half", answer_code: 2 },
                                    { answer_name: "Most", answer_code: 3 },
                                    { answer_name: "All", answer_code: 4 },
                                ]
                            },
                            farmbusinessresilience_farmresilience_sourcesincome: {
                                question_name: "How many sources of farm income do you have?",
                                helper: {
                                    html: false,
                                    content: "Some examples: farm shop, farmers\' market, mail order, website, farmers\' co-operative, other merchants, local mart, grants."
                                },
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "1", answer_code: 0 },
                                    { answer_name: "2", answer_code: 1 },
                                    { answer_name: "3 to 4", answer_code: 2 },
                                    { answer_name: "5 to 6", answer_code: 3 },
                                    { answer_name: ">6", answer_code: 4 },
                                ]
                            },
                            farmbusinessresilience_farmresilience_stateofbusiness: {
                                question_name: "How often do you review the state of your business?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Within 6 months", answer_code: 0 },
                                    { answer_name: "Yearly", answer_code: 1 },
                                    { answer_name: "Every 2 years", answer_code: 2 },
                                    { answer_name: "Longer", answer_code: 3 }
                                ]
                            },
                            farmbusinessresilience_farmresilience_howisdoing: {
                                question_name: "How is your farm doing?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Struggling", answer_code: 0 },
                                    { answer_name: "Surviving", answer_code: 1 },
                                    { answer_name: "Making a reasonable living", answer_code: 2 },
                                    { answer_name: "Booming", answer_code: 3 },
                                ]
                            },
                            farmbusinessresilience_farmresilience_stillinbusiness: {
                                question_name: "Do you expect to still be in business next year?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            farmbusinessresilience_farmresilience_farmnextdecade: {
                                question_name: "Do you expect your farm to still be farmed in the next decade?",
                                compulsory: true,
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            }
                        }
                    }
                }
            },
            animalhealthwelfare: {
                title: "Animal Health & Welfare",
                compulsoryIf: [
                    {
                        question: 'initialdata_livestock_type',
                        evaluate: EVALUATORS.NOT_EMPTY
                    }
                ],
                indicators: {
                    animalhealthwelfare_staffresources: {
                        title: "Staff resources",
                        question_groups: {
                            animalhealthwelfare_livestockstaffgroup: {
                                heading: {
                                    html: false,
                                    content: "Number of labour units (FTEs) looking after livestock?"
                                },
                                helper: {
                                    html: false,
                                    content: "Leave blank if you do not have these livestock on farm"
                                },
                                guidance: {
                                    html: true,
                                    content: "Using standard man hours per types of livestock (sourced from the John Nix Farm Management Handbook for 2010) a calculation is made of how many FTEs handling livestock might be expected for the farm and compared to the actual number"
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Dairy cattle",
                                        "Beef cattle",
                                        "Sheep",
                                        "Pigs",
                                        "Laying birds",
                                        "Table birds"
                                    ]
                                },
                                question_codes: [
                                    [ 'animalhealthwelfare_staffresources_ftedairy' ],
                                    [ 'animalhealthwelfare_staffresources_ftebeef' ],
                                    [ 'animalhealthwelfare_staffresources_ftesheep' ],
                                    [ 'animalhealthwelfare_staffresources_ftepigs' ],
                                    [ 'animalhealthwelfare_staffresources_ftelayingbirds' ],
                                    [ 'animalhealthwelfare_staffresources_ftetablebirds' ]
                                ]
                            }
                        },
                        questions: {
                            animalhealthwelfare_staffresources_ftedairy: {
                                question_name: "Number of labour units (FTEs) looking after dairy cattle?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_ftebeef: {
                                question_name: "Number of labour units (FTEs) looking after beef cattle?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_ftesheep: {
                                question_name: "Number of labour units (FTEs) looking after sheep?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_ftepigs: {
                                question_name: "Number of labour units (FTEs) looking after pigs?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_ftelayingbirds: {
                                question_name: "Number of labour units (FTEs) looking after laying birds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_ftetablebirds: {
                                question_name: "Number of labour units (FTEs) looking after table birds?",
                                compulsory: false,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_livestockstaffgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "no. of labour units"
                            },
                            animalhealthwelfare_staffresources_illness: {
                                question_name: "How often per day are livestock inspected for signs of illness/injury?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Irregularly", answer_code: 0 },
                                    { answer_name: "Once", answer_code: 1 },
                                    { answer_name: "2-3 times", answer_code: 2 },
                                    { answer_name: "4-5 times", answer_code: 3 },
                                    { answer_name: ">5 times", answer_code: 4 }
                                ]
                            },
                            animalhealthwelfare_staffresources_stockpeopletrained: {
                                question_name: "Are your stock-people trained?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, to a high level", answer_code: 0 },
                                    { answer_name: "Yes, to an average level", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 },
                                ]
                            },
                        }
                    },
                    animalhealthwelfare_healthplan: {
                        title: "Staff resources",
                        questions: {
                            animalhealthwelfare_healthplan_plan: {
                                question_name: "Do you have a health plan?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Regularly reviewed", answer_code: 0 },
                                    { answer_name: "Drawn up", answer_code: 1 },
                                    { answer_name: "No", answer_code: 2 },
                                ]
                            },
                            animalhealthwelfare_healthplan_consultant: {
                                question_name: "Was your vet/external consultant involved in drawing it up?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Yes, worked closely with them", answer_code: 0 },
                                    { answer_name: "Yes, they drew it up with no input from farm staff", answer_code: 1 },
                                    { answer_name: "No/don't have one", answer_code: 2 },
                                ]
                            },
                            animalhealthwelfare_healthplan_aremanaged: {
                                question_name: "Does it include how animals are managed?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_healthplan_arefed: {
                                question_name: "Does it include how animals are fed?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_healthplan_currentproblems: {
                                question_name: "Does it highlight current problems?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_healthplan_strategyforproblems: {
                                question_name: "Does it include a strategy for overcoming each problem?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_healthplan_monitoringsystem: {
                                question_name: "Does the strategy have a monitoring system?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_strategyforproblems',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_healthplan_timescale: {
                                question_name: "Does the strategy have a timescale?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_plan',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 0, 1 ]
                                    },
                                    {
                                        question: 'animalhealthwelfare_healthplan_strategyforproblems',
                                        evaluate: EVALUATORS.IS_ONE_OF,
                                        value: [ 1 ]
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                        }
                    },
                    animalhealthwelfare_animalhealth: {
                        title: "Animal health",
                        question_groups: {
                            animalhealthwelfare_veterinarymedicinesgroup: {
                                heading: {
                                    html: false,
                                    content: "How much do you spend on veterinary medicines?"
                                },
                                helper: {
                                    html: false,
                                    content: "Fill in breakdown and total if known, or at least the total if breakdown is not available."
                                },
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Preventative (i.e. vaccinations, discussions with vet regarding improving management)",
                                        "Treatment - conventional",
                                        "Treatment - alternative",
                                        "Total"
                                    ]
                                },
                                question_codes: [
                                    [ 'animalhealthwelfare_animalhealth_preventive' ],
                                    [ 'animalhealthwelfare_animalhealth_conventional' ],
                                    [ 'animalhealthwelfare_animalhealth_alternative' ],
                                    [ 'animalhealthwelfare_animalhealth_total' ]
                                ]
                            }
                        },
                        questions: {
                            animalhealthwelfare_animalhealth_preventive: {
                                question_name: "How much do you spend on preventative veterinary medicines (i.e. vaccinations, discussions with vet regarding improving management)?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_veterinarymedicinesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£ total per year"
                            },
                            animalhealthwelfare_animalhealth_conventional: {
                                question_name: "How much do you spend on conventional veterinary treatments?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_veterinarymedicinesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£ total per year"
                            },
                            animalhealthwelfare_animalhealth_alternative: {
                                question_name: "How much do you spend on alternative veterinary treatments?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_veterinarymedicinesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£ total per year"
                            },
                            animalhealthwelfare_animalhealth_total: {
                                question_name: "How much do you spend in total on veterinary medicines?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_veterinarymedicinesgroup',
                                question_type: QUESTION_TYPE.NUMBER,
                                answer_limits: { min: 0 },
                                answer_unit: "£ total per year"
                            },
                            animalhealthwelfare_animalhealth_diseaseprevention: {
                                question_name: "Do you consider disease prevention in breed/ breeding stock selection (this may include considering rare/traditional breeds suited to your area of the country)?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Always", answer_code: 0 },
                                    { answer_name: "Sometimes", answer_code: 1 },
                                    { answer_name: "Never", answer_code: 2 },
                                ]
                            },
                            animalhealthwelfare_animalhealth_mortality: {
                                question_name: "How would you describe the mortality/culling rates on your farm?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Below average", answer_code: 0 },
                                    { answer_name: "Average", answer_code: 1 },
                                    { answer_name: "Above average", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_animalhealth_longevity: {
                                question_name: "How would you describe the longevity of your animals?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Below average", answer_code: 0 },
                                    { answer_name: "Average", answer_code: 1 },
                                    { answer_name: "Above average", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_animalhealth_lameness: {
                                question_name: "How would you describe lameness incidence in your animals?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "<10 cases per 100 animals", answer_code: 0 },
                                    { answer_name: "10-20 cases per 100 animals", answer_code: 1 },
                                    { answer_name: "20-30 cases per 100 animals", answer_code: 2 },
                                    { answer_name: "30-40 cases per 100 animals", answer_code: 3 },
                                    { answer_name: ">40 cases per 100 animals", answer_code: 4 }
                                ]
                            },
                            animalhealthwelfare_animalhealth_parasite: {
                                question_name: "What management methods do you use to reduce parasite burdens while minimising the use of anthelmintics?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "None, use anthelmintics routinely", answer_code: 0 },
                                    { answer_name: "One of clean grazing/faecal egg counts", answer_code: 1 },
                                    { answer_name: "Clean grazing, faecal egg counts, including natural anthelmintics in pasture (e.g. sainfoin, birdsfoot trefoil)", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_animalhealth_mastitis: {
                                question_name: "How would you describe mastitis incidence in your herd?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "<10 cases per 100 cows per year", answer_code: 0 },
                                    { answer_name: "10-25 cases per 100 cows per year", answer_code: 1 },
                                    { answer_name: "25-35 cases per 100 cows per year", answer_code: 2 },
                                    { answer_name: "35-50 cases per 100 cows per year", answer_code: 3 },
                                    { answer_name: ">50 cases per 100 cows per year", answer_code: 4 },
                                    { answer_name: "N/A (if you do not have a dairy herd)", answer_code: 5 },
                                ]
                            },
                        }
                    },
                    animalhealthwelfare_naturalbehaviours: {
                        title: "Ability to perform natural behaviours",
                        question_groups: {
                            animalhealthwelfare_naturalbehavioursgroup: {
                                heading: {
                                    html: false,
                                    content: "How do you judge your animals' ability to perform natural behaviours?"
                                },
                                compulsoryIf: [
                                    {
                                        question: "initialdata_livestock_type",
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group_type: QUESTION_GROUP_TYPE.TABLE_HEADERS_LEFT,
                                question_group_headers: {
                                    rows: [
                                        "Feeding",
                                        "Resting",
                                        "Social/Comfort"
                                    ]
                                },
                                question_codes: [
                                    [ 'animalhealthwelfare_naturalbehaviours_feeding' ],
                                    [ 'animalhealthwelfare_naturalbehaviours_resting' ],
                                    [ 'animalhealthwelfare_naturalbehaviours_social' ],
                                ]
                            },
                        },
                        questions : {
                            animalhealthwelfare_naturalbehaviours_grazing: {
                                question_name: "Do you restrict grazing/outdoor access at certain times of year (for any species)?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Don't restrict", answer_code: 0 },
                                    { answer_name: "Give access to an exercise yard in severe weather", answer_code: 1 },
                                    { answer_name: "Keep in during very severe weather", answer_code: 2 },
                                    { answer_name: "Restrict during the whole winter", answer_code: 3 },
                                    { answer_name: "Restrict during the summer", answer_code: 4 },
                                ]
                            },
                            animalhealthwelfare_naturalbehaviours_howmuchaccess: {
                                question_name: "How much access do they have to grazing/outdoors on a daily basis during times of year when they are not kept in?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "24 hour access", answer_code: 0 },
                                    { answer_name: "Kept in for short periods", answer_code: 1 },
                                    { answer_name: "Kept in overnight", answer_code: 2 },
                                    { answer_name: "Access to grazing for shorter periods", answer_code: 3 },
                                    { answer_name: "No access", answer_code: 4 },
                                ]
                            },
                            animalhealthwelfare_naturalbehaviours_feeding: {
                                question_name: "How do you judge your animals' ability to perform natural feeding behaviours?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_naturalbehavioursgroup',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Fully able to", answer_code: 0 },
                                    { answer_name: "Somewhat restricted", answer_code: 1 },
                                    { answer_name: "Unable to do so", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_naturalbehaviours_resting: {
                                question_name: "How do you judge your animals' ability to perform natural resting behaviours?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_naturalbehavioursgroup',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Fully able to", answer_code: 0 },
                                    { answer_name: "Somewhat restricted", answer_code: 1 },
                                    { answer_name: "Unable to do so", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_naturalbehaviours_social: {
                                question_name: "How do you judge your animals' ability to perform natural social/comfort behaviours?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_group: 'animalhealthwelfare_naturalbehavioursgroup',
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Fully able to", answer_code: 0 },
                                    { answer_name: "Somewhat restricted", answer_code: 1 },
                                    { answer_name: "Unable to do so", answer_code: 2 }
                                ]
                            },
                        }
                    },
                    animalhealthwelfare_housing: {
                        title: "Housing",
                        questions : {
                            animalhealthwelfare_housing_options: {
                                question_name: "How would you describe the housing/grazing options available to your livestock?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Below 'freedom foods' standards", answer_code: 0 },
                                    { answer_name: "According to 'freedom foods' standards", answer_code: 1 },
                                    { answer_name: "Higher than 'freedom foods' standards", answer_code: 2 },
                                    { answer_name: "Much higher than 'freedom foods' standards", answer_code: 3 }
                                ]
                            },
                            animalhealthwelfare_housing_design: {
                                question_name: "How is the housing designed?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "In need of upgrade", answer_code: 0 },
                                    { answer_name: "Good quality", answer_code: 1 },
                                    { answer_name: "First rate", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_housing_feedwater: {
                                question_name: "Are feed and water positioned to minimise the risk of contamination?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                            animalhealthwelfare_housing_certifications: {
                                question_name: "Do you have RSPCA 'freedom foods' certification or Organic certification?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.BOOLEAN,
                                answer_list: [
                                    { answer_name: "No", answer_code: 0 },
                                    { answer_name: "Yes", answer_code: 1 }
                                ]
                            },
                        }
                    },
                    animalhealthwelfare_biosecurity: {
                        title: "Biosecurity",
                        questions : {
                            animalhealthwelfare_biosecurity_plan: {
                                question_name: "Do you have a biosecurity plan and disease control measures in place?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Have a plan and measures in place", answer_code: 0 },
                                    { answer_name: "Have a plan but haven't acted on it yet", answer_code: 1 },
                                    { answer_name: "No plan", answer_code: 2 }
                                ]
                            },
                            animalhealthwelfare_biosecurity_newlivestock: {
                                question_name: "How do you deal with new livestock coming on to your farm?",
                                compulsory: true,
                                compulsoryIf: [
                                    {
                                        question: 'initialdata_livestock_type',
                                        evaluate: EVALUATORS.NOT_EMPTY
                                    }
                                ],
                                question_type: QUESTION_TYPE.DROPDOWN,
                                answer_list: [
                                    { answer_name: "Closed farm", answer_code: 0 },
                                    { answer_name: "Full quarantine procedures", answer_code: 1 },
                                    { answer_name: "Keep them separate for a few days", answer_code: 2 },
                                    { answer_name: "No controls", answer_code: 3 }
                                ]
                            },
                        }
                    }
                }
            }
        }
    }

    var scoring = {
        total: function() {
            var arr = []
            var categoriesScoring = this.categories
            for (var category_code in categoriesScoring) {
                if (category_code == 'initialdata') continue;
                var value = categoriesScoring[category_code].total()
                PGTOOL_SCORES[category_code] = value
                arr.push(value)
            }
            return round(avg(arr))
        },
        categories: {
            soilmanagement: {
                total: categoryTotalFn,
                indicators: {
                    soilmanagement_analysis: {
                        total: indicatorTotalFn,
                        questions: {
                            soilmanagement_analysis_often: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_analysis_somlevels: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    soilmanagement_management: {
                        total: indicatorTotalFn,
                        questions: {
                            soilmanagement_management_barearableland: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 4,
                                    3: 3,
                                    4: 2,
                                    5: 1
                                }
                                return scores[acode]
                            },
                            soilmanagement_management_harvestedbeforewinter: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    soilmanagement_wintergrazing: {
                        total: indicatorTotalFn,
                        questions: {
                            soilmanagement_wintergrazing_outwinterlivestock: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_wintergrazing_poaching: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    soilmanagement_erosion: {
                        total: indicatorTotalFn,
                        questions: {
                            soilmanagement_erosion_sheet: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_rill: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_gully: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_ponding: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_capping: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_wind: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_erosion_other: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    soilmanagement_measureserosion: {
                        total: indicatorTotalFn,
                        questions: {
                            soilmanagement_measureserosion_cultivation: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            soilmanagement_measureserosion_reducerisk: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                        }
                    }
                }
            },
            agrienvironmentalmanagement: {
                total: categoryTotalFn,
                indicators: {
                    agrienvironmentalmanagement_participation: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_participation_howmanyoptions: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5,
                                    5: false
                                }
                                return scores[acode]
                            },
                        }
                    },
                    agrienvironmentalmanagement_rarespecies: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_rarespecies_monitorflorafauna: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_rarespecies_rarespecies: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    agrienvironmentalmanagement_conservationplan: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_conservationplan_writtenplan: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 4,
                                    3: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    agrienvironmentalmanagement_thirdpartyendorsement: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_thirdpartyendorsement_havereceived: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    agrienvironmentalmanagement_habitat: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_habitat_percpp: function() {
                                var avalue = get('agrienvironmentalmanagement_habitat_percpp')
                                if (avalue < 5) {
                                    return 1
                                } else if (avalue < 10) {
                                    return 2
                                } else if (avalue < 15) {
                                    return 3
                                } else if (avalue < 20) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            agrienvironmentalmanagement_habitat_perclowinputpp: function() {
                                var avalue = get('agrienvironmentalmanagement_habitat_perclowinputpp')
                                if (avalue == 0) {
                                    return 1
                                } else if (avalue < 25) {
                                    return 2
                                } else if (avalue < 50) {
                                    return 3
                                } else if (avalue < 75) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            agrienvironmentalmanagement_habitat_bufferstrips: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_wintercover: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_nativewoodland: function() {
                                var avalue = calculatePercentage(get('agrienvironmentalmanagement_habitat_nativewoodland'), get('initialdata_landuse_totalarea'))
                                if (avalue < 5) {
                                    return 1
                                } else if (avalue < 10) {
                                    return 2
                                } else if (avalue < 15) {
                                    return 3
                                } else if (avalue < 20) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            agrienvironmentalmanagement_habitat_woodlandmanagement: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_excludelivestock: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 5,
                                    3: 1
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_protecttrees: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_wildlifehabitat: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_habitat_monitor: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    agrienvironmentalmanagement_pesticides: {
                        total: indicatorTotalFn,
                        questions: {
                            agrienvironmentalmanagement_pesticides_use:  function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_avoid:  function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1,
                                    3: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_impact: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 1,
                                    4: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_amount: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 4,
                                    3: 5,
                                    4: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_sprayer: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5,
                                    5: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_watercontamination: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1,
                                    3: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_beessafety: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 1,
                                    2: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_beessafetyspray: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 1,
                                    2: false
                                }
                                return scores[acode]
                            },
                            agrienvironmentalmanagement_pesticides_birdssafety: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 1,
                                    2: false
                                }
                                return scores[acode]
                            },
                        }
                    }
                }
            },
            landscapeheritage: {
                total: categoryTotalFn,
                indicators: {
                    landscapeheritage_historicfeatures: {
                        total: indicatorTotalFn,
                        questions: {
                            landscapeheritage_historicfeatures_maintenance: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    landscapeheritage_landscapefeatures: {
                        total: indicatorTotalFn,
                        questions: {
                            landscapeheritage_landscapefeatures_characteristicfarm: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    landscapeheritage_boundaries: {
                        total: indicatorTotalFn,
                        questions: {
                            landscapeheritage_boundaries_hev: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            landscapeheritage_boundaries_hedgerowtrees: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            landscapeheritage_boundaries_restore: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    landscapeheritage_geneticheritage: {
                        total: indicatorTotalFn,
                        questions: {
                            landscapeheritage_geneticheritage_rarebreeds: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                            landscapeheritage_geneticheritage_crops: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                        }
                    }
                }
            },
            water: {
                total: categoryTotalFn,
                indicators: {
                    water_protection: {
                        total: indicatorTotalFn,
                        questions: {
                            water_protection_actions: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5,
                                    4: false
                                }
                                return scores[acode]
                            },
                        }
                    },
                    water_flood: {
                        total: indicatorTotalFn,
                        questions: {
                            water_flood_mitigationsystem: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5,
                                    5: false
                                }
                                return scores[acode]
                            },
                        }
                    },
                    water_plan: {
                        total: indicatorTotalFn,
                        questions: {
                            water_plan_completed: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5,
                                    5: false
                                }
                                return scores[acode]
                            },
                        }
                    },
                    water_harvesting: {
                        total: indicatorTotalFn,
                        questions: {
                            water_harvesting_recycled: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5,
                                    4: false
                                }
                                return scores[acode]
                            },
                            water_harvesting_raingroundwater: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5,
                                    4: false
                                }
                                return scores[acode]
                            },
                        }
                    },
                    water_irrigation: {
                        total: indicatorTotalFn,
                        questions: {
                            water_irrigation_crops: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: false,
                                    2: false
                                }
                                return scores[acode]
                            },
                            water_irrigation_uaairrigated: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 4,
                                    3: 3,
                                    4: 2,
                                    5: 1
                                }
                                return scores[acode]
                            },
                            water_irrigation_appsystem: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 5,
                                    4: 3
                                }
                                return scores[acode]
                            },
                            water_irrigation_rate: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            water_irrigation_pressure: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            water_irrigation_uniformity: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            water_irrigation_weatherconditions: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            water_irrigation_summerirri: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 5
                                }
                                return scores[acode]
                            },
                            water_irrigation_system: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                        }
                    }
                }
            },
            npkbudget: {
                total: categoryTotalFn,
                indicators: {
                    npkbudget_nutrientbalance: {
                        total: indicatorTotalFn,
                        questions: {
                            npkbudget_nutrientbalance_nbalanceha: function() {
                                var value = get('npkbudget_nutrientbalance_nbalanceha')
                                if (value === false) return false
                                var absvalue = Math.abs(value)
                                if (absvalue >= 110) {
                                    return 1
                                } else if (absvalue >= 90 && absvalue < 110) {
                                    return 2
                                } else if (absvalue >= 70 && absvalue < 90) {
                                    return 3
                                } else if (absvalue >= 50 && absvalue < 70) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            npkbudget_nutrientbalance_pbalanceha: function() {
                                var value = get('npkbudget_nutrientbalance_pbalanceha')
                                if (value === false) return false
                                var absvalue = Math.abs(value)
                                if (absvalue >= 10) {
                                    return 1
                                } else if (absvalue >= 5 && absvalue < 10) {
                                    return 3
                                } else {
                                    return 5
                                }
                            },
                            npkbudget_nutrientbalance_kbalanceha: function() {
                                var value = get('npkbudget_nutrientbalance_kbalanceha')
                                if (value === false) return false
                                var absvalue = Math.abs(value)
                                if (absvalue >= 10) {
                                    return 1
                                } else if (absvalue >= 5 && absvalue < 10) {
                                    return 3
                                } else {
                                    return 5
                                }
                            },
                        }
                    }
                }
            },
            fertiliserman: {
                total: categoryTotalFn,
                indicators: {
                    fertiliserman_fertiliser: {
                        total: indicatorTotalFn,
                        questions: {
                            fertiliserman_fertiliser_spreaders: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_fertiliser_rates: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_fertiliser_nfertilisers: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    fertiliserman_nutrientplanning: {
                        total: indicatorTotalFn,
                        questions: {
                            fertiliserman_nutrientplanning_levelapplication: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_nutrientplanning_monitornutrientlevels: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_nutrientplanning_stafftraining: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_nutrientplanning_organiccompostscontent: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    fertiliserman_manureman: {
                        total: indicatorTotalFn,
                        questions: {
                            fertiliserman_manureman_storemanure: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 3,
                                    5: 4,
                                    6: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_storeslurry: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_storeslurryfloor: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_storeslurrycapacity: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_storeslurryinspect: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_spreadslurry: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 4,
                                    4: 5,
                                    5: 3
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_slurryapplications: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_timespread: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_incorporateslurry: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_manureman_incorporatemanure: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    fertiliserman_farmwaste: {
                        total: indicatorTotalFn,
                        questions: {
                            fertiliserman_farmwaste_recycled: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_farmwaste_medicinedisposal: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 5,
                                    5: 4,
                                    6: 5
                                }
                                return scores[acode]
                            },
                            fertiliserman_farmwaste_wastestrategy: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            }
                        }
                    }
                }
            },
            energycarbon: {
                total: categoryTotalFn,
                indicators: {
                    energycarbon_fueluse: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_fueluse_arablepercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_beefpercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_dairypercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_pigpercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_poultryeggspercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_poultrymeatpercbenchmark: function(bench) {
                                if (bench === false) {
                                    return false
                                } else if (bench <= 50) {
                                    return 5
                                } else if (bench <= 75) {
                                    return 4
                                } else if (bench <= 100) {
                                    return 3
                                } else if (bench <= 125) {
                                    return 2
                                } else if (bench > 125) {
                                    return 1
                                } else {
                                    return false
                                }
                            },
                        }
                    },
                    energycarbon_renewableenergy: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_renewableenergy_renewableenergyperc: function(perc) {
                                if (perc == 0) {
                                    return 1
                                } else if (perc <= 20) {
                                    return 2
                                } else if (perc <= 40) {
                                    return 3
                                } else if (perc <= 60) {
                                    return 4
                                } else if (perc <= 100) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_renewableenergy_percrenewableenergyonfarm: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            energycarbon_renewableenergy_produceenergy: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    energycarbon_energyratio: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_energyratio_ratioarable: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiobeefsheep: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiodairy: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiopig: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiopoultrymeat: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiopoultryeggs: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            },
                            energycarbon_energyratio_ratiobiomass: function(ratio) {
                                if (ratio === false) {
                                    return false
                                } else if (ratio < 1) {
                                    return 1
                                } else if (ratio < 3) {
                                    return 2
                                } else if (ratio < 5) {
                                    return 3
                                } else if (ratio < 7) {
                                    return 4
                                } else if (ratio >= 7) {
                                    return 5
                                } else {
                                    return false
                                }
                            }
                        }
                    },
                    energycarbon_energysavingoptions: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_energysavingoptions_monitor: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            energycarbon_energysavingoptions_energyaudit: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    energycarbon_greenhousegases: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_greenhousegases_audit: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            energycarbon_greenhousegases_options: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5,
                                    5: false
                                }
                                return scores[acode]
                            }
                        }
                    },
                    energycarbon_landusechange: {
                        total: indicatorTotalFn,
                        questions: {
                            energycarbon_landusechange_converttoarable: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 4,
                                    3: 3,
                                    4: 2,
                                    5: 1
                                }
                                return scores[acode]
                            },
                            energycarbon_landusechange_convertfromarable: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            }
                        }
                    }

                }
            },
            foodsecurity: {
                total: categoryTotalFn,
                indicators: {
                    foodsecurity_totalprodutivity: {
                        total: indicatorTotalFn,
                        questions: {
                            foodsecurity_totalprodutivity_yield: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            }
                        }
                    },
                    foodsecurity_localfood: {
                        total: function() {
                            var sales = get('foodsecurity_localfood_localsales') + get('foodsecurity_localfood_countysales') + get('foodsecurity_localfood_regionalsales')
                            if (sales > 80) {
                                return 5
                            } else if (sales > 60) {
                                return 4
                            } else if (sales > 40) {
                                return 3
                            } else if (sales > 20) {
                                return 2
                            } else {
                                return 1
                            }
                        }
                    },
                    foodsecurity_offfarmfeed: {
                        total: indicatorTotalFn,
                        questions: {
                            foodsecurity_offfarmfeed_feed: function(value) {
                                if (value === 0) {
                                    return 5
                                } else if (value < 20) {
                                    return 4
                                } else if (value < 40) {
                                    return 3
                                } else if (value < 60) {
                                    return 2
                                } else {
                                    return 1
                                }
                            }
                        }
                    },
                    foodsecurity_thirdpartyendorsement: {
                        total: indicatorTotalFn,
                        questions: {
                            foodsecurity_thirdpartyendorsement_havereceived: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    foodsecurity_foodqualitycertification: {
                        total: indicatorTotalFn,
                        questions: {
                            foodsecurity_foodqualitycertification_certificationlevel: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    foodsecurity_freshproduce: {
                        total: indicatorTotalFn,
                        questions: {
                            foodsecurity_freshproduce_fruitrootsvegetables: function(value) {
                                if (value === false) return false
                                var perc = value / get('initialdata_landuse_totalUAA')
                                if (perc > 0.2) {
                                    return 5
                                } else if (perc > 0.15) {
                                    return 4
                                } else if (perc > 0.10) {
                                    return 3
                                } else if (perc > 0.05) {
                                    return 2
                                } else {
                                    return 1
                                }
                            },
                            foodsecurity_freshproduce_humanconsumption: function(value) {
                                if (value === false) return false
                                if (value < 20) {
                                    return 1
                                } else if (value < 40) {
                                    return 2
                                } else if (value < 60) {
                                    return 3
                                } else if (value < 80) {
                                    return 4
                                } else {
                                    return 5
                                }
                            }
                        }
                    }
                }
            },
            agriculturalsystemsdiversity: {
                total: categoryTotalFn,
                indicators: {
                    agriculturalsystemsdiversity_varietaldiversity: {
                        total: indicatorTotalFn,
                        questions: {
                            agriculturalsystemsdiversity_varietaldiversity_croprotation: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            agriculturalsystemsdiversity_varietaldiversity_totalspecies: function(total) {
                                if (total === 0) {
                                    return false
                                } else if (total <= 3) {
                                    return 1
                                } else if (total <= 6) {
                                    return 2
                                } else if (total <= 10) {
                                    return 3
                                } else if (total <= 15) {
                                    return 4
                                } else {
                                    return 5
                                }
                            }
                        }
                    },
                    agriculturalsystemsdiversity_livestockdiversity: {
                        total: indicatorTotalFn,
                        questions: {
                            agriculturalsystemsdiversity_livestockdiversity_species: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 5
                                }
                                return scores[acode]
                            },
                            agriculturalsystemsdiversity_livestockdiversity_totalbreeds: function(total) {
                                if (total == 0) {
                                    return false
                                } else if (total == 1) {
                                    return 1
                                } else if (total == 2) {
                                    return 2
                                } else if (total == 3) {
                                    return 3
                                } else if (total == 4) {
                                    return 4
                                } else {
                                    return 5
                                }
                            }
                        }
                    },
                    agriculturalsystemsdiversity_marketingoutlets: {
                        total: indicatorTotalFn,
                        questions: {
                            agriculturalsystemsdiversity_marketingoutlets_number: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    agriculturalsystemsdiversity_onfarmprocessing: {
                        total: indicatorTotalFn,
                        questions: {
                            agriculturalsystemsdiversity_onfarmprocessing_yesorno: function(acode) {
                                var scores = {
                                    0: false,
                                    1: 5,
                                    2: 1
                                }
                                return scores[acode]
                            }
                        }
                    }
                }
            },
            socialcapital: {
                total: categoryTotalFn,
                indicators: {
                    socialcapital_employment: {
                        total: function() {
                            var longtermscore = (PGTOOL_ANSWERS.socialcapital_employment_longterm = this.questions.socialcapital_employment_longterm(get('socialcapital_employment_longterm')))
                            if (longtermscore == 5) {
                                return 5
                            } else if (longtermscore == 4) {
                                return 4
                            } else {
                                var casualscore = (PGTOOL_ANSWERS.socialcapital_employment_casual = this.questions.socialcapital_employment_casual(get('socialcapital_employment_casual')))
                                var familylabourscore = (PGTOOL_ANSWERS.socialcapital_employment_familylabour = this.questions.socialcapital_employment_familylabour(get('socialcapital_employment_familylabour')))
                                return round(avg([longtermscore, casualscore, familylabourscore]), 0)
                            }
                        },
                        questions: {
                            socialcapital_employment_casual: function(hoursperyear) {
                                if (hoursperyear === false) return false
                                var value = ((hoursperyear/WORKING_HOURS_PER_YEAR)/get('initialdata_landuse_totalUAA'))/LABOUR_USE_IN_FTE_PER_HA
                                if (value < 0.8) {
                                    return 1
                                } else if (value < 1.2) {
                                    return 3
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_employment_longterm: function(hoursperyear) {
                                if (hoursperyear === false) return false
                                var value = (hoursperyear/get('initialdata_landuse_totalUAA'))/LABOUR_USE_IN_FTE_PER_HA
                                if (value < 0.8) {
                                    return 1
                                } else if (value < 1.2) {
                                    return 3
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_employment_familylabour: function(hoursperyear) {
                                if (hoursperyear === false) return false
                                var value = (hoursperyear/get('initialdata_landuse_totalUAA'))/LABOUR_USE_IN_FTE_PER_HA
                                if (value < 0.8) {
                                    return 1
                                } else if (value < 1.2) {
                                    return 3
                                } else {
                                    return 5
                                }
                            }
                        }
                    },
                    socialcapital_skillsandknowledge: {
                        total: indicatorTotalFn,
                        questions: {
                            socialcapital_skillsandknowledge_trainingdayscasual: function(value) {
                                if (value === false) return false
                                if (value < 1) {
                                    return 1
                                } else if (value == 1) {
                                    return 2
                                } else if (value == 2) {
                                    return 3
                                } else if (value == 3) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_skillsandknowledge_trainingdayslongterm: function(value) {
                                if (value === false) return false
                                if (value < 1) {
                                    return 1
                                } else if (value == 1) {
                                    return 2
                                } else if (value == 2) {
                                    return 3
                                } else if (value == 3) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_skillsandknowledge_qualifications: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 4,
                                    3: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    socialcapital_communityengagement: {
                        total: indicatorTotalFn,
                        questions: {
                            socialcapital_communityengagement_events: function(value) {
                                if (value === 0) {
                                    return 1
                                } else if (value === 1) {
                                    return 1
                                } else if (value === 2) {
                                    return 2
                                } else if (value === 3) {
                                    return 3
                                } else if (value === 4) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_communityengagement_commeans: function(acodes) {
                                var total = acodes.length
                                var scores = {
                                    0: 1,
                                    1: 1,
                                    2: 2,
                                    3: 3,
                                    4: 4,
                                    5: 4,
                                    6: 5,
                                    7: 5
                                }
                                return scores[total]
                            },
                            socialcapital_communityengagement_nrvisitors: function(value) {
                                if (value < 100) {
                                    return 1
                                } else if (value < 200) {
                                    return 2
                                } else if (value < 300) {
                                    return 3
                                } else if (value < 400) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            socialcapital_communityengagement_awards: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    socialcapital_csr: {
                        total: indicatorTotalFn,
                        questions: {
                            socialcapital_csr_accreditations: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 1,
                                    4: false
                                }
                                return scores[acode]
                            },
                            socialcapital_csr_ethicaltradescheme: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            }
                        }
                    },
                    socialcapital_publicaccess: {
                        total: indicatorTotalFn,
                        questions: {
                            socialcapital_publicaccess_howmuch: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            socialcapital_publicaccess_maintainareas: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            socialcapital_publicaccess_promotepublicaccess: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    socialcapital_humanhealth: {
                        total: indicatorTotalFn,
                        questions: {
                            socialcapital_humanhealth_coshh: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1,
                                    3: false
                                }
                                return scores[acode]
                            },
                            socialcapital_humanhealth_healthsafety: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            socialcapital_humanhealth_hazardoussubstances: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 5,
                                    4: false
                                }
                                return scores[acode]
                            },
                            socialcapital_humanhealth_workingatmosphere: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            }
                        }
                    }
                }
            },
            farmbusinessresilience: {
                total: categoryTotalFn,
                indicators: {
                    farmbusinessresilience_financialviability: {
                        total: indicatorTotalFn,
                        questions: {
                            farmbusinessresilience_financialviability_milk: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.MILK
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_beef: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.BEEF_COW
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_weaners: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.WEANERS
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_pigs: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.FINISHED_PIGS
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_lambslowland: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.LAMBS_LOWLAND
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_lambsupland: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.LAMBS_UPLAND
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_eggs: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.FREE_RANGE_EGGS
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_chicken: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.TABLE_CHICKEN
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_feedwheat: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.FEED_WHEAT
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_millingwheat: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.MILLING_WHEAT
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_barley: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.BARLEY
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_oats: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.OATS
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_potatoesmaincrop: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.POTATOES_MAINCROP
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_potatoesearly: function(value) {
                                if (value === false) return false
                                var ratio = value/PRICES.POTATOES_EARLY
                                if (ratio < 0.5) {
                                    return 1
                                } else if (ratio < 0.9) {
                                    return 2
                                } else if (ratio < 1.1) {
                                    return 3
                                } else if (ratio < 1.5) {
                                    return 4
                                } else {
                                    return 5
                                }
                            },
                            farmbusinessresilience_financialviability_netassets: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            }
                        }
                    },
                    farmbusinessresilience_farmresilience: {
                        total: indicatorTotalFn,
                        questions: {
                            farmbusinessresilience_farmresilience_investment: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            farmbusinessresilience_farmresilience_sourcesincome: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            farmbusinessresilience_farmresilience_stateofbusiness: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 2,
                                    3: 1
                                }
                                return scores[acode]
                            },
                            farmbusinessresilience_farmresilience_howisdoing: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 4,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            farmbusinessresilience_farmresilience_stillinbusiness: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            farmbusinessresilience_farmresilience_farmnextdecade: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            }
                        }
                    }
                }
            },
            animalhealthwelfare: {
                total: categoryTotalFn,
                indicators: {
                    animalhealthwelfare_staffresources: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_staffresources_ftedairy: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.DAIRY_COWS * getNrAnimals(['dairy_cow', 'dairy_heifer_in_calf']))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_ftebeef: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.BEEF_COWS * getNrAnimals(['dairy_cattle_12-24_months', 'dairy_cattle_over_24_months', 'suckler_cow']))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_ftesheep: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.EWES * getNrAnimals(['ewes', 'rams' ]))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_ftepigs: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.SOWS * getNrAnimals(['sows']))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_ftelayingbirds: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.LAYING_BIRDS * getNrAnimals(['laying_hens']))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_ftetablebirds: function(value) {
                                if (value === false) {
                                    return false
                                } else {
                                    var ratio = value / ((SMD_PER_HEAD.TABLE_BIRDS * getNrAnimals(['table_birds']))/365)
                                    if (ratio < 0.8) {
                                        return 1
                                    } else if (ratio < 1.2) {
                                        return 3
                                    } else {
                                        return 5
                                    }
                                }
                            },
                            animalhealthwelfare_staffresources_illness: function(acode) {
                                var scores = {
                                    0: 1,
                                    1: 2,
                                    2: 3,
                                    3: 4,
                                    4: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_staffresources_stockpeopletrained: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            }
                        }
                    },
                    animalhealthwelfare_healthplan: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_healthplan_plan: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_consultant: function(acode) {
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_aremanaged: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_arefed: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_currentproblems: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_strategyforproblems: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_monitoringsystem: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_healthplan_timescale: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            }
                        }
                    },
                    animalhealthwelfare_animalhealth: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_animalhealth_total: function(value) {
                                if (value === false) return false
                                var totalLU = 0
                                var livestock = get('initialdata_livestock_type')
                                var nrAnimals = get('initialdata_livestock_nranimals')
                                for (var i = 0; i < livestock.length; i++) {
                                    var livestockData = DATASETS.LIVESTOCK[livestock[i]]
                                    if ('lu' in livestockData) {
                                        totalLU += nrAnimals[i] * livestockData.lu
                                    }
                                }
                                var totalSpendPerLU = value / totalLU
                                if (totalSpendPerLU < 25) {
                                    return 5
                                } else if (totalSpendPerLU < 40) {
                                    return 4
                                } else if (totalSpendPerLU < 55) {
                                    return 3
                                } else if (totalSpendPerLU < 70) {
                                    return 2
                                } else {
                                    return 1
                                }
                            },
                            animalhealthwelfare_animalhealth_diseaseprevention: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_animalhealth_mortality: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_animalhealth_longevity: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_animalhealth_lameness: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_animalhealth_parasite: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_animalhealth_mastitis: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            },
                        }
                    },
                    animalhealthwelfare_naturalbehaviours: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_naturalbehaviours_grazing: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_naturalbehaviours_howmuchaccess: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 2,
                                    4: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_naturalbehaviours_feeding: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_naturalbehaviours_resting: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_naturalbehaviours_social: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                        }
                    },
                    animalhealthwelfare_housing: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_housing_options: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 4,
                                    3: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_housing_design: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 3,
                                    2: 5
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_housing_feedwater: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 3
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_housing_certifications: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 1,
                                    1: 5
                                }
                                return scores[acode]
                            },
                        }
                    },
                    animalhealthwelfare_biosecurity: {
                        total: indicatorTotalFn,
                        questions: {
                            animalhealthwelfare_biosecurity_plan: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 3,
                                    2: 1
                                }
                                return scores[acode]
                            },
                            animalhealthwelfare_biosecurity_newlivestock: function(acode) {
                                if (acode === false) return false
                                var scores = {
                                    0: 5,
                                    1: 4,
                                    2: 3,
                                    3: 1
                                }
                                return scores[acode]
                            },

                        }
                    }
                }
            }
        }
    }

    function convertToDirectEnergyUse(contractType, amount) {
        var dieselCO2Emissions = DATASETS.FUELS.red_diesel.co2_emissions
        var dieselEnergyContent = DATASETS.FUELS.red_diesel.energy_content_mj_per_unit

        if (contractType == 'whole_crop_stubble_to_stubble') {
            return amount * 180 * dieselEnergyContent
        } else if (contractType == 'contractor_combine_harvesting') {
            return amount * 18 * dieselEnergyContent
        } else {
            var kgCO2Emissions = amount * DATASETS.CONTRACTS[contractType].co2_emissions
            return (kgCO2Emissions / dieselCO2Emissions) * dieselEnergyContent // contractors assumes red_diesel  
        }
    }

    function getTotalEnergyPerType(type) {
        var ownfuel_typeall = get("energycarbon_fueluse_ownfueltype")
        var enterprises = [ 'arable', 'horticulture', 'beefsheep', 'dairy', 'pig', 'poultryeggs', 'poultrymeat', 'biomassprod' ]
        var energy = 0
        for (var i = 0; i < ownfuel_typeall.length; i++) {
            var ownfuel_type = get("energycarbon_fueluse_ownfueltype", i)
            if (type !== ownfuel_type) continue;
            for (enterprise of enterprises) {
                var ownfuel_ammount = get("energycarbon_fueluse_ownfuelamount", i)
                var ownfuel_perc = get("energycarbon_fueluse_ownfuelperc" + enterprise, i)
                energy += ownfuel_ammount * (ownfuel_perc / 100) * DATASETS.FUELS[ownfuel_type].energy_content_mj_per_unit
            }
        }
        return energy
    }

    function getTotalEnergyPerEnterprise(enterprise) {
        var ownfuel_typeall = get("energycarbon_fueluse_ownfueltype")

        // summing the own fuel spent on this enterprise
        var ownfuel = 0
        for (var i = 0; i < ownfuel_typeall.length; i++) {
            var ownfuel_type = get("energycarbon_fueluse_ownfueltype", i)
            if (ownfuel_type === false) continue;
            var ownfuel_ammount = get("energycarbon_fueluse_ownfuelamount", i)
            var ownfuel_perc = get("energycarbon_fueluse_ownfuelperc" + enterprise, i)
            ownfuel += ownfuel_ammount * (ownfuel_perc / 100) * DATASETS.FUELS[ownfuel_type].energy_content_mj_per_unit
        }

        var contract = 0
        // summing the contractor fuel spent on this enterprise
        var contract_typeall = get("energycarbon_fueluse_contractortype")
        for (var i = 0; i < contract_typeall.length; i++) {
            var contract_type = get("energycarbon_fueluse_contractortype", i)
            if (contract_type === false) continue;
            var contract_ammount = get("energycarbon_fueluse_contractoramount", i)
            var contract_perc = get("energycarbon_fueluse_contractorperc" + enterprise, i)
            var directEnergyUseAmount = convertToDirectEnergyUse(contract_type, contract_ammount);
            contract += directEnergyUseAmount * (contract_perc / 100)
        }
        return ownfuel + contract
    }

    function getNrAnimals(types) {
        var livestockType = get("initialdata_livestock_type")
        var nranimals = get("initialdata_livestock_nranimals")
        var total = 0
        for (var i = 0; i < livestockType.length; i++){
            if (types.includes(livestockType[i])) {
                total += nranimals[i]
            }
        }
        return total
    }

    function getCattleMeatNrAnimals() {
        var livestockIDs = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
            return livestock.type == 'cattle_meat'
        }))
        return getNrAnimals(livestockIDs)
    }

    function getCattleDairyNrAnimals() {
        var livestockIDs = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
                return livestock.type == 'cattle_dairy'
            }))
        return getNrAnimals(livestockIDs)
    }

    function getSheepNrAnimals() {
        var sheepIDs = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
                return livestock.type == 'sheep'
            }))
        return getNrAnimals(sheepIDs)
    }

    function getBeefSheepNrAnimals() {
        return getCattleMeatNrAnimals() + getSheepNrAnimals()
    }

    function getPigNrAnimals() {
        var pigIDs = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
            return livestock.type == 'pig'
        }))
        return getNrAnimals(pigIDs)
    }

    function getPoultryEggsNrAnimals() {
        var ids = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
            return livestock.type == 'poultry_eggs'
        }))
        return getNrAnimals(ids)
    }

    function getPoultryMeatNrAnimals() {
        var ids = Object.keys(Object.filter(DATASETS.LIVESTOCK, function(livestock) {
            return livestock.type == 'poultry_meat'
        }))
        return getNrAnimals(ids)
    }

    function getCropEnergyExported() {
        var crops = get('initialdata_crops_cropname')
        if (crops === false) return false
        var energy = 0
        for (var i = 0; i < crops.length; i++) {
            var cropid = get('initialdata_crops_cropname', i)
            if (cropid === false) continue;
            var tonnesExported = get('initialdata_crops_cropyieldexport', i)
            energy += DATASETS.CROPS[cropid].energy_content_mj_tonne * tonnesExported
        }
        return energy;
    }

    function getLivestockEnergyExported(category) {
        var livestocktypes = get('initialdata_livestock_type')
        if (livestocktypes === false) return false

        var energy = 0
        for (var i = 0; i < livestocktypes.length; i++) {
            var livestocktype = get('initialdata_livestock_type', i)
            if (livestocktype === false) continue;
            var nrExported = get('initialdata_livestock_export', i)
            var livestock = DATASETS.LIVESTOCK[livestocktype]
            if (livestock.type == category) {
                energy += livestock.energy_content_mj_tonne * nrExported
            }
        }
        return energy;
    }

    function getBiomassEnergyExported() {
        var energy = 0

        var croptypes = [ 'miscanthus', 'short_rotation_coppice' ]
        var crops = get('initialdata_crops_cropname')
        if (crops !== false) {
            for (var i = 0; i < crops.length; i++) {
                var cropid = crops[i]
                if (croptypes.includes(cropid)) {
                    var tonnesExported = get('initialdata_crops_cropyieldexport', i)
                    energy += DATASETS.CROPS[cropid].energy_content_mj_tonne * tonnesExported
                }
            }
        }

        var woodland = [
            'initialdata_woodland_coniferunder10export',
            'initialdata_woodland_conifer1020export',
            'initialdata_woodland_coniferover20export',
            'initialdata_woodland_broadleavedunder10export',
            'initialdata_woodland_broadleaved1020export',
            'initialdata_woodland_broadleavedover20export',
            'initialdata_woodland_mixedwoodlandexport',
            'initialdata_woodland_hedgefuelexport'
        ]
        for (var qcode of woodland) {
            var tonnesExported = get(qcode)
            energy += tonnesExported * WOODLAND_ENERGY_CONTENT
        }
        return energy
    }

    function getLivestockProdEnergyExported(category) {
        var livestockprods = get('initialdata_livestock_producttype')
        if (livestockprods === false) return false

        var energy = 0
        for (var i = 0; i < livestockprods.length; i++) {
            var livestockprod = get('initialdata_livestock_producttype', i)
            if (livestockprod === false) continue;
            var tonnesExported = get('initialdata_livestock_productexport', i)
            var livestock = DATASETS.LIVESTOCK_PRODUCTS[livestockprod]
            if (livestock.type == category) {
                energy += livestock.energy_content_mj_tonne * tonnesExported
            }
        }
        return energy;
    }

    function getNutrientBudget(nutrient, datasetID, qcode_type, qcode_impexp) {
        if (nutrient == 'nfix') {
            nutrient_string = 'n_kg_ha'
        } else {
            nutrient_string = nutrient + '_kg_tonne'
        }
        var arr = []
        var types = get(qcode_type)
        if (types === false) return [false]

        for (var i = 0; i < types.length; i++) {
            var type = get(qcode_type, i)
            if (type === false) continue;
            var tonnes = get(qcode_impexp, i)
            if (type == 'other_organic_fertiliser') {
                var nutrient_content = get('initialdata_fertilisers_organic' + nutrient, i)
                arr.push(nutrient_content * tonnes)
            } else if (type == 'other_inorganic_fertiliser') {
                var nutrient_content = get('initialdata_fertilisers_inorganic' + nutrient, i)
                arr.push(nutrient_content * tonnes)
            } else {
                arr.push(DATASETS[datasetID][type][nutrient_string] * tonnes)
            }
        }
        return arr;
    }

    var calculations = {
        categories: {
            initialdata: {
                aggregator: categoryAggregatorFn,
                indicators: {
                    initialdata_farminfo: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            initialdata_farminfo_fbsclassification: function() {
                                return "TO BE IMPLEMENTED"
                            }
                        }
                    },
                    initialdata_woodland: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            initialdata_woodland_hedgefuelyieldtotal: function() {
                                return get('initialdata_woodland_hedgefuelyield') * get('initialdata_woodland_hedgefuelharvested')
                            }
                        }
                    },
                    initialdata_landuse: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            initialdata_landuse_totalarablearea: function() {
                                var croparea = sum(get('initialdata_crops_croparea'))
                                var foragecroparea = sum(get('initialdata_crops_foragecroparea'))
                                return croparea + foragecroparea
                            },
                            initialdata_landuse_totalgrassarea: function() {
                                return sum(get('initialdata_crops_permanentpasturearea')) + get('initialdata_crops_moorland') + get('initialdata_crops_other')
                            },
                            initialdata_landuse_totalUAA: function() {
                                return get('initialdata_landuse_totalarablearea') + get('initialdata_landuse_totalgrassarea')
                            },
                            initialdata_landuse_totalwoodland: function() {
                                return get('initialdata_woodland_coniferunder10area') + get('initialdata_woodland_conifer1020area') + get('initialdata_woodland_coniferover20area') + get('initialdata_woodland_broadleavedunder10area') + get('initialdata_woodland_broadleaved1020area') + get('initialdata_woodland_broadleavedover20area') + get('initialdata_woodland_mixedwoodlandarea')
                            },
                            initialdata_landuse_totalotherland: function() {
                                return get('initialdata_crops_ponds') + get('initialdata_crops_noncropped') + get('initialdata_crops_othernonagriculturalland')
                            },
                            initialdata_landuse_totalbuiltupland: function() {
                                return get('initialdata_crops_built');
                            },
                            initialdata_landuse_totalarea: function() {
                                return get('initialdata_landuse_totalUAA') + get('initialdata_landuse_totalwoodland') + get('initialdata_landuse_totalotherland') + get('initialdata_landuse_totalbuiltupland')
                            }
                        }
                    }
                }
            },
            agrienvironmentalmanagement: {
                aggregator: categoryAggregatorFn,
                indicators: {
                    agrienvironmentalmanagement_habitat: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            agrienvironmentalmanagement_habitat_percpp: function() {
                                return calculatePercentage(sum(get('initialdata_crops_permanentpasturearea')), get('initialdata_landuse_totalarea'))
                            },
                            agrienvironmentalmanagement_habitat_perclowinputpp: function() {
                                var areas = get('initialdata_crops_permanentpasturearea')
                                if (sum(areas) > 0) {
                                    var lowinputpp = 0
                                    var pastures = get('initialdata_crops_permanentpasturename')
                                    for (var idx = 0; idx < pastures.length; idx++) {
                                        if (['pp_low_input_rough_grazing_high_clover_content', 'pp_low_input_rough_grazing_medium_clover_content', 'pp_low_input_rough_grazing_low_clover_content', 'pp_low_input_rough_grazing_zero_clover_content'].includes(pastures[idx])) {
                                            lowinputpp += areas[idx]
                                        }
                                    }
                                    return calculatePercentage(lowinputpp, get('initialdata_landuse_totalarea'))
                                } else {
                                    return false
                            }
                            }
                        }
                    }
                }
            },
            npkbudget: {
                aggregator: categoryAggregatorFn,
                indicators: {
                    npkbudget_inputsandoutputs: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            npkbudget_inputsandoutputs_arablenin: function() {
                                var data = [];
                                var crops = get('initialdata_crops_cropname')
                                if (crops === false) return [false]
                                for(var i = 0; i < crops.length; i++) {
                                    data.push(0);
                                }
                                return data
                            },
                            npkbudget_inputsandoutputs_arablenintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablenin'))
                            },
                            npkbudget_inputsandoutputs_arablepin: function() {
                                var data = [];
                                var crops = get('initialdata_crops_cropname')
                                if (crops === false) return [false]
                                for(var i = 0; i < crops.length; i++) {
                                    data.push(0);
                                }
                                return data
                            },
                            npkbudget_inputsandoutputs_arablepintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablepin'))
                            },
                            npkbudget_inputsandoutputs_arablekin: function() {
                                var data = [];
                                var crops = get('initialdata_crops_cropname')
                                if (crops === false) return [false]
                                for(var i = 0; i < crops.length; i++) {
                                    data.push(0);
                                }
                                return data
                            },
                            npkbudget_inputsandoutputs_arablekintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablekin'))
                            },
                            npkbudget_inputsandoutputs_arablenout: function() {
                                return getNutrientBudget(
                                    'n', 'CROPS',
                                    'initialdata_crops_cropname',
                                    'initialdata_crops_cropyieldexport')
                            },
                            npkbudget_inputsandoutputs_arablenouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablenout'))
                            },
                            npkbudget_inputsandoutputs_arablepout: function() {
                                return getNutrientBudget(
                                    'p', 'CROPS',
                                    'initialdata_crops_cropname',
                                    'initialdata_crops_cropyieldexport')
                            },
                            npkbudget_inputsandoutputs_arablepouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablepout'))
                            },
                            npkbudget_inputsandoutputs_arablekout: function() {
                                return getNutrientBudget(
                                    'k', 'CROPS',
                                    'initialdata_crops_cropname',
                                    'initialdata_crops_cropyieldexport')
                            },
                            npkbudget_inputsandoutputs_arablekouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_arablekout'))
                            },
                            npkbudget_inputsandoutputs_livestocknin: function() {
                                return getNutrientBudget(
                                    'n', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_import')
                            },
                            npkbudget_inputsandoutputs_livestocknintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestocknin'))
                            },
                            npkbudget_inputsandoutputs_livestockpin: function() {
                                return getNutrientBudget(
                                    'p', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_import')
                            },
                            npkbudget_inputsandoutputs_livestockpintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockpin'))
                            },
                            npkbudget_inputsandoutputs_livestockkin: function() {
                                return getNutrientBudget(
                                    'k', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_import')
                            },
                            npkbudget_inputsandoutputs_livestockkintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockkin'))
                            },
                            npkbudget_inputsandoutputs_livestocknout: function() {
                                return getNutrientBudget(
                                    'n', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_export')
                            },
                            npkbudget_inputsandoutputs_livestocknouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestocknout'))
                            },
                            npkbudget_inputsandoutputs_livestockpout: function() {
                                return getNutrientBudget(
                                    'p', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_export')
                            },
                            npkbudget_inputsandoutputs_livestockpouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockpout'))
                            },
                            npkbudget_inputsandoutputs_livestockkout: function() {
                                return getNutrientBudget(
                                    'k', 'LIVESTOCK',
                                    'initialdata_livestock_type',
                                    'initialdata_livestock_export')
                            },
                            npkbudget_inputsandoutputs_livestockkouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockkout'))
                            },
                            npkbudget_inputsandoutputs_livestockprodnin: function() {
                                return getNutrientBudget(
                                    'n', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productimport')
                            },
                            npkbudget_inputsandoutputs_livestockprodnintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodnin'))
                            },
                            npkbudget_inputsandoutputs_livestockprodpin: function() {
                                return getNutrientBudget(
                                    'p', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productimport')
                            },
                            npkbudget_inputsandoutputs_livestockprodpintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodpin'))
                            },
                            npkbudget_inputsandoutputs_livestockprodkin: function() {
                                return getNutrientBudget(
                                    'k', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productimport')
                            },
                            npkbudget_inputsandoutputs_livestockprodkintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodkin'))
                            },
                            npkbudget_inputsandoutputs_livestockprodnout: function() {
                                return getNutrientBudget(
                                    'n', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productexport')
                            },
                            npkbudget_inputsandoutputs_livestockprodnouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodnout'))
                            },
                            npkbudget_inputsandoutputs_livestockprodpout: function() {
                                return getNutrientBudget(
                                    'p', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productexport')
                            },
                            npkbudget_inputsandoutputs_livestockprodpouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodpout'))
                            },
                            npkbudget_inputsandoutputs_livestockprodkout: function() {
                                return getNutrientBudget(
                                    'k', 'LIVESTOCK_PRODUCTS',
                                    'initialdata_livestock_producttype',
                                    'initialdata_livestock_productexport')
                            },
                            npkbudget_inputsandoutputs_livestockprodkouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_livestockprodkout'))
                            },
                            npkbudget_inputsandoutputs_seedsnin: function() {
                                return getNutrientBudget(
                                    'n', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsimport')
                            },
                            npkbudget_inputsandoutputs_seedsnintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedsnin'))
                            },
                            npkbudget_inputsandoutputs_seedspin: function() {
                                return getNutrientBudget(
                                    'p', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsimport')
                            },
                            npkbudget_inputsandoutputs_seedspintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedspin'))
                            },
                            npkbudget_inputsandoutputs_seedskin: function() {
                                return getNutrientBudget(
                                    'k', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsimport')
                            },
                            npkbudget_inputsandoutputs_seedskintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedskin'))
                            },
                            npkbudget_inputsandoutputs_seedsnout: function() {
                                return getNutrientBudget(
                                    'n', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsexport')
                            },
                            npkbudget_inputsandoutputs_seedsnouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedsnout'))
                            },
                            npkbudget_inputsandoutputs_seedspout: function() {
                                return getNutrientBudget(
                                    'p', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsexport')
                            },
                            npkbudget_inputsandoutputs_seedspouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedspout'))
                            },
                            npkbudget_inputsandoutputs_seedskout: function() {
                                return getNutrientBudget(
                                    'k', 'SEEDS',
                                    'initialdata_seedsfeeds_seedstype',
                                    'initialdata_seedsfeeds_seedsexport')
                            },
                            npkbudget_inputsandoutputs_seedskouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_seedskout'))
                            },
                            npkbudget_inputsandoutputs_feedsnin: function() {
                                return getNutrientBudget(
                                    'n', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsimport')
                            },
                            npkbudget_inputsandoutputs_feedsnintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedsnin'))
                            },
                            npkbudget_inputsandoutputs_feedspin: function() {
                                return getNutrientBudget(
                                    'p', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsimport')
                            },
                            npkbudget_inputsandoutputs_feedspintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedspin'))
                            },
                            npkbudget_inputsandoutputs_feedskin: function() {
                                return getNutrientBudget(
                                    'k', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsimport')
                            },
                            npkbudget_inputsandoutputs_feedskintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedskin'))
                            },
                            npkbudget_inputsandoutputs_feedsnout: function() {
                                return getNutrientBudget(
                                    'n', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsexport')
                            },
                            npkbudget_inputsandoutputs_feedsnouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedsnout'))
                            },
                            npkbudget_inputsandoutputs_feedspout: function() {
                                return getNutrientBudget(
                                    'p', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsexport')
                            },
                            npkbudget_inputsandoutputs_feedspouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedspout'))
                            },
                            npkbudget_inputsandoutputs_feedskout: function() {
                                return getNutrientBudget(
                                    'k', 'FEEDS',
                                    'initialdata_seedsfeeds_feedstype',
                                    'initialdata_seedsfeeds_feedsexport')
                            },
                            npkbudget_inputsandoutputs_feedskouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_feedskout'))
                            },
                            npkbudget_inputsandoutputs_arablestrawnin: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawimport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.n_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_arablestrawpin: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawimport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.p_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_arablestrawkin: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawimport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.k_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_arablestrawnout: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawexport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.n_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_arablestrawpout: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawexport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.p_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_arablestrawkout: function() {
                                var tonnes = get('initialdata_seedsfeeds_arablestrawexport')
                                if (tonnes === false) return false
                                return DATASETS.STRAW.straw.k_kg_tonne * tonnes
                            },
                            npkbudget_inputsandoutputs_organicfertilisernin: function() {
                                return getNutrientBudget(
                                    'n', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicimport')
                            },
                            npkbudget_inputsandoutputs_organicfertilisernintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertilisernin'))
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpin: function() {
                                return getNutrientBudget(
                                    'p', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicimport')
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertiliserpin'))
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkin: function() {
                                return getNutrientBudget(
                                    'k', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicimport')
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertiliserkin'))
                            },
                            npkbudget_inputsandoutputs_organicfertilisernout: function() {
                                return getNutrientBudget(
                                    'n', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicexport')
                            },
                            npkbudget_inputsandoutputs_organicfertilisernouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertilisernout'))
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpout: function() {
                                return getNutrientBudget(
                                    'p', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicexport')
                            },
                            npkbudget_inputsandoutputs_organicfertiliserpouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertiliserpout'))
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkout: function() {
                                return getNutrientBudget(
                                    'k', 'FERTILISERS',
                                    'initialdata_fertilisers_organictype',
                                    'initialdata_fertilisers_organicexport')
                            },
                            npkbudget_inputsandoutputs_organicfertiliserkouttotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_organicfertiliserkout'))
                            },
                            npkbudget_inputsandoutputs_inorganicfertilisernin: function() {
                                return getNutrientBudget(
                                    'n', 'FERTILISERS',
                                    'initialdata_fertilisers_inorganictype',
                                    'initialdata_fertilisers_inorganicimport')
                            },
                            npkbudget_inputsandoutputs_inorganicfertilisernintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_inorganicfertilisernin'))
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserpin: function() {
                                return getNutrientBudget(
                                    'p', 'FERTILISERS',
                                    'initialdata_fertilisers_inorganictype',
                                    'initialdata_fertilisers_inorganicimport')
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserpintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_inorganicfertiliserpin'))
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserkin: function() {
                                return getNutrientBudget(
                                    'k', 'FERTILISERS',
                                    'initialdata_fertilisers_inorganictype',
                                    'initialdata_fertilisers_inorganicimport')
                            },
                            npkbudget_inputsandoutputs_inorganicfertiliserkintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_inorganicfertiliserkin'))
                            },
                            npkbudget_inputsandoutputs_peasnfixation: function() {
                                var totaln = 0
                                var crops = get('initialdata_crops_cropname')
                                if (crops.includes('peas_dry')) {
                                    for (var i = 0; i < crops.length; i++) {
                                        var type = crops[i]
                                        if (type !== 'peas_dry') continue;
                                        var area = get('initialdata_crops_croparea', i)
                                        totaln += DATASETS.CROPS.peas_dry.n_kg_ha * area
                                    }
                                    return totaln
                                } else {
                                    return false
                                }
                            },
                            npkbudget_inputsandoutputs_beansnfixation: function() {
                                var totaln = 0
                                var crops = get('initialdata_crops_cropname')
                                if (crops.includes('field_beans')) {
                                    for (var i = 0; i < crops.length; i++) {
                                        var type = crops[i]
                                        if (type !== 'field_beans') continue;
                                        var area = get('initialdata_crops_croparea', i)
                                        totaln += DATASETS.CROPS.field_beans.n_kg_ha * area
                                    }
                                    return totaln
                                } else {
                                    return false
                                }
                            },
                            npkbudget_inputsandoutputs_foragecropnin: function() {
                                return getNutrientBudget(
                                    'nfix', 'FORAGE_CROPS',
                                    'initialdata_crops_foragecropname',
                                    'initialdata_crops_foragecroparea')
                            },
                            npkbudget_inputsandoutputs_foragecropnintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_foragecropnin'))
                            },
                            npkbudget_inputsandoutputs_permanentpasturenin: function() {
                                return getNutrientBudget(
                                    'nfix', 'PERMANENT_PASTURE',
                                    'initialdata_crops_permanentpasturename',
                                    'initialdata_crops_permanentpasturearea')
                            },
                            npkbudget_inputsandoutputs_permanentpasturenintotal: function() {
                                return sum(get('npkbudget_inputsandoutputs_permanentpasturenin'))
                            },
                            npkbudget_inputsandoutputs_atmosphericdepositionnin: function() {
                                var totalUAA = get('initialdata_landuse_totalUAA')
                                return totalUAA * ATMOSPHERIC_DEPOSITION_N_PER_HA
                            }
                        }
                    },
                    npkbudget_nutrientbalance: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            npkbudget_nutrientbalance_nin: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablenin')),
                                    sum(get('npkbudget_inputsandoutputs_livestocknin')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodnin')),
                                    sum(get('npkbudget_inputsandoutputs_seedsnin')),
                                    sum(get('npkbudget_inputsandoutputs_feedsnin')),
                                    get('npkbudget_inputsandoutputs_arablestrawnin'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertilisernin')),
                                    sum(get('npkbudget_inputsandoutputs_inorganicfertilisernin')),
                                    sum(get('npkbudget_inputsandoutputs_foragecropnin')),
                                    sum(get('npkbudget_inputsandoutputs_permanentpasturenin')),
                                    get('npkbudget_inputsandoutputs_atmosphericdepositionnin'),
                                    get('npkbudget_inputsandoutputs_peasnfixation'),
                                    get('npkbudget_inputsandoutputs_beansnfixation')
                                ])
                            },
                            npkbudget_nutrientbalance_pin: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablepin')),
                                    sum(get('npkbudget_inputsandoutputs_livestockpin')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodpin')),
                                    sum(get('npkbudget_inputsandoutputs_seedspin')),
                                    sum(get('npkbudget_inputsandoutputs_feedspin')),
                                    get('npkbudget_inputsandoutputs_arablestrawpin'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertiliserpin')),
                                    sum(get('npkbudget_inputsandoutputs_inorganicfertiliserpin'))
                                ])
                            },
                            npkbudget_nutrientbalance_kin: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablekin')),
                                    sum(get('npkbudget_inputsandoutputs_livestockkin')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodkin')),
                                    sum(get('npkbudget_inputsandoutputs_seedskin')),
                                    sum(get('npkbudget_inputsandoutputs_feedskin')),
                                    get('npkbudget_inputsandoutputs_arablestrawkin'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertiliserkin')),
                                    sum(get('npkbudget_inputsandoutputs_inorganicfertiliserkin'))
                                ])
                            },
                            npkbudget_nutrientbalance_nout: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablenout')),
                                    sum(get('npkbudget_inputsandoutputs_livestocknout')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodnout')),
                                    sum(get('npkbudget_inputsandoutputs_seedsnout')),
                                    sum(get('npkbudget_inputsandoutputs_feedsnout')),
                                    get('npkbudget_inputsandoutputs_arablestrawnout'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertilisernout'))
                                ])
                            },
                            npkbudget_nutrientbalance_pout: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablepout')),
                                    sum(get('npkbudget_inputsandoutputs_livestockpout')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodpout')),
                                    sum(get('npkbudget_inputsandoutputs_seedspout')),
                                    sum(get('npkbudget_inputsandoutputs_feedspout')),
                                    get('npkbudget_inputsandoutputs_arablestrawpout'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertiliserpout'))
                                ])
                            },
                            npkbudget_nutrientbalance_kout: function() {
                                return sum([
                                    sum(get('npkbudget_inputsandoutputs_arablekout')),
                                    sum(get('npkbudget_inputsandoutputs_livestockkout')),
                                    sum(get('npkbudget_inputsandoutputs_livestockprodkout')),
                                    sum(get('npkbudget_inputsandoutputs_seedskout')),
                                    sum(get('npkbudget_inputsandoutputs_feedskout')),
                                    get('npkbudget_inputsandoutputs_arablestrawkout'),
                                    sum(get('npkbudget_inputsandoutputs_organicfertiliserkout'))
                                ])
                            },
                            npkbudget_nutrientbalance_nbalance: function() {
                                return get('npkbudget_nutrientbalance_nin') - get('npkbudget_nutrientbalance_nout')
                            },
                            npkbudget_nutrientbalance_pbalance: function() {
                                return get('npkbudget_nutrientbalance_pin') - get('npkbudget_nutrientbalance_pout')
                            },
                            npkbudget_nutrientbalance_kbalance: function() {
                                return get('npkbudget_nutrientbalance_kin') - get('npkbudget_nutrientbalance_kout')
                            },
                            npkbudget_nutrientbalance_nratiooutin: function() {
                                return calculateRatio(get('npkbudget_nutrientbalance_nout'), get('npkbudget_nutrientbalance_nin'))
                            },
                            npkbudget_nutrientbalance_pratiooutin: function() {
                                return calculateRatio(get('npkbudget_nutrientbalance_pout'), get('npkbudget_nutrientbalance_pin'))
                            },
                            npkbudget_nutrientbalance_kratiooutin: function() {
                                return calculateRatio(get('npkbudget_nutrientbalance_kout'), get('npkbudget_nutrientbalance_kin'))
                            },
                            npkbudget_nutrientbalance_nbalanceha: function() {
                                var balance = get('npkbudget_nutrientbalance_nbalance')
                                if (balance === false || balance === 0) {
                                    return false
                                } else {
                                    var area = get('initialdata_landuse_totalUAA')
                                    if (area === 0) return false
                                    return balance / area
                                }
                            },
                            npkbudget_nutrientbalance_nbalancehasustainability: function() {
                                var balance = get('npkbudget_nutrientbalance_nbalanceha')
                                if (balance === false) return false
                                balance = Math.abs(balance)
                                if (balance < 50) {
                                    return "Excellent - Very Good"
                                } else if (balance < 70) {
                                    return "Very Good - Good"
                                } else if (balance < 90) {
                                    return "Good - Average"
                                } else if (balance < 110) {
                                    return "Average - Poor"
                                } else {
                                    return "Poor - Very poor"
                                }
                            },
                            npkbudget_nutrientbalance_pbalanceha: function() {
                                var balance = get('npkbudget_nutrientbalance_pbalance')
                                if (balance === false || balance === 0) {
                                    return false
                                } else {
                                    var area = get('initialdata_landuse_totalUAA')
                                    if (area === 0) return false
                                    return balance / area
                                }
                            },
                            npkbudget_nutrientbalance_pbalancehasustainability: function() {
                                var balance = get('npkbudget_nutrientbalance_pbalanceha')
                                if (balance === false) return false
                                balance = Math.abs(balance)
                                if (balance < 5) {
                                    return "Very Good - Excellent"
                                } else if (balance < 10) {
                                    return "Average - Good"
                                } else {
                                    return "Poor - Very poor"
                                }
                            },
                            npkbudget_nutrientbalance_kbalanceha: function() {
                                var balance = get('npkbudget_nutrientbalance_kbalance')
                                if (balance === false || balance === 0) {
                                    return false
                                } else {
                                    var area = get('initialdata_landuse_totalUAA')
                                    if (area === 0) return false
                                    return balance / area
                                }
                            },
                            npkbudget_nutrientbalance_kbalancehasustainability: function() {
                                var balance = get('npkbudget_nutrientbalance_kbalanceha')
                                if (balance === false) return false
                                balance = Math.abs(balance)
                                if (balance < 5) {
                                    return "Very Good - Excellent"
                                } else if (balance < 10) {
                                    return "Average - Good"
                                } else {
                                    return "Poor - Very poor"
                                }
                            },
                        }
                    }
                }
            },
            energycarbon: {
                aggregator: categoryAggregatorFn,
                indicators: {
                    energycarbon_fueluse: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            energycarbon_fueluse_arabletotalenergy: function() {
                                if (get('initialdata_landuse_totalarablearea') > 0) {
                                    var arableTotalEnergy = getTotalEnergyPerEnterprise('arable')
                                    var horticultureTotalEnergy = getTotalEnergyPerEnterprise('horticulture')
                                    return arableTotalEnergy + horticultureTotalEnergy
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_arabletotalenergyperha: function() {
                                return calculateRatio(get('energycarbon_fueluse_arabletotalenergy'), get('initialdata_landuse_totalarablearea'))
                            },
                            energycarbon_fueluse_arablebenchmark: function() {
                                if (get('energycarbon_fueluse_arabletotalenergyperha') === false) return false
                                var totalCroppingArea = get('initialdata_landuse_totalarablearea')
                                var benchmarks = DATASETS.BENCHMARKING.ARB.total_energy
                                for (id in benchmarks) {
                                    var benchmark = benchmarks[id]
                                    if (totalCroppingArea > benchmark.min && totalCroppingArea <= benchmark.max) {
                                        return benchmark.value
                                    }
                                }
                            },
                            energycarbon_fueluse_arablepercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_arabletotalenergyperha'), get('energycarbon_fueluse_arablebenchmark'))
                            },
                            energycarbon_fueluse_beefsheeptotalenergy: function() {
                                if (getBeefSheepNrAnimals() > 0) {
                                    return getTotalEnergyPerEnterprise('beefsheep')
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_beefsheeptotalenergyperhead: function() {
                                return calculateRatio(get('energycarbon_fueluse_beefsheeptotalenergy'), getBeefSheepNrAnimals())
                            },
                            energycarbon_fueluse_beefbenchmark: function() {
                                if (get('energycarbon_fueluse_beefsheeptotalenergyperhead') === false) return false
                                return DATASETS.BENCHMARKING.BSH.total_energy.per_head.value
                            },
                            energycarbon_fueluse_beefpercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_beefsheeptotalenergyperhead'), get('energycarbon_fueluse_beefbenchmark'))
                            },
                            energycarbon_fueluse_dairytotalenergy: function() {
                                if (getCattleDairyNrAnimals() > 0) {
                                    return getTotalEnergyPerEnterprise('dairy')
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_dairytotalenergyperhead: function() {
                                return calculateRatio(get('energycarbon_fueluse_dairytotalenergy'), getCattleDairyNrAnimals())
                            },
                            energycarbon_fueluse_dairybenchmark: function() {
                                if (get('energycarbon_fueluse_dairytotalenergyperhead') === false) return false
                                var numberOfAnimals = getCattleDairyNrAnimals()
                                var benchmarks = DATASETS.BENCHMARKING.DAR.total_energy
                                for (id in benchmarks) {
                                    var benchmark = benchmarks[id]
                                    if (numberOfAnimals > benchmark.min && numberOfAnimals <= benchmark.max) {
                                        return benchmark.value
                                    }
                                }
                            },
                            energycarbon_fueluse_dairypercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_dairytotalenergyperhead'), get('energycarbon_fueluse_dairybenchmark'))
                            },
                            energycarbon_fueluse_pigtotalenergy: function() {
                                if (getPigNrAnimals() > 0) {
                                    return getTotalEnergyPerEnterprise('pig')
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_pigtotalenergyperhead: function() {
                                return calculateRatio(get('energycarbon_fueluse_pigtotalenergy'), getPigNrAnimals())
                            },
                            energycarbon_fueluse_pigbenchmark: function() {
                                if (get('energycarbon_fueluse_pigtotalenergyperhead') === false) return false
                                var numberOfAnimals = getPigNrAnimals()
                                var benchmarks = DATASETS.BENCHMARKING.PIG.total_energy
                                for (id in benchmarks) {
                                    var benchmark = benchmarks[id]
                                    if (numberOfAnimals > benchmark.min && numberOfAnimals <= benchmark.max) {
                                        return benchmark.value
                                    }
                                }
                            },
                            energycarbon_fueluse_pigpercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_pigtotalenergyperhead'), get('energycarbon_fueluse_pigbenchmark'))
                            },
                            energycarbon_fueluse_poultryeggstotalenergy: function() {
                                if (getPoultryEggsNrAnimals() > 0) {
                                    return getTotalEnergyPerEnterprise('poultryeggs')
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_poultryeggstotalenergyperhead: function() {
                                return calculateRatio(get('energycarbon_fueluse_poultryeggstotalenergy'), getPoultryEggsNrAnimals())
                            },
                            energycarbon_fueluse_poultryeggsbenchmark: function() {
                                if (get('energycarbon_fueluse_poultryeggstotalenergyperhead') === false) return false
                                var numberOfAnimals = getPoultryEggsNrAnimals()
                                var benchmarks = DATASETS.BENCHMARKING.PEG.total_energy
                                for (id in benchmarks) {
                                    var benchmark = benchmarks[id]
                                    if (numberOfAnimals > benchmark.min && numberOfAnimals <= benchmark.max) {
                                        return benchmark.value
                                    }
                                }
                            },
                            energycarbon_fueluse_poultryeggspercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_poultryeggstotalenergyperhead'), get('energycarbon_fueluse_poultryeggsbenchmark'))
                            },
                            energycarbon_fueluse_poultrymeattotalenergy: function() {
                                if (getPoultryMeatNrAnimals() > 0) {
                                    return getTotalEnergyPerEnterprise('poultrymeat')
                                } else {
                                    return false
                                }
                            },
                            energycarbon_fueluse_poultrymeattotalenergyperhead: function() {
                                return calculateRatio(get('energycarbon_fueluse_poultrymeattotalenergy'), getPoultryMeatNrAnimals())
                            },
                            energycarbon_fueluse_poultrymeatbenchmark: function() {
                                if (get('energycarbon_fueluse_poultrymeattotalenergyperhead') === false) return false
                                var numberOfAnimals = getPoultryMeatNrAnimals()
                                var benchmarks = DATASETS.BENCHMARKING.PLT.total_energy
                                for (id in benchmarks) {
                                    var benchmark = benchmarks[id]
                                    if (numberOfAnimals > benchmark.min && numberOfAnimals <= benchmark.max) {
                                        return benchmark.value
                                    }
                                }
                            },
                            energycarbon_fueluse_poultrymeatpercbenchmark: function() {
                                return calculatePercentage(get('energycarbon_fueluse_poultrymeattotalenergyperhead'), get('energycarbon_fueluse_poultrymeatbenchmark'))
                            }
                        }
                    },
                    energycarbon_renewableenergy: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            energycarbon_renewableenergy_totalenergy: function() {
                                return get("energycarbon_fueluse_arabletotalenergy") + get("energycarbon_fueluse_beefsheeptotalenergy") + get("energycarbon_fueluse_dairytotalenergy") + get("energycarbon_fueluse_pigtotalenergy") + get("energycarbon_fueluse_poultryeggstotalenergy") + get("energycarbon_fueluse_poultrymeattotalenergy")
                            },
                            energycarbon_renewableenergy_totalrenewableenergy: function() {
                                return getTotalEnergyPerType('electricity_renewable') + getTotalEnergyPerType('woodfuel')
                            },
                            energycarbon_renewableenergy_renewableenergyperc: function() {
                                return calculatePercentage(get('energycarbon_renewableenergy_totalrenewableenergy'), get('energycarbon_renewableenergy_totalenergy'))
                            },
                        }
                    },
                    energycarbon_energyratio: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            energycarbon_energyratio_outarable: function() {
                                return getCropEnergyExported()
                            },
                            energycarbon_energyratio_outbeefsheep: function() {
                                return getLivestockEnergyExported('cattle_meat') + getLivestockEnergyExported('sheep') + getLivestockProdEnergyExported('cattle_meat') + getLivestockProdEnergyExported('sheep')
                            },
                            energycarbon_energyratio_outdairy: function() {
                                return getLivestockEnergyExported('cattle_dairy') + getLivestockProdEnergyExported('cattle_dairy')
                            },
                            energycarbon_energyratio_outpig: function() {
                                return getLivestockEnergyExported('pig') + getLivestockProdEnergyExported('pig')
                            },
                            energycarbon_energyratio_outpoultrymeat: function() {
                                return getLivestockEnergyExported('poultry_meat') + getLivestockProdEnergyExported('poultry_meat')
                            },
                            energycarbon_energyratio_outpoultryeggs: function() {
                                return getLivestockEnergyExported('poultry_eggs') + getLivestockProdEnergyExported('poultry_eggs')
                            },
                            energycarbon_energyratio_outbiomass: function() {
                                return getBiomassEnergyExported()
                            },
                            energycarbon_energyratio_inarable: function() {
                                return get('energycarbon_fueluse_arabletotalenergy')
                            },
                            energycarbon_energyratio_inbeefsheep: function() {
                                return get('energycarbon_fueluse_beefsheeptotalenergy')
                            },
                            energycarbon_energyratio_indairy: function() {
                                return get('energycarbon_fueluse_dairytotalenergy')
                            },
                            energycarbon_energyratio_inpig: function() {
                                return get('energycarbon_fueluse_pigtotalenergy')
                            },
                            energycarbon_energyratio_inpoultrymeat: function() {
                                return get('energycarbon_fueluse_poultrymeattotalenergy')
                            },
                            energycarbon_energyratio_inpoultryeggs: function() {
                                return get('energycarbon_fueluse_poultryeggstotalenergy')
                            },
                            energycarbon_energyratio_inbiomass: function() {
                                return getTotalEnergyPerEnterprise('biomassprod')
                            },
                            energycarbon_energyratio_ratioarable: function() {
                                return calculateRatio(get('energycarbon_energyratio_outarable'), get('energycarbon_energyratio_inarable'))
                            },
                            energycarbon_energyratio_ratiobeefsheep: function() {
                                return calculateRatio(get('energycarbon_energyratio_outbeefsheep'), get('energycarbon_energyratio_inbeefsheep'))
                            },
                            energycarbon_energyratio_ratiodairy: function() {
                                return calculateRatio(get('energycarbon_energyratio_outdairy'), get('energycarbon_energyratio_indairy'))
                            },
                            energycarbon_energyratio_ratiopig: function() {
                                return calculateRatio(get('energycarbon_energyratio_outpig'), get('energycarbon_energyratio_inpig'))
                            },
                            energycarbon_energyratio_ratiopoultrymeat: function() {
                                return calculateRatio(get('energycarbon_energyratio_outpoultrymeat'), get('energycarbon_energyratio_inpoultrymeat'))
                            },
                            energycarbon_energyratio_ratiopoultryeggs: function() {
                                return calculateRatio(get('energycarbon_energyratio_outpoultryeggs'), get('energycarbon_energyratio_inpoultryeggs'))
                            },
                            energycarbon_energyratio_ratiobiomass: function() {
                                return calculateRatio(get('energycarbon_energyratio_outbiomass'), get('energycarbon_energyratio_inbiomass'))
                            }
                        }
                    }
                }
            },
            agriculturalsystemsdiversity: {
                aggregator: categoryAggregatorFn,
                indicators: {
                    agriculturalsystemsdiversity_varietaldiversity: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            agriculturalsystemsdiversity_varietaldiversity_totalspecies: function() {
                                return get('agriculturalsystemsdiversity_varietaldiversity_cerealsspecies') + get('agriculturalsystemsdiversity_varietaldiversity_foddercropsspecies') + get('agriculturalsystemsdiversity_varietaldiversity_grainlegumeoilseedsspecies') + get('agriculturalsystemsdiversity_varietaldiversity_vegetablesspecies') + get('agriculturalsystemsdiversity_varietaldiversity_foragespecies') + get('agriculturalsystemsdiversity_varietaldiversity_otherspecies')
                            },
                        }
                    },
                    agriculturalsystemsdiversity_livestockdiversity: {
                        aggregator: indicatorAggregatorFn,
                        questions: {
                            agriculturalsystemsdiversity_livestockdiversity_totalbreeds: function() {
                                return get('agriculturalsystemsdiversity_livestockdiversity_dairycattlebreeds') + get('agriculturalsystemsdiversity_livestockdiversity_beefcattlebreeds') + get('agriculturalsystemsdiversity_livestockdiversity_sheepbreeds') + get('agriculturalsystemsdiversity_livestockdiversity_pigsbreeds') + get('agriculturalsystemsdiversity_livestockdiversity_poultrybreeds') + get('agriculturalsystemsdiversity_livestockdiversity_otherlivestockbreeds')
                            },
                        }
                    }
                }
            }
        }
    }

    return {

        version: _version,

        getForm() {
            return JSON.parse(JSON.stringify(form));
        },

        getScoringKeys() {
            var keys = new Set()
            var toIgnore = ['categories', 'indicators', 'questions']
            function getKeys(obj) {
                Object.entries(obj).forEach(function(item) {
                    if (!toIgnore.includes(item[0]) && !item[0].startsWith('score')) {
                        keys.add('score_' + item[0])
                    }
                    if (typeof item[1] === 'object' && !Array.isArray(item[1])) {
                        getKeys(item[1])
                    }
                })
            }
            getKeys(scoring)
            return keys
        },

        compliesWithRules: compliesWithRules,
        answered: answered,

        calculateScore(answers) {
            var response = { errors: { main: [] } }
            PGTOOL_ANSWERS = answers
            PGTOOL_CALCULATIONS = {}

            if (!(typeof answers === 'object' && answers !== null && !$.isEmptyObject(answers))) {
                response.errors.main.push("Argument 'answers' missing or invalid.")
                return response
            }

            try {
                if (category_code in calculations.categories) {
                    calculations.categories[category_code].aggregator()
                }
                response.total = scoring.total(answers, response)
            } catch (err) {
                console.log(err.stack)
                response.errors.main.push(err.message)
            }
            return response
        },

        calculateAutomaticCalculations(answers) {
            var errorsResponse = { main: [] }

            PGTOOL_ANSWERS = answers
            PGTOOL_CALCULATIONS = {}
            PGTOOL_SCORES = {}

            categoryErrors = []

            try {
                for (category_code in calculations.categories) {
                    calculations.categories[category_code].aggregator(true)
                }
            } catch(err) {
                categoryErrors.push(err)
                errorsResponse[category_code] = categoryErrors
            }

            return { errors: errorsResponse, scores: PGTOOL_SCORES, calculations: PGTOOL_CALCULATIONS };
        },

        calculateCategoryScore(category_code, answers) {
            var errorsResponse = { main: [] }

            if (!category_code || !(typeof category_code === 'string' || category_code instanceof String)) {
                errorsResponse.main.push("Argument 'category_code' missing or invalid.")
            }
            if (!(typeof answers === 'object' && answers !== null && !$.isEmptyObject(answers))) {
                errorsResponse.main.push("Argument 'answers' missing or invalid.")
            }
            if (errorsResponse.main.length == 0) {

                PGTOOL_ANSWERS = answers
                PGTOOL_CALCULATIONS = {}
                PGTOOL_SCORES = {}

                categoryErrors = []

                try {
                    calculations.categories.initialdata.aggregator()

                    if (exists(category_code, calculations.categories)) {
                        calculations.categories[category_code].aggregator()
                    }
                    if (exists(category_code, scoring.categories)) {
                        PGTOOL_SCORES[category_code] = scoring.categories[category_code].total()
                    }
                } catch(err) {
                    categoryErrors.push(err)
                    errorsResponse[category_code] = categoryErrors
                }
            }
            return { errors: errorsResponse, scores: PGTOOL_SCORES, calculations: PGTOOL_CALCULATIONS };
        },

        calculateIndicatorScore(indicator_code, answers) {
            var errorsResponse = { main: [] }

            if (!indicator_code || !(typeof indicator_code === 'string' || indicator_code instanceof String)) {
                errorsResponse.main.push("Argument 'indicator_code' missing or invalid.")
            }
            if (!(typeof answers === 'object' && answers !== null && !$.isEmptyObject(answers))) {
                errorsResponse.main.push("Argument 'answers' missing or invalid.")
            }
            if (errorsResponse.main.length == 0) {

                PGTOOL_ANSWERS = answers
                PGTOOL_CALCULATIONS = {}
                PGTOOL_SCORES = {}

                categoryErrors = []

                var category_code = categoryOf(indicator_code)

                try {
                    var calculationIndicators = calculations.categories[category_code].indicators
                    if (exists(indicator_code, calculationIndicators)) {
                        calculationIndicators[indicator_code].aggregator()
                    }
                    var scoringIndicators = scoring.categories[category_code].indicators
                    if (exists(indicator_code, scoringIndicators)) {
                        PGTOOL_SCORES[indicator_code] = scoringIndicators[indicator_code].total()
                    }
                } catch(err) {
                    categoryErrors.push(err)
                    errorsResponse[category_code] = categoryErrors
                }
            }
            return { errors: errorsResponse, scores: PGTOOL_SCORES, calculations: PGTOOL_CALCULATIONS };
        },

        calculateQuestionScore(question_code, answers) {
            var errorsResponse = { main: [] }

            if (!question_code || !(typeof question_code === 'string' || question_code instanceof String)) {
                errorsResponse.main.push("Argument 'question_code' missing or invalid.")
            }
            if (!(typeof answers === 'object' && answers !== null && !$.isEmptyObject(answers))) {
                errorsResponse.main.push("Argument 'answers' missing or invalid.")
            }
            if (errorsResponse.main.length == 0) {

                PGTOOL_ANSWERS = answers
                PGTOOL_CALCULATIONS = {}
                PGTOOL_SCORES = {}

                categoryErrors = []

                try {
                    var calculationsQuestions = calculations.categories[category_code].indicators[indicator_code].questions
                    if (exists(question_code, calculationsQuestions)) {
                        calculationsQuestions[question_code]()
                    }
                    if (category_code in scoring.categories && indicator_code in scoring.categories[category_code].indicators && 'questions' in scoring.categories[category_code].indicators[indicator_code] && question_code in scoring.categories[category_code].indicators[indicator_code].questions) {
                        PGTOOL_SCORES[question_code] = scoringQuestions[question_code](get(question_code))
                    } else {
                        PGTOOL_SCORES[question_code] = 'no scoring'
                    }
                } catch(err) {
                    categoryErrors.push(err)
                    errorsResponse[category_code] = categoryErrors
                }
            }
            return { errors: errorsResponse, scores: PGTOOL_SCORES, calculations: PGTOOL_CALCULATIONS };
        }
    }
}