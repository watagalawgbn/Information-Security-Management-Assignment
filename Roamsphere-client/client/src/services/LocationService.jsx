import L from 'leaflet';

let map;
let currentLocationMarker;
let destinationMarker;
let routeLayer;

const LeafletLocationService = {
  initializeMap(container) {
    map = L.map(container).setView([7.8731, 80.7718], 8); // Sri Lanka center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  },

  updateCurrentLocationMarker(location) {
    if (!map) return;
    if (currentLocationMarker) {
      currentLocationMarker.setLatLng([location.lat, location.lng]);
    } else {
      currentLocationMarker = L.marker([location.lat, location.lng]).addTo(map);
    }
    map.setView([location.lat, location.lng], 13);
  },

  addDestinationMarker(location, label = 'Destination') {
    if (!map) return;
    if (destinationMarker) {
      destinationMarker.setLatLng([location.lat, location.lng]);
    } else {
      destinationMarker = L.marker([location.lat, location.lng])
        .bindPopup(label)
        .addTo(map);
    }
  },

  async calculateRoute(start, end, mode = 'driving') {
    // Example with OSRM demo server
    const url = `https://router.project-osrm.org/route/v1/${mode}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: (route.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(route.duration / 60) + ' mins',
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      };
    }
    return null;
  },

  drawRoute(coordinates) {
    if (!map) return;
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
    routeLayer = L.polyline(coordinates, { color: 'blue', weight: 5 }).addTo(map);
    map.fitBounds(routeLayer.getBounds());
  },

  cleanup() {
    if (map) {
      map.remove();
      map = null;
    }
  }
};

export default LeafletLocationService;
