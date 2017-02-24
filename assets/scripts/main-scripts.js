var mylastlocation = null;

function getLocation() {

        if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(function (position) {
                 initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                 if( mylastlocation != null ){
                        mylastlocation.setMap( null );
                 }
                 else{
                        map.setCenter( initialLocation );
                                //bounds.extend( initialLocation );
                 }
                 var mylocationmarker = new google.maps.Marker({
                                position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                                map: map,
                                icon: 'assets/images/mylocation.gif'
                        });
                mylastlocation = mylocationmarker;
             });
         }

}

var searchroute = location.search.split('route=')[1];
searchroute = searchroute.replace(/[^\w\s]/gi, '');
var iconBase = '/assets/images/buses/pngs/';
var gmarkers = [];
var lastopenwindowobj = null;
var lastopenwindowid = null;

function removemarkers(){
        for( i=0; i < gmarkers.length; i++ ){
                gmarkers[i].setMap( null );
        }
}

function getbuslocations(callback) {
        $.ajax({
                url: "/locations/routes/" + searchroute + ".json",
                success: function ( data ) {
                        data = JSON.parse( data );
                        data = data["rtd-data"]["routes"];

                        var rightnow = new Date();
                        var rightnowseconds = Math.floor( rightnow.getTime() / 1000 );

                        removemarkers();

                        $.each(data, function(index, element) {

                                if( searchroute == 'all' || element["route"].toLowerCase() == searchroute.toLowerCase() ){

                                        var buslocation = new google.maps.LatLng(element["data"].lat, element["data"].lon);

                                        var marker = new google.maps.Marker({
                                                position: buslocation,
                                                map: map,
                                                icon: iconBase + 'bus_' + element["data"].heading.toLowerCase() + '.png'
                                        });
                                        //bounds.extend( buslocation );

                                        var lastupdated = ( rightnowseconds - Number(element["data"].updatetime ) ) / 60;
                                        var lastupdatedmins = Math.floor( lastupdated );
                                        var lastupdatedsec = ( rightnowseconds - Number(element["data"].updatetime ) ) % 60;

                                        var contentString = '<strong>'+
                                      'Route '+ element["route"] +
                                      '</strong>'+ '<br />' +
                                      'Bus ' + element["data"].buslabel + '<br />' +
                                      'Heading ' + element["data"].heading + '<br /><br />' +
                                      'Position last updated ';

                                    contentString = contentString + '<span ';
                                    if( lastupdatedmins > 2 )
                                        contentString = contentString + ' style="color: #d93600" ';

                                    contentString = contentString + '>';

                                    if( lastupdatedmins != 0 ){
                                        contentString = contentString + lastupdatedmins + ' minute';
                                        if( lastupdatedmins > 1 )
                                                contentString = contentString + 's';
                                        if( lastupdatedsec != 0)
                                                contentString = contentString + ' and ';
                                    }

                                    if( lastupdatedsec != 0 )
                                        contentString = contentString + lastupdatedsec + ' seconds ';


                                    contentString = contentString + ' ago.' + '</span>';


                                        var infowindow = new google.maps.InfoWindow({
                                            content: contentString,
                                            id: element["data"].busid
                                        });

                                        if( lastopenwindowid == infowindow.id ){
                                                infowindow.open(map, marker);
                                                lastopenwindowid = infowindow.id;
                                            lastopenwindowobj = infowindow;
                                        }

                                        marker.addListener('click', function() {
                                                if( lastopenwindowid != null )
                                                        lastopenwindowobj.close();
                                            infowindow.open(map, marker);
                                            lastopenwindowid = infowindow.id;
                                            lastopenwindowobj = infowindow;
                                        });

                                        infowindow.addListener('closeclick', function() {
                                                lastopenwindowid = null;
                                            lastopenwindowobj = null;
                                        });

                                        gmarkers.push( marker );

                                }

                        });
                }
        });
}

var map;
function initMap() {

        getbuslocations();
        getLocation();
        latitude = 39.752750396728516;
        longitude = -104.99296569824219;
        map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: latitude, lng: longitude},
                zoom: 14,
                disableDefaultUI: true
        });

        //var bounds = new google.maps.LatLngBounds();
        //map.fitBounds( bounds );

        var trafficLayer = new google.maps.TrafficLayer();
        google.maps.event.addDomListener( document.getElementById('trafficToggle'), 'click', toggleTraffic );

        //map.set('styles', [{"featureType":"landscape","stylers":[{"hue":"#FFBB00"},{"saturation":43.400000000000006},{"lightness":37.599999999999994},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#FFC200"},{"saturation":-61.8},{"lightness":45.599999999999994},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#FF0300"},{"saturation":-100},{"lightness":51.19999999999999},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#FF0300"},{"saturation":-100},{"lightness":52},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#0078FF"},{"saturation":-13.200000000000003},{"lightness":2.4000000000000057},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#00FF6A"},{"saturation":-1.0989010989011234},{"lightness":11.200000000000017},{"gamma":1}]}]);

        map.set('styles', [{"stylers":[{"saturation":-100},{"gamma":1}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"saturation":100},{"gamma":1},{"hue":"#3399FF"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#333333"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"weight":0.5},{"color":"#333333"}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"gamma":1},{"saturation":50}]}]);

        function toggleTraffic(){
                if(trafficLayer.getMap() == null){
                        trafficLayer.setMap(map);
                } else {
                        trafficLayer.setMap(null);
                }
        }

        setInterval(function(){
                getbuslocations();
        }, 15000);

        setInterval(function(){
                getLocation();
        }, 45000);

        //Mondrion
        //map.set('styles', [{"elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#0F0919"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#E4F7F7"}]},{"elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#002FA7"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"color":"#E60003"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#FBFCF4"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#FFED00"}]},{"featureType":"poi.government","elementType":"geometry.fill","stylers":[{"color":"#D41C1D"}]},{"featureType":"poi.school","elementType":"geometry.fill","stylers":[{"color":"#BF0000"}]},{"featureType":"transit.line","elementType":"geometry.fill","stylers":[{"saturation":-100}]}]);

}
