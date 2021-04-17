export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicmlrZm8iLCJhIjoiY2ttbTQ1aXA3MWd0dTJ2cWtoazBkOW9nNCJ9.ENcog7O-9i35qVO8YsBppQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/rikfo/ckmmjmjh42bvm17qnxexlo18d',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`);

    // Extend map bounds to include currecnt location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
