import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { FlightSlotData } from '../types';
import { formatCurrency } from '../lib/validation';
import {
  Navigation,
  Layers,
  Maximize2,
  Minimize2,
  Compass
} from 'lucide-react';

export interface AlpineFlightSpatialPoint {
  id: string;
  name: string;
  type: 'takeoff' | 'landing';
  lat: number;
  lng: number;
  altitudeM: number;
  region: string;
  countryCode: string;
  description: string;
  accessInfo: string;
  windOrientation?: string;
  slotId?: string;
}

export interface AlpineFlightRoute {
  id: string;
  slotId: string;
  title: string;
  region: string;
  takeoff: AlpineFlightSpatialPoint;
  landing: AlpineFlightSpatialPoint;
  verticalDropM: number;
  flightDurationMin: number;
  glideRatio: string;
  pathCoordinates: [number, number][];
}

export const ALPINE_SPATIAL_ROUTES: AlpineFlightRoute[] = [
  {
    id: 'route_interlaken',
    slotId: 'slot_ch_interlaken_01',
    title: 'Interlaken Beatenberg to Höhematte',
    region: 'Interlaken / Jungfrau',
    takeoff: {
      id: 'takeoff_interlaken',
      name: 'Interlaken Beatenberg Amisbühl (Take-off)',
      type: 'takeoff',
      lat: 46.6983,
      lng: 7.7921,
      altitudeM: 1350,
      region: 'Interlaken',
      countryCode: 'CH',
      description: 'Gentle alpine meadow launch facing Eiger, Mönch and Jungfrau glaciers.',
      accessInfo: 'Shuttle Van / PostAuto Beatenberg from Interlaken Ost (20 min)',
      windOrientation: 'S · SW · SE',
      slotId: 'slot_ch_interlaken_01'
    },
    landing: {
      id: 'landing_interlaken',
      name: 'Höhematte Park Interlaken (Landing)',
      type: 'landing',
      lat: 46.6863,
      lng: 7.8632,
      altitudeM: 568,
      region: 'Interlaken',
      countryCode: 'CH',
      description: 'Expansive 14-hectare public park meadow right in front of Victoria-Jungfrau Grand Hotel.',
      accessInfo: 'Lounge reception desk at Höheweg 95 with hotel return shuttle.',
      slotId: 'slot_ch_interlaken_01'
    },
    verticalDropM: 782,
    flightDurationMin: 25,
    glideRatio: '1:8.2 (High-Glide Thermal)',
    pathCoordinates: [
      [46.6983, 7.7921],
      [46.6950, 7.8100],
      [46.6910, 7.8350],
      [46.6875, 7.8550],
      [46.6863, 7.8632]
    ]
  },
  {
    id: 'route_zermatt',
    slotId: 'slot_ch_zermatt_02',
    title: 'Zermatt Rothorn to Zen Stecken',
    region: 'Zermatt / Matterhorn',
    takeoff: {
      id: 'takeoff_zermatt',
      name: 'Zermatt Rothorn Panorama (Take-off)',
      type: 'takeoff',
      lat: 46.0236,
      lng: 7.7814,
      altitudeM: 3103,
      region: 'Zermatt',
      countryCode: 'CH',
      description: 'High-alpine launch above Findeln glacier directly facing the Matterhorn East Face.',
      accessInfo: 'Sunnegga–Blauherd–Rothorn Cableway from Zermatt terminal',
      windOrientation: 'W · SW · NW',
      slotId: 'slot_ch_zermatt_02'
    },
    landing: {
      id: 'landing_zermatt',
      name: 'Zermatt Zen Stecken Meadow (Landing)',
      type: 'landing',
      lat: 46.0169,
      lng: 7.7450,
      altitudeM: 1620,
      region: 'Zermatt',
      countryCode: 'CH',
      description: 'Smooth alpine meadow south of Zermatt village with Matterhorn view.',
      accessInfo: 'E-Taxi Stand / 7 min walk to Zermatt Bahnhof Square.',
      slotId: 'slot_ch_zermatt_02'
    },
    verticalDropM: 1483,
    flightDurationMin: 35,
    glideRatio: '1:9.4 (High Alpine Glacial)',
    pathCoordinates: [
      [46.0236, 7.7814],
      [46.0220, 7.7700],
      [46.0200, 7.7600],
      [46.0180, 7.7510],
      [46.0169, 7.7450]
    ]
  },
  {
    id: 'route_lauterbrunnen',
    slotId: 'slot_ch_lauterbrunnen_03',
    title: 'Lauterbrunnen Mürren to Stechelberg',
    region: 'Lauterbrunnen Canyon',
    takeoff: {
      id: 'takeoff_lauterbrunnen',
      name: 'Lauterbrunnen Mürren Schilthorn (Take-off)',
      type: 'takeoff',
      lat: 46.5594,
      lng: 7.8927,
      altitudeM: 1638,
      region: 'Lauterbrunnen',
      countryCode: 'CH',
      description: 'Car-free cliff edge launch soaring along sheer 800m limestone valley walls.',
      accessInfo: 'Schilthornbahn cableway from Stechelberg to Mürren village',
      windOrientation: 'N · NE · Valley Thermal',
      slotId: 'slot_ch_lauterbrunnen_03'
    },
    landing: {
      id: 'landing_lauterbrunnen',
      name: 'Stechelberg Valley Floor (Landing)',
      type: 'landing',
      lat: 46.5541,
      lng: 7.9018,
      altitudeM: 862,
      region: 'Lauterbrunnen',
      countryCode: 'CH',
      description: 'Protected valley landing field next to the Schilthornbahn base station.',
      accessInfo: 'PostBus stop right beside landing field to Lauterbrunnen station.',
      slotId: 'slot_ch_lauterbrunnen_03'
    },
    verticalDropM: 776,
    flightDurationMin: 30,
    glideRatio: '1:7.8 (Valley Wall Soaring)',
    pathCoordinates: [
      [46.5594, 7.8927],
      [46.5575, 7.8955],
      [46.5560, 7.8980],
      [46.5541, 7.9018]
    ]
  },
  {
    id: 'route_chamonix',
    slotId: 'slot_fr_chamonix_04',
    title: 'Chamonix Planpraz to Bois du Bouchet',
    region: 'Chamonix / Mont-Blanc',
    takeoff: {
      id: 'takeoff_chamonix',
      name: 'Chamonix Planpraz Mont-Blanc (Take-off)',
      type: 'takeoff',
      lat: 45.9322,
      lng: 6.8580,
      altitudeM: 2000,
      region: 'Chamonix',
      countryCode: 'FR',
      description: 'Brévent slope launch directly opposite the Bossons Glacier and Mont-Blanc 4810m.',
      accessInfo: 'Télécabine de Planpraz departure plaza from Chamonix town center',
      windOrientation: 'S · SW · Valley Updraft',
      slotId: 'slot_fr_chamonix_04'
    },
    landing: {
      id: 'landing_chamonix',
      name: 'Bois du Bouchet Chamonix (Landing)',
      type: 'landing',
      lat: 45.9268,
      lng: 6.8775,
      altitudeM: 1035,
      region: 'Chamonix',
      countryCode: 'FR',
      description: 'Wide official landing field adjacent to the parapente school and chalet.',
      accessInfo: '10 min walk along Arve river to Chamonix center or free ski shuttle.',
      slotId: 'slot_fr_chamonix_04'
    },
    verticalDropM: 965,
    flightDurationMin: 25,
    glideRatio: '1:8.6 (Alpine Ridge Glide)',
    pathCoordinates: [
      [45.9322, 6.8580],
      [45.9305, 6.8640],
      [45.9285, 6.8710],
      [45.9268, 6.8775]
    ]
  }
];

export interface FlightSlotsMapVisualizationProps {
  slots: FlightSlotData[];
  onSelectSlotToBook: (slot: FlightSlotData) => void;
  selectedSlotId?: string | null;
}

type MapTileTheme = 'topo' | 'osm';
type LayerFilter = 'all' | 'takeoffs' | 'landings';

export const FlightSlotsMapVisualization: React.FC<FlightSlotsMapVisualizationProps> = ({
  slots,
  onSelectSlotToBook,
  selectedSlotId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [tileTheme, setTileTheme] = useState<MapTileTheme>('osm');
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [showFlightPaths, setShowFlightPaths] = useState<boolean>(true);
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activeSpatialRoute, setActiveSpatialRoute] = useState<AlpineFlightRoute | null>(
    ALPINE_SPATIAL_ROUTES[0]
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Map slots lookup by ID
  const slotsMap = useMemo(() => {
    const map = new Map<string, FlightSlotData>();
    slots.forEach((s) => map.set(s.slotId, s));
    return map;
  }, [slots]);

  // Regions for quick navigation
  const REGION_BOUNDS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
    all: { center: [46.40, 7.45], zoom: 8, label: 'All Alps (CH & FR)' },
    interlaken: { center: [46.6923, 7.8276], zoom: 13, label: 'Interlaken (Beatenberg)' },
    zermatt: { center: [46.0202, 7.7632], zoom: 14, label: 'Zermatt (Matterhorn)' },
    lauterbrunnen: { center: [46.5567, 7.8972], zoom: 14, label: 'Lauterbrunnen (Schilthorn)' },
    chamonix: { center: [45.9295, 6.8677], zoom: 13, label: 'Chamonix (Mont-Blanc)' }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Create Map
    const initial = REGION_BOUNDS.all;
    const map = L.map(mapContainerRef.current, {
      center: initial.center,
      zoom: initial.zoom,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true
    });

    // Add Attribution in bottom right with sleek styling
    L.control
      .attribution({
        position: 'bottomright',
        prefix: '2paraglide Spatial Telemetry · Leaflet'
      })
      .addTo(map);

    // Zoom controls custom position
    L.control.zoom({ position: 'topright' }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  }, [isFullscreen]);

  // Handle Tile Provider Updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let subdomains = 'abc';
    let maxZoom = 19;

    if (tileTheme === 'topo') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
      maxZoom = 17;
    } else {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
      maxZoom = 19;
    }

    const tileLayer = L.tileLayer(tileUrl, {
      subdomains,
      maxZoom,
      attribution:
        tileTheme === 'topo'
          ? '&copy; OpenTopoMap &copy; OSM'
          : '&copy; OpenStreetMap'
    });

    tileLayer.addTo(map);
  }, [tileTheme]);

  // Handle Markers & Vectors Rendering
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // Create custom SVG DivIcons for Takeoff (Crimson) and Landing (Emerald)
    const createTakeoffIcon = (isSelected: boolean, altitudeM: number) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            transform: translate(-50%, -100%);
            cursor: pointer;
          ">
            <div style="
              background: ${isSelected ? '#FFFFFF' : '#E62B1E'};
              color: ${isSelected ? '#E62B1E' : '#FFFFFF'};
              border: 2px solid #FFFFFF;
              border-radius: 9999px;
              padding: 4px 8px;
              font-family: monospace;
              font-size: 10px;
              font-weight: 800;
              box-shadow: 0 4px 12px rgba(230, 43, 30, 0.45);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="font-size: 11px;">🪂</span>
              <span>LAUNCH ${altitudeM}m</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${isSelected ? '#FFFFFF' : '#E62B1E'};
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    const createLandingIcon = (isSelected: boolean, altitudeM: number) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            transform: translate(-50%, -100%);
            cursor: pointer;
          ">
            <div style="
              background: ${isSelected ? '#FFFFFF' : '#10B981'};
              color: ${isSelected ? '#10B981' : '#FFFFFF'};
              border: 2px solid #FFFFFF;
              border-radius: 9999px;
              padding: 4px 8px;
              font-family: monospace;
              font-size: 10px;
              font-weight: 800;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="font-size: 11px;">🎯</span>
              <span>LANDING ${altitudeM}m</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${isSelected ? '#FFFFFF' : '#10B981'};
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    ALPINE_SPATIAL_ROUTES.forEach((route) => {
      const slot = slotsMap.get(route.slotId);
      const isRouteSelected = activeSpatialRoute?.id === route.id || selectedSlotId === route.slotId;

      // Draw Flight Path Polylines (Dashed Alpine Vectors)
      if (showFlightPaths) {
        const polyline = L.polyline(route.pathCoordinates, {
          color: isRouteSelected ? '#E62B1E' : '#8A8A8A',
          weight: isRouteSelected ? 4 : 2.5,
          dashArray: isRouteSelected ? undefined : '6, 8',
          opacity: isRouteSelected ? 0.95 : 0.65
        });

        polyline.on('click', () => {
          setActiveSpatialRoute(route);
        });

        polyline.addTo(layersGroup);
      }

      // Add Take-off Marker
      if (layerFilter === 'all' || layerFilter === 'takeoffs') {
        const takeoffMarker = L.marker([route.takeoff.lat, route.takeoff.lng], {
          icon: createTakeoffIcon(isRouteSelected, route.takeoff.altitudeM)
        });

        takeoffMarker.on('click', () => {
          setActiveSpatialRoute(route);
        });

        // Interactive Popup
        const priceText = slot ? formatCurrency(slot.priceCents, slot.currency) : 'CHF 240.00';
        const pilotName = slot ? slot.pilotName : 'Certified Swiss Pilot';
        const weatherText = slot ? slot.weatherStatus.toUpperCase() : 'OPTIMAL';

        takeoffMarker.bindPopup(`
          <div style="font-family: -apple-system, sans-serif; color: #111111; min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #E62B1E; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">LAUNCH SITE</span>
              <span style="font-size: 11px; font-weight: 700; color: #555555;">${route.takeoff.countryCode}</span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #111111; margin-bottom: 4px;">${route.takeoff.name}</div>
            <div style="font-size: 11px; color: #444444; margin-bottom: 6px;">
              Elevation: <strong>${route.takeoff.altitudeM}m ASL</strong> · Wind: <strong>${route.takeoff.windOrientation || 'Variable'}</strong>
            </div>
            <div style="background: #F3F4F6; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
              <div>Pilot: <strong>${pilotName}</strong></div>
              <div>Price: <strong style="color: #E62B1E;">${priceText}</strong> · Weather: <strong>${weatherText}</strong></div>
            </div>
            <button id="book-btn-${route.slotId}" style="
              width: 100%;
              background: #E62B1E;
              color: #FFFFFF;
              border: none;
              padding: 7px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              Book This Slot (${priceText}) →
            </button>
          </div>
        `);

        takeoffMarker.on('popupopen', () => {
          const btn = document.getElementById(`book-btn-${route.slotId}`);
          if (btn && slot) {
            btn.onclick = () => {
              onSelectSlotToBook(slot);
            };
          }
        });

        takeoffMarker.addTo(layersGroup);
      }

      // Add Landing Zone Marker
      if (layerFilter === 'all' || layerFilter === 'landings') {
        const landingMarker = L.marker([route.landing.lat, route.landing.lng], {
          icon: createLandingIcon(isRouteSelected, route.landing.altitudeM)
        });

        landingMarker.on('click', () => {
          setActiveSpatialRoute(route);
        });

        landingMarker.bindPopup(`
          <div style="font-family: -apple-system, sans-serif; color: #111111; min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #10B981; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 4px;">LANDING ZONE</span>
              <span style="font-size: 11px; font-weight: 700; color: #555555;">${route.landing.countryCode}</span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #111111; margin-bottom: 4px;">${route.landing.name}</div>
            <div style="font-size: 11px; color: #444444; margin-bottom: 6px;">
              Elevation: <strong>${route.landing.altitudeM}m ASL</strong> (Vertical drop: ${route.verticalDropM}m)
            </div>
            <div style="font-size: 11px; color: #666666; margin-bottom: 6px;">
              ${route.landing.description}
            </div>
            <div style="font-size: 10px; color: #888888; border-top: 1px solid #E5E7EB; padding-top: 4px;">
              Drop-off: ${route.landing.accessInfo}
            </div>
          </div>
        `);

        landingMarker.addTo(layersGroup);
      }
    });
  }, [
    slotsMap,
    activeSpatialRoute,
    selectedSlotId,
    layerFilter,
    showFlightPaths,
    onSelectSlotToBook
  ]);

  // Fly to Region when clicked
  const handleJumpToRegion = (regionKey: string) => {
    setActiveRegion(regionKey);
    const map = mapInstanceRef.current;
    if (!map) return;

    const target = REGION_BOUNDS[regionKey];
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 1.2 });
    }

    // Match route if applicable
    if (regionKey === 'interlaken') {
      setActiveSpatialRoute(ALPINE_SPATIAL_ROUTES[0]);
    } else if (regionKey === 'zermatt') {
      setActiveSpatialRoute(ALPINE_SPATIAL_ROUTES[1]);
    } else if (regionKey === 'lauterbrunnen') {
      setActiveSpatialRoute(ALPINE_SPATIAL_ROUTES[2]);
    } else if (regionKey === 'chamonix') {
      setActiveSpatialRoute(ALPINE_SPATIAL_ROUTES[3]);
    }
  };

  return (
    <div
      className={`w-full bg-[#181818] border border-[#8A8A8A]/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col rounded-none' : 'relative'
      }`}
    >
      {/* Map Control Bar */}
      <div className="bg-[#111111] border-b border-[#8A8A8A]/25 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#E62B1E]" />
            <span>Interactive Flight Slot &amp; Landing Zone Spatial Map</span>
          </h3>
        </div>

        {/* Region Fast Jump Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(REGION_BOUNDS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleJumpToRegion(key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeRegion === key
                  ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                  : 'bg-[#181818] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Quick Toggles Toolbar */}
      <div className="bg-[#141414] border-b border-[#8A8A8A]/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layer Filters */}
        <div className="flex items-center gap-2">
          <span className="text-[#8A8A8A] font-mono text-[11px] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#E62B1E]" />
            <span>Show:</span>
          </span>
          <div className="inline-flex rounded-lg bg-[#111111] p-0.5 border border-[#8A8A8A]/20">
            <button
              onClick={() => setLayerFilter('all')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                layerFilter === 'all'
                  ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              All Zones
            </button>
            <button
              onClick={() => setLayerFilter('takeoffs')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                layerFilter === 'takeoffs'
                  ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              🪂 Launch Sites
            </button>
            <button
              onClick={() => setLayerFilter('landings')}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                layerFilter === 'landings'
                  ? 'bg-[#10B981] text-[#FFFFFF] font-semibold'
                  : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              🎯 Landing Zones
            </button>
          </div>

          {/* Glide Paths Vector Toggle */}
          <button
            onClick={() => setShowFlightPaths(!showFlightPaths)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showFlightPaths
                ? 'bg-[#181818] border-[#E62B1E] text-[#FFFFFF]'
                : 'bg-[#111111] border-[#8A8A8A]/25 text-[#8A8A8A]'
            }`}
          >
            <Navigation className="w-3 h-3 text-[#E62B1E]" />
            <span>Glide Trajectories: {showFlightPaths ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Tile Theme & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <span className="text-[#8A8A8A]">Tile:</span>
            <button
              onClick={() => setTileTheme('topo')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                tileTheme === 'topo'
                  ? 'bg-[#E62B1E] text-[#FFFFFF]'
                  : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              Topography
            </button>
            <button
              onClick={() => setTileTheme('osm')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                tileTheme === 'osm'
                  ? 'bg-[#E62B1E] text-[#FFFFFF]'
                  : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
              }`}
            >
              Standard OSM
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/30 rounded-md transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Map Body: Full Screen Width (Info sidebar removed) */}
      <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[660px]">
        {/* Leaflet Canvas Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full bg-[#111111] z-10"
        />
      </div>
    </div>
  );
};
