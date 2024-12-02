/* 
March 2024
Elizabeth Pankratz and Aislinn Keogh
Based on plugin-html-button-response
*/

var jsPsychOrthographicConfirm = (function (jspsych) {
  'use strict';

  const info = {
      name: "orthographic-confirm",
      parameters: {
          /** Index of the button pressed on previous orthographic-seg trial */
          seg_button_idx: {
            type: jspsych.ParameterType.INT,
            pretty_name: "Segmentation index",
            default: null,
          },
          /** The HTML string to be displayed */
          stimulus: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Stimulus",
              default: undefined,
          },
          /** Array containing the label(s) for the button(s). */
          choices: {
            type: jspsych.ParameterType.STRING,
            pretty_name: "Choices",
            default: undefined,
            array: true,
        },
        /** HTML for the response buttons */
        response_button_html: {
            type: jspsych.ParameterType.HTML_STRING,
            pretty_name: "Response Button HTML",
            default: '<button class="jspsych-btn">%choice%</button>',
            array: true,
        },
          /** The HTML for creating button. */
          letter_button_html: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Letter Button HTML",
              default: '<button class="letter-btn" disabled>%choice%</button>',
              array: true,
          },
          /** Any content here will be displayed under the button(s). */
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: null,
          },
          /** How long to show the stimulus. */
          stimulus_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Stimulus duration",
              default: null,
          },
          /** How long to show the trial. */
          trial_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Trial duration",
              default: null,
          },
          /** The vertical margin of the button. */
          margin_vertical: {
              type: jspsych.ParameterType.STRING,
              pretty_name: "Margin vertical",
              default: "0px",
          },
          /** The horizontal margin of the button. */
          margin_horizontal: {
              type: jspsych.ParameterType.STRING,
              pretty_name: "Margin horizontal",
              default: "8px",
          },
          /** If true, then trial will end when user responds. */
          response_ends_trial: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Response ends trial",
              default: true,
          },
      },
  };
  /**
   * orthographic-confirm
   * jsPsych plugin for displaying a stimulus and getting a button response
   * @author Josh de Leeuw, messed around with by Elizabeth Pankratz
   */
  class HtmlButtonResponsePlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {

          var html = ''

          //show prompt if there is one
          if (trial.prompt !== null) {
            html += trial.prompt + '<br>';
          }

          // Display stimulus interspersed with the buttons.
          // Step 1: Add in empty labels between the letters.
          var button_labels = [];
          for (var i = 0; i < trial.stimulus.length; i++) {
            button_labels.push(trial.stimulus[i], '&nbsp&nbsp');
          }
          button_labels = button_labels.slice(0, -1)

          // Step 2: Create an array that contains the correct button html 
          // for the two kinds of button. (The plugin splices in the actual button labels below.)
          var buttons = [];
          for (var i = 0; i < button_labels.length; i++){
            buttons.push(trial.letter_button_html)
          }

          // (Hack: only needed so that we have a div called jspsych-html-buton-response-stimulus, else sad)
          html += '<div id="jspsych-html-button-response-stimulus"></div>';

          // Create array of HTML buttons for the response buttons.
          var resp_buttons = [];
          for (var i = 0; i < trial.choices.length; i++) {
            resp_buttons.push(trial.response_button_html);
          }

          // This div displays the word, and includes a pipe character on the button index
          // where ppts clicked in the previous trial.
          html += '<div id="jspsych-html-button-letter-btngroup">';
          for (var i = 0; i < button_labels.length; i++) {

              if (i == trial.seg_button_idx){
                var str = `<button class="letter-btn" disabled style="color:#aaa">
                <img src='imgs/bluebar.png' width = '20px' height = '95px'/>
                </button>`

              } else {
                var str = buttons[i].replace(/%choice%/g, button_labels[i]);
              }

              html +=
                  '<div class="jspsych-html-button-letter-button" style="display: inline-block; margin:' +
                      trial.margin_vertical +
                      " " +
                      trial.margin_horizontal +
                      '" id="jspsych-html-button-letter-button-' +
                      i +
                      '" data-choice="' +
                      i +
                      '">' +
                      str +
                      "</div>";
          }
          html += "</div><br><br><br>";

          // This div displays the Reset / Done buttons.
          html += '<div id="jspsych-html-button-response-btngroup">';
          for (var i = 0; i < trial.choices.length; i++) {
              var str = resp_buttons[i].replace(/%choice%/g, trial.choices[i]);
              html +=
                  '<div class="jspsych-html-button-response-button" style="display: inline-block; margin:' +
                      trial.margin_vertical +
                      " " +
                      trial.margin_horizontal +
                      '" id="jspsych-html-button-response-button-' +
                      i +
                      '" data-choice="' +
                      i +
                      '">' +
                      str +
                      "</div>";
          }
          html += "</div>";

          display_element.innerHTML = html;
          // start time
          var start_time = performance.now();

        //   // add event listeners to letter buttons
        //   for (var i = 0; i < button_labels.length; i++) {
        //       display_element
        //           .querySelector("#jspsych-html-button-letter-button-" + i)
        //           .addEventListener("click", (e) => {
        //           var btn_el = e.currentTarget;
        //           var choice = btn_el.getAttribute("data-choice"); // don't use dataset for jsdom compatibility
        //           after_response(choice);
        //       });
        //   }

          // add event listeners to response buttons
          for (var i = 0; i < trial.choices.length; i++) {
            display_element
                .querySelector("#jspsych-html-button-response-button-" + i)
                .addEventListener("click", (e) => {
                var btn_el = e.currentTarget;
                var choice = btn_el.getAttribute("data-choice"); // don't use dataset for jsdom compatibility
                after_response(choice);
            });
        }

          // store response
          var response = {
              rt: null,
              button: null,
          };
          // function to end trial when it is time
          const end_trial = () => {
              // kill any remaining setTimeout handlers
              this.jsPsych.pluginAPI.clearAllTimeouts();
              // gather the data to store for the trial
              var trial_data = {
                  rt: response.rt,
                  stimulus: trial.stimulus,
                  response: response.button,
              };
              // clear the display
              display_element.innerHTML = "";
              // move on to the next trial
              this.jsPsych.finishTrial(trial_data);
          };
          // function to handle responses by the subject
          function after_response(choice) {
              // measure rt
              var end_time = performance.now();
              var rt = Math.round(end_time - start_time);
              response.button = parseInt(choice);
              response.rt = rt;
              // after a valid response, the stimulus will have the CSS class 'responded'
              // which can be used to provide visual feedback that a response was recorded
              display_element.querySelector("#jspsych-html-button-response-stimulus").className +=
                  " responded";
              // disable all the buttons after a response
              var btns = document.querySelectorAll(".jspsych-html-button-letter-button button");
              for (var i = 0; i < btns.length; i++) {
                  //btns[i].removeEventListener('click');
                  btns[i].setAttribute("disabled", "disabled");
              }
              if (trial.response_ends_trial) {
                  end_trial();
              }
          }
          // hide image if timing is set
          if (trial.stimulus_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(() => {
                  display_element.querySelector("#jspsych-html-button-response-stimulus").style.visibility = "hidden";
              }, trial.stimulus_duration);
          }
          // end trial if time limit is set
          if (trial.trial_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
          }
      }


  }
  HtmlButtonResponsePlugin.info = info;

  return HtmlButtonResponsePlugin;

})(jsPsychModule);
