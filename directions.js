// Basically this is going to work by taking in a string like "benton hall on high street in oxford ohio" and get the lat and lon
// from the fuzzy search api. 
// example search call for benton: https://api.tomtom.com/search/2/search/benton%20hall%20on%20high%20street%20in%20oxford%20ohio.json?minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=zkJI9iMZBYdP7X7RvByVQ3YtkhwBnMxK
// to get lat: data.results[0].position.lat
// to get lon: data.results[0].position.lon

// Then with the lat and lon, we can use the routing api to calculate things

const apiKey = "zkJI9iMZBYdP7X7RvByVQ3YtkhwBnMxK";
const baseRoutingURL="https://api.tomtom.com/routing/1/calculateRoute/";
const baseSearchURL="https://api.tomtom.com/search/2/search/"

//search/routing variables
var startLat = "";
var startLon = "";
var endingLat = "";
var endingLon = "";

//routing variables
var routeType = "";
var modeOfTransportation = "";
var inclineLevel = "";

var jsonData = new Object();

$(document).ready(function() {

    /**
     * This will get the coordinates for the mapping api to work, because it needs coordinates.
     * To make this fuzzy, I am using fuzzy search to get the coordinates of the fuzzy search.
     * Then I will be using these to call the mapping api.
     */
    $("#mapButton").click(function go() {
        startLat = "";
        startLon = "";
        endingLat = "";
        endingLon = "";
        routeType = "";
        modeOfTransportation = "";
        inclineLevel = "";
        $("#legDiv").empty();
        jsonData = new Object();

        var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
        $('<h4>Loading Directions...</h4>').appendTo(newRow);
        $('<div class="col-md"><img src="loadingBall.gif" width="128" height="128"></div>').appendTo(newRow);

        var startingUnEncodedQuery = $("#startingLocation").val();
        var startingQuery = encodeURI($("#startingLocation").val());
        var fullStartLocaionSearchURL = baseSearchURL + startingQuery + '.json?minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=' + apiKey;
	    a=$.ajax({
            //https://api.tomtom.com/search/2/search/
            //benton%20hall%20on%20high%20street%20in%20oxford%20ohio
            //.json?minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=
            //apiKey
	    	url: fullStartLocaionSearchURL,
	    	method: "GET"
	    }).done(function(data) { //NESTED AJAX CALLS
            startLat = data.results[0].position.lat;
            startLon = data.results[0].position.lon;
            var endingQueryUnEncoded = $("#destination").val();
            var endingQuery = encodeURI($("#destination").val());
            var fullEndLocationSearchURL = baseSearchURL + endingQuery + '.json?minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=' + apiKey;
            a=$.ajax({
                url: fullEndLocationSearchURL,
                method: "GET"
            }).done(function(data) { //NESTED AJAX CALLS
                endingLat = data.results[0].position.lat;
                endingLon = data.results[0].position.lon;
                //console.log(startLat + "," + startLon + ":" + endingLat + "," + endingLon);

                /**
                * 
                * AT THIS POINT WE HAVE BOTH SETS OF COORDINATES, CAN NOW USE ROUTING API
                * 
                */
                routeType = $('input[name=gridRadios]:checked').val();
                modeOfTransportation = $("#modeOfTransportation").val();
                inclineLevel = $("#incline").val().toLowerCase();
                //console.log(routeType + "," + modeOfTransportation + "," + inclineLevel);

                //https://api.tomtom.com/routing/1/calculateRoute/52.50931%2C13.42936%3A52.50274%2C13.43872/json?instructionsType=text&routeType=fastest&traffic=true&travelMode=car&key=*****
                var fullRoutingURL = baseRoutingURL + encodeURI(startLat+','+startLon+':'+endingLat+','+endingLon) + "/json?instructionsType=text&routeType=" + routeType + "&traffic=true&travelMode=" + modeOfTransportation + "&key=" + apiKey;
                if (routeType == "thrilling") {
                    //https://api.tomtom.com/routing/1/calculateRoute/39.56719%2C-84.81423%3A39.51034%2C-84.74177/json?routeType=thrilling&traffic=true&travelMode=car&hilliness=normal&key=*****
                    fullRoutingURL = baseRoutingURL + encodeURI(startLat+','+startLon+':'+endingLat+','+endingLon) + "/json?instructionsType=text&routeType=" + routeType + "&traffic=true&travelMode=" + modeOfTransportation + "&hilliness=" + inclineLevel + "&key=" + apiKey;
                }
                a=$.ajax({
                    url: fullRoutingURL,
                    method: "GET"
                }).done(function(data) { // AT THIS POINT, WE HAVE ALL THE DATA
                    var distance = data.routes[0].summary.lengthInMeters;
                    var time = data.routes[0].summary.travelTimeInSeconds;
                    var trafficDelaysTime = data.routes[0].summary.trafficDelayInSeconds;
                    var trafficDelaysDistance = data.routes[0].summary.trafficLengthInMeters;

                    // to make it easier to tell how much time it takes and distance
                    var displayTime = new Date(time * 1000).toISOString().substr(11, 8);
                    var distanceMiles = Math.round((distance * 0.0006213710) * 100) / 100;

                    //console.log(distance + " " + time + " " + trafficDelaysTime + " " + trafficDelaysDistance);
                    //console.log(startingQuery + " " + endingQuery);

                    $("#distanceP").text(distance + " meters, " + distanceMiles + " miles");
                    $("#timeP").text(displayTime);
                    $("#trafficP").text(trafficDelaysTime + " seconds, " + trafficDelaysDistance + " meters");


                    const sleep = (time) => {
                        return new Promise(resolve => setTimeout(resolve, time))
                      }

                    var instructionLength = data.routes[0].guidance.instructions.length;
                    var delayAmount = 100;
                    var legResponses = [];
                    $("#legDiv").empty();
                    const getImages = async () => {
                        for(j=0;j<instructionLength;j++) {
                            if (instructionLength > 50) {
                                delayAmount = 125;
                                await sleep(delayAmount);
                            } else {
                                await sleep(delayAmount);
                            }
                            

                            var legResponse = new Object();

                            var readableInstruction = data.routes[0].guidance.instructions[j].message;
                            var readableInstructionlat = data.routes[0].guidance.instructions[j].point.latitude;
                            var readableInstructionlon = data.routes[0].guidance.instructions[j].point.longitude;
                            var legDistance = 0;
                            var legTime = 0;
                            if (j != 0) {
                                legDistance = data.routes[0].guidance.instructions[j].routeOffsetInMeters - data.routes[0].guidance.instructions[j-1].routeOffsetInMeters;
                                legTime = data.routes[0].guidance.instructions[j].travelTimeInSeconds - data.routes[0].guidance.instructions[j-1].travelTimeInSeconds;
                            } 

                            var legDistanceMiles = Math.round((legDistance * 0.0006213710) * 100) / 100;
                            var legTimeReadable = new Date(legTime * 1000).toISOString().substr(11, 8);
                            var mapCenter = encodeURI(readableInstructionlon + "," + readableInstructionlat);
                            //https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&format=jpg&zoom=12&center=-84.73345%2C%2039.51037&width=512&height=512&view=Unified&key=*****
                            var fullMapUrl = "https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&format=jpg&zoom=12&center=" + mapCenter + "&width=512&height=512&view=Unified&key=" + apiKey;
                            
                            legResponse = {
                                legCoords: readableInstructionlat + "," + readableInstructionlon,
                                readableInstruction: readableInstruction,
                                legDistance: legDistance,
                                legDistanceMiles: legDistanceMiles,
                                legTime: legTime,
                                legTimeReadable: legTimeReadable,
                                legMapURL: fullMapUrl
                            };

                            legResponses.push(legResponse);
                            
                            var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
                            $('<div class="col-md directionImagesCol"><img src="' + fullMapUrl + '"></div>').appendTo(newRow);
                            $('<h4>Leg #' + (j+1) + '</h4>').appendTo(newRow);
                            $('<h3>' + readableInstruction + '</h3>').appendTo(newRow);
                            $('<h3>' + legDistance + " meters(" + legDistanceMiles + " miles), " + legTime + " seconds(" + legTimeReadable + ")" +'</h3>').appendTo(newRow);


                        }
                }
                getImages();
                    
                var totalTimeToGetImages = instructionLength * delayAmount;

                // AT THIS POINT, WE HAVE ALL THE REPONSE DATA, NOW WE NEED TO MAKE IN INTO A JSON OBJECT AND SEND THE STRING TO THE DATABASE
                const makeJsonObject = async() => {
                    await sleep(totalTimeToGetImages + 50); //make it wait until all images are loaded plus a little extra to be safe.
                    jsonData = {
                        request:
                            {
                                startingPointQuery: startingUnEncodedQuery,
                                destinationQuery: endingQueryUnEncoded,
                                routeType: routeType,
                                modeOfTransportation: modeOfTransportation,
                                incline: inclineLevel
                            },
                        response:
                            {
                                fuzzySearchResults:
                                {
                                    startCoords: startLat + "," + startLon,
                                    destinationCoords: endingLat + "," + endingLon,
                                },
                                routingResults:
                                {
                                    totalDistance: distance,
                                    totalTime: time,
                                    trafficDelayDistance: trafficDelaysDistance,
                                    trafficDealyTime: trafficDelaysTime,
                                    legData: legResponses
                                }
                            }
                    };


                    var jsonString = JSON.stringify(jsonData);

                    //NOW SEND THE JSON !!!!STRING!!!! TO THE DATABASE
                    //http://http://172.17.14.166//final.php?method=setLookup&location=45056&sensor=web&value=test+12345
                    var databaseInsertUrl = "http://172.17.14.166//final.php?method=setLookup&location=45056&sensor=directionsWebSite&value=" + jsonString;

                    // THIS PUTS THE JSON STRING INTO THE DATABASE
                    $.ajax({
                        url: "http://172.17.14.166//final.php",    
                        method: "POST",
                        data: {method: "setLookUp", location: "45056", sensor: "directionsWebSite", value: jsonString}
                    }).done(function(data) {
                        console.log("Data has been sent successfully to the database");
                    }).fail(function(error){
                        console.log(error.message);
                        var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
                        $('<h1>' + error.message + '</h1>').appendTo(newRow);
                    });

                };
                makeJsonObject();


                }).fail(function(error) {
                    $("#legDiv").empty();
                    console.log(error.responseJSON.error.description);
                    var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
                    $('<h1>' + error.responseJSON.error.description + '</h1>').appendTo(newRow);
                });

            }).fail(function(error) {
                $("#legDiv").empty();
                console.log(error.responseJSON.errorText);
                var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
                $('<h1>' + error.responseJSON.errorText + '</h1>').appendTo(newRow);
            });

	    }).fail(function(error) {
            $("#legDiv").empty();
	    	console.log(error.responseJSON.errorText);
            var newRow = $("<div class='row directionImagesRows'></div>").appendTo("#legDiv");
            $('<h1>' + error.responseJSON.errorText + '</h1>').appendTo(newRow);
	    });
        
    });



});