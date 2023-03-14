<script>
module.exports = {
  name: "guidance",
  props: [ 'question' ],
  mounted() {
    $(function () {
      $('[data-toggle="popover"]').popover()
    })
    $('body').on('click', function (e) {
        // https://stackoverflow.com/a/14857326
        // did not click a popover toggle or popover
        if ($(e.target).data('toggle') !== 'popover'
            && $(e.target).parents('.popover.in').length === 0) { 
            $('[data-toggle="popover"]').popover('hide');
        }
    });
  },
  methods: {
    doThis(event) {
      $(event.target).popover('show')
    }
  }
}
</script>

<template>
  <i tabindex="0" @mouseover="doThis" data-toggle="popover" data-placement="bottom" :data-html="question.guidance.html" :data-content="question.guidance.content" class="guidance-element far fa-question-circle fa-xs ml-1 pointer"></i>
</template>