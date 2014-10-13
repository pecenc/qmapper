define(function() {
    // Google map controls.
    var map;
    var markers = [];
    var service;
    var infoWindow;
    var searchBox;
    var latLngBounds;
    
    // To properly implement AMD with 3rd party API, we would need an async plugin
    // Let's just use a waiter to deal with this for now...
    var hackWaiter; 
    
    // Required module options
    var _requiredOptions = ["mapContainer", 
                            "inputElement"
                           ];
    
    // Module options
    var _options = {
        startPosition: new google.maps.LatLng(47.6097, -122.3331), 
        defaultZoom: 14,
        mapContainer: null,
        inputElement: null,
        onMarkerSelected: function() { console.log("Default onMarkerSelected callback"); },
        onQuery: function() { console.log("Default onQuery callback"); }
    };
    
    /************************ Module Initialization ************************/
    function initialize(options) {
        // Wait for google map library to load
        if(typeof google === 'undefined') {
            hackWaiter = setInterval(initialize, 1000);
            return;
        }
        
        if(hackWaiter != null) {
            clearInterval(hackWaiter);
            hackWaiter = null;
        }
        
        console.log("Setup google map");
        // setup options
        confirmRequiredOptions(options);
        setOptions(options);
        // setup info window
        infoWindow = new google.maps.InfoWindow();
        // setup bounds for map
        latLngBounds = new google.maps.LatLngBounds(_options.startPosition);
        // setup map
        map = new google.maps.Map(_options.mapContainer, {
            center: _options.startPosition, 
            zoom: _options.defaultZoom
        });
        google.maps.event.addListener(map, 'bounds_changed', onMapBoundsChanged);
        google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
            _options.inputElement.style.display = "block";
        });
        // setup textsearch service
        service = new google.maps.places.PlacesService(map);
        // setup searchBox control
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(_options.inputElement);
        searchBox = new google.maps.places.SearchBox(_options.inputElement);
        google.maps.event.addListener(searchBox, 'places_changed', onSearchBoxPlacesChanged);
    }
    
    /************************ Event Listeners ************************/
    
    // Callback for when search box query returns
    // Display all the places returned with markers
    function onSearchBoxPlacesChanged() { 
        var places = searchBox.getPlaces();
        
        if(places.length == 0) {
            return;
        }
        
        clearAllMarkersAndBounds();
        createMarkers(places);
    }
    
    // Callback for when map's bound changes
    // We want to set search box's search bound bias
    function onMapBoundsChanged() {
        console.log("Change search box bounds");
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
    }
    
    /************************ Helper Functions ************************/
    
    // Make sure all required options exists
    function confirmRequiredOptions(options) {
        for(var i = 0; i < _requiredOptions.length; i++) {
            if(!Boolean(options[_requiredOptions[i]]))
                throw "Required option: " + _requiredOptions[i] + " is missing";
        }
    }
    
    
    // Set options 
    // Only override the ones provided, leave the rest as default
    function setOptions(options) {
        for(var optionKey in options) {
            if(optionKey in _options) {
                _options[optionKey] = options[optionKey];
            }
        }
    }
    
    // Create markers for all places given
    function createMarkers(places) {
        if(!Boolean(places) || places.length < 1 || !Boolean(map))
            return; 
            
        for(var i = 0; i < places.length; i++) {
            // We don't want to fit bounds because of optimization
            markers.push(createMarker(places[i], false));
        }
        // Now we fit bounds
        smartFitBounds();
    }
    
    // Create a marker for the given place, fit map to bound depending on bFitBounds
    function createMarker(place, bFitBounds) {
        if(!Boolean(place) || !Boolean(map))
            return;

        var marker = new google.maps.Marker({
            map: map, 
            position: place.geometry.location
        });
        
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent("<div class='infoWindow'>" + place.name + "</div>");
            infoWindow.open(map, marker);
            _options.onMarkerSelected(place);
        });
        
        latLngBounds.extend(place.geometry.location);
        
        if(bFitBounds)
            smartFitBounds();
        
        return marker;
    }
    
    // Clear all markers from map and in memory
    // Also clear all bounds
    function clearAllMarkersAndBounds() {
        for(var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
        latLngBounds = new google.maps.LatLngBounds();
    }
    
    // Fit bounds and maintain zoom level
    // We want to maintain zoom level because the map will be very zoomed-in
    // if there's only one or two markers on the map
    function smartFitBounds() {
        map.fitBounds(latLngBounds);
        console.log("Zoom level: " + map.getZoom());
        if(map.getZoom() > _options.defaultZoom)
            map.setZoom(_options.defaultZoom);
    }
    
    // Return public functions for the module
    return {
        initialize: initialize,
    };
});