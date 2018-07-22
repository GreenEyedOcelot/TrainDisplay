$(document).ready(function(){
   var counter = 1;

  // Global array to store train information
  // var trainArr = [];


  // Initialize Firebase
 var databaseRef;
  var config = {
    apiKey: "AIzaSyBWBrCKUMXzEcPCZPhS1RcqvJdsyBniFEg",
    authDomain: "havatrainscheduler2.firebaseapp.com",
    databaseURL: "https://havatrainscheduler2.firebaseio.com",
    projectId: "havatrainscheduler2",
    storageBucket: "havatrainscheduler2.appspot.com",
    messagingSenderId: "193573417003"
  };
  firebase.initializeApp(config);
  var dataRef = firebase.database().ref("trains");
  
   
   dataRef.on('value', function(trainData) {

     var trainList = trainData.val();
     console.log("trainList in ON VALUE event: ", trainList);
     console.log("\n\n\n");

     if (trainList) {
        refreshTrainTable(trainList);
     }

   });

   function refreshTrainTable(trainList) {
      counter = 1;
      console.log("trainList in refreshTrainTable: ", trainList);
      var tbody = $("#train-list");

      tbody.empty();

      for (var trainID in trainList) {
         console.log("IN FOR IN LOOP, trainID, trainList: ", trainID, trainList);
         
         trainList[trainID].trainKey = trainID;
         
        console.log ("created a single train object: ", trainList[trainID]);


         tbody.append( createTrainRow(trainList[trainID]));
      }
   }



   function createTrainRow(trainObj) {
      console.log("IN CREATE TRAIN ROW...");
      var nextArrival, minutesAway, tableRow, diffInMinutes, controlCell, editBtn, deleteBtn, editSpan, deleteSpan, divWrapper;
      var frequency = trainObj.trainFrequency;
      var trainTime = moment(trainObj.trainFirstTime,"HH:mm");
      var trainKey = trainObj.trainKey;
      var now = moment();

      diffInMinutes = now.diff(trainTime,"minutes");
     
      if (diffInMinutes === 0 ) { // train is arriving right now!
         nextArrival = now.format("h:mm a");
      } else if (diffInMinutes < 0) { // the first train of the day has not arrived yet
         // e.g. it is 10:00 (10:00 AM) now, and the first train arrives at 13:00 (1:00 PM).
         // The arrival time is then 1:00 PM, and the train is 180 minutes away
         nextArrival = trainTime.format("h:mm a");
         minutesAway = Math.abs(diffInMinutes);
      } else { // the first train of the day has already arrived
         // e.g. it is 10:00 (10:00 AM), and the first train of the day arrived at 06:00 (6:00 AM).
         // The train frequency is every 180 minutes.
      // The diffInMinutes in this case will be 24gf0 (meaning we are 4 hours past the first train)
         // The next times: 6:00 AM, 9:00 AM, noon,...so the next train is at noon, two hours away.
         
         // Math is: 240 mod 180 is 60 (1 hour), 180 (frequency) - 60 (mod result) = 120 minutes
         // minutesAway is 120, and nextArrival is now + 120 minutes (10:00 + 120 minutes = noon).
         minutesAway = frequency - (diffInMinutes % frequency);
         nextArrival = moment(now).add(minutesAway, "minutes").format("h:mm a");
      }

      tableRow = $("<tr></tr>");

      tableRow.append('<th class="align-middle" scope="row">' + counter + '</th>');
      tableRow.append(`<td class="align-middle">${trainObj.trainName}</td>`)
              .append(`<td class="align-middle">${trainObj.trainDestination}</td>`)
              .append(`<td class="align-middle">${trainObj.trainFrequency}</td>`)
              .append(`<td class="align-middle">${nextArrival}</td>`)
              .append(`<td class="align-middle">${minutesAway}</td>`);

      counter++;

      tableRow.attr("data-trainkey", trainKey);

      controlCell = $("<td></td>");
      divWrapper = $("<div></div>").attr("class","btn-toolbar").attr("role","toolbar");

      editBtn = $("<button></button>").attr("type","button").attr("class","btn-default btn-xs btn-edit");
      editSpan = $("<span></span>");
      editSpan.attr("class", "glyphicon glyphicon-pencil").attr("aria-hidden","true").attr("data-trainkey", trainKey);
      editSpan.attr("data-trainName", trainObj.trainName)
              .attr("data-traindestination", trainObj.trainDestination)
              .attr("data-trainfrequency", frequency)
              .attr("data-trainStartTime", trainObj.trainFirstTime);



      editBtn.append(editSpan).append(" Edit ");
      editBtn.css("margin: 1rem");

      deleteBtn = $("<button></button>").attr("type","button").attr("class","btn-default btn-xs btn-delete");
      deleteSpan = $("<span></span>");
      deleteSpan.attr("class", "glyphicon glyphicon-trash").attr("aria-hidden","true").attr("data-trainkey", trainKey);
      deleteBtn.append(deleteSpan).append(" Delete ");

      divWrapper.append(editBtn).append("&nbsp;").append(deleteBtn);
      controlCell.append(divWrapper);
      tableRow.append(controlCell);


      return tableRow;
   }
   

// Run this function when the "Add Train" button is clicked
$("#add-train").on("click", function(event) {

   
   var trainName, trainDestination, trainFirstTime, trainFrequency, isValidTime;
   var militaryTimePattern =  /[0-1][0-9]:[0-5][0-9]|2[0-3]:[0-5][0-9]/;
   
   event.preventDefault(); // Question: Is this really needed, given that it is a normal button and not a submit button?
  
   // Get values
   trainName = $("#train-name").val().trim();
   trainDestination = $("#destination").val().trim();
   trainFirstTime = $("#first-train-time").val().trim();
   isValidTime = militaryTimePattern.test(trainFirstTime);
   trainFrequency = $("#frequency").val().trim();

   
   if (trainName && trainDestination && trainFirstTime && trainFrequency && militaryTimePattern.test(trainFirstTime)) {
       
      // Clear form data
      $("#train-name").val("");
      $("#destination").val("");
      $("#first-train-time").val("");
      $("#frequency").val("");

      // Push to Firebase
      dataRef.push({
         trainName: trainName,
         trainDestination: trainDestination,
         trainFirstTime: trainFirstTime,
         trainFrequency: trainFrequency
     });

   } 
});

   $(document).on("click", ".btn-delete", function(event) {
      console.log("BTN DELETE EVENT");
      
      var trainKey = $(this).children(0).attr("data-trainkey");

      console.log("trainKey: ", trainKey);

      firebase.database().ref("trains/" + trainKey).set(null);
   });

   $("#train-list").on("click", ".btn-edit", function(event) {
      console.log("BTN EDIT EVENT")
      var spanNode = $(this).children(0);
      var trainKey = spanNode.attr("data-trainkey");
      var trainName = spanNode.attr("data-trainname");
      var trainFrequency = spanNode.attr("data-trainfrequency");
      var trainDestination = spanNode.attr("data-traindestination");
      var trainStartTime = spanNode.attr("data-trainstarttime");


      console.log(trainKey, trainName, trainDestination, trainStartTime)

      $("#train-name-edit").val(trainName);
      $("#destination-edit").val(trainDestination);
      $("#first-train-time-edit").val(trainStartTime);
      $("#frequency-edit").val(trainFrequency);

      $("#update-train").attr("data-trainkey", trainKey);


       $("#my-modal").css("display","block");
 
   });


   $("#update-train").on("click", function(event) {
      var trainName = $("#train-name-edit").val();
      var trainDestination = $("#destination-edit").val();
      var trainFirstTime = $("#first-train-time-edit").val();
      var trainFrequency = $("#frequency-edit").val();
      var trainKey = $(this).attr("data-trainkey");
      var militaryTimePattern =  /[0-1][0-9]:[0-5][0-9]|2[0-3]:[0-5][0-9]/;

      if (trainName && trainDestination && trainFirstTime && trainFrequency && militaryTimePattern.test(trainFirstTime)) {
         console.log("in loop, trainkey is: ", trainKey);
         firebase.database().ref("trains/" + trainKey).set({
            trainName: trainName, 
            trainDestination: trainDestination, 
            trainFirstTime: trainFirstTime,
            trainFrequency: trainFrequency
          });
      }

       $("#my-modal").css("display","none");

     
   });


   // When the user clicks on <span> (x), close the modal
   $("#close-modal").on("click", function(event) {
      $("#my-modal").css("display","none");
      console.log("BOO close modal");
   })
 
}); 
 

   


    
