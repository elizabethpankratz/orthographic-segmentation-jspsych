// Illustration of the orthographic segmentation test in jsPsych 7
// Elizabeth Pankratz and Aislinn Keogh, March 2024


var jsPsych = initJsPsych({
  message_progress_bar: 'Progress',
  on_finish: function() {
    jsPsych.data.displayData('csv');
  },
  show_progress_bar: true,
  auto_update_progress_bar: true
});


var intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div align='left' style='width:800px'>
  <p> Your task is to click in between the letters where you think there is a break between word parts.</p>
  <p> If you need to amend your choice, click "Reset". When you're satisfied, click "Done".</p>
  `,
  choices: ["Got it"]
}


function build_orthseg_trial(trial_data) {
  // trial_data: obj with key 'form'
  
  button_labels = ['Reset', 'Done'];

  var continue_loop = true;

  var orthseg = {
    type: jsPsychOrthographicSeg,
    stimulus: trial_data['form'],
    choices: button_labels
  }

  var confirm = {
    type: jsPsychOrthographicConfirm,
    seg_button_idx: function(){
      var last_trial = jsPsych.data.get().last(1).values()[0] 
      return last_trial.response
    },
    stimulus: trial_data['form'],
    choices: button_labels,
    data: {
      task: 'orthseg'
    },
    on_finish: function(data){

      // If ppts click on Done (index 1), then we will not continue the loop.
      // And we will save their data.
      if (data.response == 1){

        // Go back two trials to get the data from the segmentation trial.
        data.seg_idx = jsPsych.data.get().last(2).values()[0].response
        data.boundary_idx = (data.seg_idx-1)/2

        data.stim_word = trial_data['form']
        continue_loop = false;

      };
    }
  }
  var orthseg_loop = {
    timeline: [orthseg, confirm],
    loop_function: function() {return continue_loop}
  };
  return orthseg_loop;
}


// Init the timeline extension for the training phase.
var orthseg_trials = [];

// Define the words that we'll test.
var orthseg_trial_data = [
  {form: 'luzori'},
  {form: 'molahpe'},
  {form: 'luniri'},
  {form: 'nekabi'},
]

// Iterate over array of trial data, create each trial, and push to timeline extension.
for(trial of orthseg_trial_data){
  orthseg_trials.push(build_orthseg_trial(trial))
};


// Assemble timeline and run.
var timeline = [].concat(
  intro,
  orthseg_trials,
  ).flat()
  
jsPsych.run(timeline);
