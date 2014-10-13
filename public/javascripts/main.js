define(['gmap'], function(gmap) {
    var mapOptions = {
        mapContainer: document.getElementById('gmap'),
        inputElement: document.getElementById('searchBox')
    };
    gmap.initialize(mapOptions);
});