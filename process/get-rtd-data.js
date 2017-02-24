var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var fs = require('fs');
var cron = require('node-cron');
var naturalSort = require('node-natural-sort');
var request = require('request'),
    username = "",
    password = "",
    url = "http://www.rtd-denver.com/google_sync/VehiclePosition.pb",
    auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
	
var requestSettings = {
  method: 'GET',
  url: url,
  headers : {
  	"Authorization" : auth
  },
  encoding: null
};

function getheading( b ){

	if( b >= 0 && b <= 11 ){ return 'N'; }
	if( b >= 12 && b <= 34 ){ return 'NNE'; }
	if( b >= 35 && b <= 56 ){ return 'NE'; }
	if( b >= 57 && b <= 79 ){ return 'ENE'; }
	if( b >= 80 && b <= 101 ){ return 'E'; }
	if( b >= 102 && b <= 124 ){ return 'ESE'; }
	if( b >= 125 && b <= 146 ){ return 'SE'; }
	if( b >= 147 && b <= 169 ){ return 'SSE'; }
	if( b >= 170 && b <= 191 ){ return 'S'; }
	if( b >= 192 && b <= 214 ){ return 'SSW'; }
	if( b >= 215 && b <= 236 ){ return 'SW'; }
	if( b >= 237 && b <= 259 ){ return 'WSW'; }
	if( b >= 260 && b <= 281 ){ return 'W'; }
	if( b >= 282 && b <= 304 ){ return 'WNW'; }
	if( b >= 305 && b <= 326 ){ return 'NW'; }
	if( b >= 327 && b <= 350 ){ return 'NNW'; }
	return 'N';
	
}

function processdata( jsonroutes, routes ){

	try{
		
		for( r = 0; r < routes.length; r++ ){
			
			var buildpositions = '{"rtd-data": { "routes": [';
			
			for( i = 0; i < jsonroutes.routes.length; i++ ){
				
				route = jsonroutes.routes[ i ];
				
				if( routes[ r ] == route.route ){
	
					buildpositions = buildpositions + '{';
					buildpositions = buildpositions + '"route": "' + route.route + '",';
					buildpositions = buildpositions + '"data": {';
					buildpositions = buildpositions + '"lat": "' + route.data.lat + '",';
					buildpositions = buildpositions + '"lon": "' + route.data.lon + '",';
					buildpositions = buildpositions + '"bearing": "' + route.data.bearing + '",';
					buildpositions = buildpositions + '"heading": "' + getheading( route.data.bearing ) + '",';
					buildpositions = buildpositions + '"busid": "' + route.data.busid + '",';
					buildpositions = buildpositions + '"buslabel": "' + route.data.buslabel + '",';
					buildpositions = buildpositions + '"updatetime": "' + route.data.updatetime + '",';
					buildpositions = buildpositions + '"status": "' + route.data.status + '",';
					buildpositions = buildpositions + '"tostop": "' + route.data.tostop + '"' ;
					buildpositions = buildpositions + '}';
					buildpositions = buildpositions + '},';
					
				}
				
			}
			
			buildpositions = buildpositions.substring( 0, buildpositions.length - 1 );
			buildpositions = buildpositions + ']}}';
			
			fs.writeFileSync( "../locations/routes/" + routes[ r ] + '.json', buildpositions );
			
		}
		
		routes = routes.sort(naturalSort());
		
		fs.writeFileSync( '../locations/validroutes.json', routes.toString() );
	
	} catch( err ){
		console.log( 'error occured' );
	}
	
}

cron.schedule('0,30 * * * * *', function(){
	
	try{
		
		request(requestSettings, function (error, response, body) {
		
		  if (!error && response.statusCode == 200) {
			  
			var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
			var routes = [];
			var jsonroutes = '{ "routes": [';
		
			feed.entity.forEach( function( entity ) {
				
				if( entity.vehicle.trip ){
		
					if( routes.indexOf( entity.vehicle.trip.route_id ) == -1 ) {
						routes.push( entity.vehicle.trip.route_id );
					}
					
					route = entity.vehicle.trip.route_id;
					lat = entity.vehicle.position.latitude;
					long = entity.vehicle.position.longitude;
					bearing = entity.vehicle.position.bearing;
					heading = '';
					busid = entity.vehicle.vehicle.id;
					buslabel = entity.vehicle.vehicle.label;
					updatetime = entity.vehicle.timestamp;
					status = entity.vehicle.current_status;
					tostop = entity.vehicle.stop_id;
					
					jsonroutes = jsonroutes + '{';
					jsonroutes = jsonroutes + '"route": "' + route + '",';
					jsonroutes = jsonroutes + '"data": {';
					jsonroutes = jsonroutes + '"lat": "' + lat + '",';
					jsonroutes = jsonroutes + '"lon": "' + long + '",';
					jsonroutes = jsonroutes + '"bearing": "' + bearing + '",';
					jsonroutes = jsonroutes + '"heading": "' + heading + '",';
					jsonroutes = jsonroutes + '"busid": "' + busid + '",';
					jsonroutes = jsonroutes + '"buslabel": "' + buslabel + '",';
					jsonroutes = jsonroutes + '"updatetime": "' + updatetime + '",';
					jsonroutes = jsonroutes + '"status": "' + status + '",';
					jsonroutes = jsonroutes + '"tostop": "' + tostop + '"' ;
					jsonroutes = jsonroutes + '}';
					jsonroutes = jsonroutes + '},';
					
					
				}
			
			});
		
			jsonroutes = jsonroutes.substring( 0, jsonroutes.length - 1 );
			jsonroutes = jsonroutes + ']}';
			
			jsonroutes = JSON.parse( jsonroutes );
			
			jsonroutes.routes.sort(
				function( a, b ){
					var sortStatus = 0;
		 
					if (a.route < b.route) {
						sortStatus = -1;
					} else if (a.route > b.route) {
						sortStatus = 1;
					}
					return sortStatus;
					
				}
			);
		
			processdata( jsonroutes, routes );
		
		  }
		  
		});
	
	} catch( err ){
		console.log( 'error occured' );
	}

});