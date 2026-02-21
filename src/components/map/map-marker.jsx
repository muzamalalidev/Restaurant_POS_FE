import { Marker } from 'react-map-gl/mapbox';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

export function MapMarker({ color = 'error.main', iconSx, children, ...other }) {
  return (
    <Marker {...other}>
      {children || (
        <Iconify 
          icon="custom:location-fill" 
          sx={[{ color }, ...(Array.isArray(iconSx) ? iconSx : iconSx ? [iconSx] : [])]} 
        />
      )}
    </Marker>
  );
}
